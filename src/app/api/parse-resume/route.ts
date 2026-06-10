import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  // Verify the user is authenticated
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const fileName = file.name.toLowerCase()

  // Validate file size (max 10 MB)
  const MAX_BYTES = 10 * 1024 * 1024
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File is too large. Maximum size is 10 MB.' }, { status: 400 })
  }
  if (file.size === 0) {
    return NextResponse.json({ error: 'File appears to be empty.' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  let text = ''

  try {
    if (fileName.endsWith('.pdf')) {
      // pdf-parse v1: import the lib entry directly. The package index runs a
      // debug harness that reads a bundled test PDF and crashes when bundled.
      // v1's pdf.js works in serverless Node (v2 needs browser DOMMatrix globals).
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse/lib/pdf-parse.js') as (buf: Buffer) => Promise<{ text: string }>
      const result = await pdfParse(buffer)
      text = result.text
    } else if (fileName.endsWith('.docx')) {
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      text = result.value
    } else if (fileName.endsWith('.doc')) {
      return NextResponse.json(
        { error: 'Legacy .doc files are not supported. Please re-save as .docx or PDF and try again.' },
        { status: 400 }
      )
    } else {
      return NextResponse.json({ error: 'Unsupported file type. Upload a PDF or .docx file.' }, { status: 400 })
    }
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'Unknown parsing error'
    console.error('Parse failed:', detail)
    return NextResponse.json(
      { error: `Could not read this file. It may be corrupted or password-protected. (${detail})` },
      { status: 422 }
    )
  }

  // Guard against image-based PDFs (scanned) that yield no extractable text
  if (text.trim().length < 20) {
    return NextResponse.json(
      {
        error:
          'We could not extract readable text. If this is a scanned or image-based PDF, please upload a text-based version or a .docx file.',
      },
      { status: 422 }
    )
  }

  // Store the file in Supabase Storage under the user's folder
  const storagePath = `${user.id}/${Date.now()}-${file.name}`
  const { error: storageError } = await supabase.storage
    .from('resumes')
    .upload(storagePath, buffer, { contentType: file.type, upsert: false })

  if (storageError) {
    // Non-fatal — return parsed text even if storage fails
    console.error('Storage upload failed:', storageError.message)
  }

  // Save resume record to the database
  const { data: resumeRow, error: dbError } = await supabase
    .from('resumes')
    .insert({
      user_id: user.id,
      original_text: text.trim(),
      file_url: storageError ? null : storagePath,
    })
    .select('id')
    .single()

  if (dbError) {
    console.error('DB insert failed:', dbError.message)
  }

  return NextResponse.json({
    text: text.trim(),
    resumeId: resumeRow?.id ?? null,
  })
}
