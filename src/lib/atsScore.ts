// Simple keyword-frequency based ATS approximation.
// NOT a real ATS — just a heuristic to give the user directional feedback.

const STOPWORDS = new Set([
  'the', 'and', 'a', 'an', 'to', 'of', 'in', 'on', 'for', 'with', 'is', 'are',
  'as', 'at', 'by', 'be', 'this', 'that', 'or', 'will', 'we', 'you', 'your',
  'our', 'their', 'they', 'it', 'its', 'from', 'have', 'has', 'had', 'but',
  'not', 'can', 'all', 'any', 'into', 'such', 'who', 'what', 'which', 'when',
  'where', 'why', 'how', 'i', 'us', 'if', 'than', 'then', 'so', 'do', 'does',
  'about', 'job', 'role', 'work', 'team', 'company', 'years', 'year', 'including',
])

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#./\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))
}

export interface KeywordHit {
  keyword: string
  count: number
}

/** Pull the top N most frequent meaningful keywords from a job description. */
export function extractKeywords(jobDescription: string, limit = 20): KeywordHit[] {
  const counts = new Map<string, number>()
  for (const word of tokenize(jobDescription)) {
    counts.set(word, (counts.get(word) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([keyword, count]) => ({ keyword, count }))
}

export interface ScoreResult {
  score: number // 0-100
  matched: string[]
  missing: string[]
}

/** Score how well a resume's text covers the JD's top keywords (0-100). */
export function scoreAgainstKeywords(resumeText: string, keywords: KeywordHit[]): ScoreResult {
  if (keywords.length === 0) return { score: 0, matched: [], missing: [] }

  const lowerResume = resumeText.toLowerCase()
  const matched: string[] = []
  const missing: string[] = []

  for (const { keyword } of keywords) {
    if (lowerResume.includes(keyword)) matched.push(keyword)
    else missing.push(keyword)
  }

  const score = Math.round((matched.length / keywords.length) * 100)
  return { score, matched, missing }
}

/** Flatten the structured revised-resume JSON into plain text for scoring/diffing. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function flattenResumeJson(data: Record<string, any>): string {
  const parts: string[] = []

  function walk(val: unknown) {
    if (val === null || val === undefined) return
    if (typeof val === 'string') parts.push(val)
    else if (typeof val === 'number' || typeof val === 'boolean') parts.push(String(val))
    else if (Array.isArray(val)) val.forEach(walk)
    else if (typeof val === 'object') Object.values(val).forEach(walk)
  }

  walk(data)
  return parts.join('\n')
}
