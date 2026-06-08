'use client'

import RevisedResume from './RevisedResume'
import HighlightedText from './HighlightedText'
import AtsScoreBanner from './AtsScoreBanner'
import ExportButton from './ExportButton'

interface ScoreData {
  before: number
  after: number
  matchedBefore: string[]
  matchedAfter: string[]
  newlyAdded: string[]
  missing: string[]
}

interface Props {
  originalText: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  revisedJson: Record<string, any>
  score: ScoreData
}

export default function ComparisonView({ originalText, revisedJson, score }: Props) {
  return (
    <div className="space-y-5">
      <AtsScoreBanner before={score.before} after={score.after} newlyAdded={score.newlyAdded} />

      <div className="flex justify-end">
        <ExportButton revisedJson={revisedJson} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-500">Original</h3>
            <span className="text-xs text-gray-400">{score.matchedBefore.length} keyword matches</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 max-h-[32rem] overflow-y-auto">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
              <HighlightedText text={originalText} keywords={score.matchedBefore} />
            </pre>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-blue-600">Revised</h3>
            <span className="text-xs text-gray-400">{score.matchedAfter.length} keyword matches</span>
          </div>
          <div className="bg-white border border-blue-200 rounded-xl p-5 max-h-[32rem] overflow-y-auto">
            <RevisedResume data={revisedJson} highlightKeywords={score.matchedAfter} />
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center">
        Highlighted words are job-description keywords found in each version.
      </p>
    </div>
  )
}
