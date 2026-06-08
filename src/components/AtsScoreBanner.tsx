'use client'

interface Props {
  before: number
  after: number
  newlyAdded: string[]
}

export default function AtsScoreBanner({ before, after, newlyAdded }: Props) {
  const delta = after - before
  const deltaColor = delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-600' : 'text-gray-500'

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">ATS Match Score</h3>
        <span className={`text-sm font-medium ${deltaColor}`}>
          {before}% → {after}% {delta !== 0 && `(${delta > 0 ? '+' : ''}${delta})`}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <p className="text-xs text-gray-400 mb-1">Before</p>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gray-400 rounded-full" style={{ width: `${before}%` }} />
          </div>
        </div>
        <div className="flex-1">
          <p className="text-xs text-gray-400 mb-1">After</p>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${after}%` }} />
          </div>
        </div>
      </div>

      {newlyAdded.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-2">Why the score improved</p>
          <p className="text-sm text-gray-600 leading-relaxed">
            The revision added keywords from the job description that were missing before:{' '}
            {newlyAdded.slice(0, 8).map((kw, i) => (
              <span key={kw}>
                <span className="inline-block bg-green-50 text-green-700 border border-green-200 rounded px-1.5 py-0.5 text-xs font-medium">
                  {kw}
                </span>
                {i < Math.min(newlyAdded.length, 8) - 1 ? ' ' : ''}
              </span>
            ))}
          </p>
        </div>
      )}

      <p className="mt-3 text-xs text-gray-400">
        Approximation only — based on keyword frequency, not a real ATS engine.
      </p>
    </div>
  )
}
