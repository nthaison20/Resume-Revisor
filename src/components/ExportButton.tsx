'use client'

import { useState } from 'react'

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  revisedJson: Record<string, any>
}

export default function ExportButton({ revisedJson }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    // Dynamic import keeps jsPDF out of the server bundle
    const { exportResumeToPdf } = await import('@/lib/exportPdf')
    exportResumeToPdf(revisedJson, 'revised-resume.pdf')
    setLoading(false)
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {loading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          Generating…
        </>
      ) : (
        <>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
          </svg>
          Export as PDF
        </>
      )}
    </button>
  )
}
