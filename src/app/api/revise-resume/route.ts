import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { extractKeywords, scoreAgainstKeywords, flattenResumeJson } from '@/lib/atsScore'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { resumeText, jobDescription, resumeId } = body as {
    resumeText: string
    jobDescription: string
    resumeId: string | null
  }

  if (!resumeText || !jobDescription) {
    return NextResponse.json({ error: 'resumeText and jobDescription are required.' }, { status: 400 })
  }

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 4096,
    system: `You are a professional resume editor helping a student tailor their resume to a specific job description.

Your goals:
1. Optimize the resume for ATS (Applicant Tracking Systems) by incorporating relevant keywords from the job description naturally
2. Rewrite bullets to better reflect the language and priorities of the job description
3. Improve clarity, impact, and specificity of bullet points
4. Never fabricate experience, skills, certifications, or achievements that are not present in the original resume
5. Preserve the candidate's voice and factual content

Return the revised resume structured as a JSON object with the following sections:
{
  "summary": "...",
  "experience": [{ "title": "...", "company": "...", "dates": "...", "bullets": ["..."] }],
  "skills": "...",
  "education": "..."
}

Only return the JSON object. No preamble, no explanation, no markdown fences.`,
    messages: [
      {
        role: 'user',
        content: `ORIGINAL RESUME:\n${resumeText}\n\nJOB DESCRIPTION:\n${jobDescription}`,
      },
    ],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text : ''

  // Strip markdown code fences if the model wrapped the JSON anyway
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

  let revisedJson: unknown
  try {
    revisedJson = JSON.parse(cleaned)
  } catch {
    return NextResponse.json({ error: 'AI returned malformed JSON. Try again.', raw }, { status: 500 })
  }

  // ATS scoring — keyword-frequency approximation
  const keywords = extractKeywords(jobDescription, 20)
  const before = scoreAgainstKeywords(resumeText, keywords)
  const after = scoreAgainstKeywords(flattenResumeJson(revisedJson as Record<string, unknown>), keywords)

  // Keywords the revision newly picked up — basis for "reasoning" hints
  const newlyAdded = after.matched.filter((k) => !before.matched.includes(k))

  // Save revision to Supabase
  const { data: revision, error: dbError } = await supabase
    .from('revisions')
    .insert({
      user_id: user.id,
      resume_id: resumeId ?? null,
      job_description: jobDescription,
      revised_json: revisedJson,
      score_before: before.score,
      score_after: after.score,
    })
    .select('id')
    .single()

  if (dbError) {
    console.error('Revision DB insert failed:', dbError.message)
  }

  return NextResponse.json({
    revisedJson,
    revisionId: revision?.id ?? null,
    score: {
      before: before.score,
      after: after.score,
      matchedBefore: before.matched,
      matchedAfter: after.matched,
      newlyAdded,
      missing: after.missing,
    },
  })
}
