'use client'

import { useEffect, useState, useCallback } from 'react'

interface Revision {
  id: string
  name: string | null
  job_description: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  revised_json: Record<string, any>
  score_before: number | null
  score_after: number | null
  created_at: string
}

export default function RevisionHistory({ refreshKey }: { refreshKey?: number }) {
  const [revisions, setRevisions] = useState<Revision[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/revisions')
      const json = await res.json()
      if (!res.ok) setError(json.error ?? 'Failed to load history.')
      else setRevisions(json.revisions)
    } catch {
      setError('Failed to load history.')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load, refreshKey])

  async function handleDownload(rev: Revision) {
    setDownloadingId(rev.id)
    const { exportResumeToPdf } = await import('@/lib/exportPdf')
    const stamp = new Date(rev.created_at).toISOString().slice(0, 10)
    // Build a filesystem-safe filename from the user's name, else fall back to a date
    const slug = rev.name
      ? rev.name.trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase()
      : ''
    const fileName = slug ? `${slug}.pdf` : `revised-resume-${stamp}.pdf`
    exportResumeToPdf(rev.revised_json, fileName)
    setDownloadingId(null)
  }

  function startEdit(rev: Revision) {
    setEditingId(rev.id)
    setEditValue(rev.name ?? '')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditValue('')
  }

  async function saveEdit(id: string) {
    setSavingId(id)
    const newName = editValue.trim() || null
    try {
      const res = await fetch('/api/revisions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: newName }),
      })
      if (res.ok) {
        setRevisions((prev) => prev.map((r) => (r.id === id ? { ...r, name: newName } : r)))
        setEditingId(null)
        setEditValue('')
      }
    } finally {
      setSavingId(null)
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
    })
  }

  if (loading) {
    return <p className="text-sm text-gray-400 py-4">Loading history…</p>
  }

  if (error) {
    return <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
  }

  if (revisions.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-6 text-center">
        No revisions yet. Your past resume revisions will appear here.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {revisions.map((rev) => {
        const delta = (rev.score_after ?? 0) - (rev.score_before ?? 0)
        return (
          <div
            key={rev.id}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white border border-gray-200 rounded-xl p-4"
          >
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-400">{formatDate(rev.created_at)}</p>

              {editingId === rev.id ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    autoFocus
                    type="text"
                    value={editValue}
                    maxLength={80}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit(rev.id)
                      if (e.key === 'Escape') cancelEdit()
                    }}
                    placeholder="Revision name"
                    className="flex-1 min-w-0 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => saveEdit(rev.id)}
                    disabled={savingId === rev.id}
                    className="text-sm font-medium text-blue-600 hover:underline disabled:opacity-50"
                  >
                    {savingId === rev.id ? 'Saving…' : 'Save'}
                  </button>
                  <button onClick={cancelEdit} className="text-sm text-gray-400 hover:text-gray-700">
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-0.5">
                  {rev.name ? (
                    <p className="text-sm font-medium text-gray-900 truncate">{rev.name}</p>
                  ) : (
                    <p className="text-sm text-gray-700 truncate">
                      {rev.job_description?.slice(0, 80) || 'Untitled revision'}
                      {rev.job_description && rev.job_description.length > 80 ? '…' : ''}
                    </p>
                  )}
                  <button
                    onClick={() => startEdit(rev)}
                    className="shrink-0 text-xs text-gray-400 hover:text-blue-600"
                  >
                    Rename
                  </button>
                </div>
              )}

              {rev.name && editingId !== rev.id && (
                <p className="text-xs text-gray-500 truncate">
                  {rev.job_description?.slice(0, 80) || ''}
                  {rev.job_description && rev.job_description.length > 80 ? '…' : ''}
                </p>
              )}
              {rev.score_before !== null && rev.score_after !== null && (
                <p className="text-xs mt-1">
                  <span className="text-gray-500">ATS: {rev.score_before}% → {rev.score_after}%</span>
                  {delta !== 0 && (
                    <span className={delta > 0 ? 'text-green-600 ml-1' : 'text-red-600 ml-1'}>
                      ({delta > 0 ? '+' : ''}{delta})
                    </span>
                  )}
                </p>
              )}
            </div>

            <button
              onClick={() => handleDownload(rev)}
              disabled={downloadingId === rev.id}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 disabled:opacity-50 transition-colors"
            >
              {downloadingId === rev.id ? (
                'Generating…'
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                  </svg>
                  PDF
                </>
              )}
            </button>
          </div>
        )
      })}
    </div>
  )
}
