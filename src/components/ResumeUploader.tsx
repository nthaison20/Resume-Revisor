'use client'

import { useState, useRef, DragEvent } from 'react'

interface Props {
  onParsed: (text: string, resumeId: string | null) => void
}

export default function ResumeUploader({ onParsed }: Props) {
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function uploadFile(file: File) {
    setError(null)
    setLoading(true)

    const form = new FormData()
    form.append('file', file)

    const res = await fetch('/api/parse-resume', { method: 'POST', body: form })
    const json = await res.json()

    if (!res.ok) {
      setError(json.error ?? 'Something went wrong.')
    } else {
      onParsed(json.text, json.resumeId)
    }
    setLoading(false)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`
        cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-colors
        ${dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 bg-white'}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx"
        className="hidden"
        onChange={handleChange}
      />

      {loading ? (
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="text-sm text-gray-500">Parsing your resume…</p>
        </div>
      ) : (
        <>
          <div className="text-4xl mb-3">📄</div>
          <p className="text-sm font-medium text-gray-700">
            Drag &amp; drop your resume here, or <span className="text-blue-600">browse</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">PDF or Word (.docx) · Max 10 MB</p>
        </>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
    </div>
  )
}
