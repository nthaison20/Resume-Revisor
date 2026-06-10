'use client'

import { useState } from 'react'
import ResumeUploader from '@/components/ResumeUploader'
import ComparisonView from '@/components/ComparisonView'
import RevisionHistory from '@/components/RevisionHistory'

type Step = 'upload' | 'job-description' | 'revised'

interface ScoreData {
  before: number
  after: number
  matchedBefore: string[]
  matchedAfter: string[]
  newlyAdded: string[]
  missing: string[]
}

export default function DashboardClient() {
  const [step, setStep] = useState<Step>('upload')
  const [resumeText, setResumeText] = useState('')
  const [resumeId, setResumeId] = useState<string | null>(null)
  const [jobDescription, setJobDescription] = useState('')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [revisedJson, setRevisedJson] = useState<Record<string, any> | null>(null)
  const [score, setScore] = useState<ScoreData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Bumped after each successful revision to refresh the history list
  const [historyKey, setHistoryKey] = useState(0)

  function handleParsed(text: string, id: string | null) {
    setResumeText(text)
    setResumeId(id)
    setStep('job-description')
  }

  async function handleRevise() {
    setLoading(true)
    setError(null)

    const res = await fetch('/api/revise-resume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeText, jobDescription, resumeId }),
    })

    const json = await res.json()
    if (!res.ok) {
      setError(json.error ?? 'Something went wrong.')
    } else {
      setRevisedJson(json.revisedJson)
      setScore(json.score)
      setHistoryKey((k) => k + 1)
      setStep('revised')
    }
    setLoading(false)
  }

  function handleReset() {
    setResumeText('')
    setResumeId(null)
    setJobDescription('')
    setRevisedJson(null)
    setScore(null)
    setError(null)
    setStep('upload')
  }

  function renderStep() {
  // ── Upload step ──────────────────────────────────────────────────────────
  if (step === 'upload') {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Upload your resume</h2>
          <p className="text-sm text-gray-500 mt-1">We&apos;ll extract the text so AI can revise it.</p>
        </div>
        <ResumeUploader onParsed={handleParsed} />
      </div>
    )
  }

  // ── Job description step ─────────────────────────────────────────────────
  if (step === 'job-description') {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Paste the job description</h2>
            <p className="text-sm text-gray-500 mt-1">AI will tailor your resume to match this role.</p>
          </div>
          <button onClick={handleReset} className="text-sm text-gray-400 hover:text-gray-700 underline">
            Start over
          </button>
        </div>

        {/* Parsed resume preview (collapsed) */}
        <details className="bg-gray-50 border border-gray-200 rounded-xl">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-gray-600 select-none">
            View extracted resume text
          </summary>
          <pre className="px-4 pb-4 text-xs text-gray-500 whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto">
            {resumeText}
          </pre>
        </details>

        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the full job description here…"
          rows={12}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          onClick={handleRevise}
          disabled={loading || jobDescription.trim().length < 50}
          className="w-full py-3 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Revising with AI…
            </span>
          ) : (
            'Revise my resume →'
          )}
        </button>
      </div>
    )
  }

  // ── Comparison + score step ──────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Before &amp; after</h2>
          <p className="text-sm text-gray-500 mt-1">Side-by-side comparison with ATS match scoring.</p>
        </div>
        <button onClick={handleReset} className="text-sm text-gray-400 hover:text-gray-700 underline">
          Start over
        </button>
      </div>

      {revisedJson && score && (
        <ComparisonView originalText={resumeText} revisedJson={revisedJson} score={score} />
      )}
    </div>
  )
  }

  return (
    <div className="space-y-10">
      {renderStep()}

      {/* ── Revision history ──────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Revision history</h2>
            <p className="text-sm text-gray-500">Download any past revision as a PDF.</p>
          </div>
        </div>
        <RevisionHistory refreshKey={historyKey} />
      </section>
    </div>
  )
}
