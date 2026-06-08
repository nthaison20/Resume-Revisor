'use client'

import HighlightedText from './HighlightedText'

// Safely convert any value to a renderable string
function str(val: unknown): string {
  if (val === null || val === undefined) return ''
  if (typeof val === 'string') return val
  if (typeof val === 'number' || typeof val === 'boolean') return String(val)
  if (Array.isArray(val)) return val.map(str).join(', ')
  if (typeof val === 'object') return Object.values(val as Record<string, unknown>).map(str).join(' · ')
  return String(val)
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">{title}</h3>
      {children}
    </section>
  )
}

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>
  /** JD keywords to highlight inline — pass [] to disable highlighting. */
  highlightKeywords?: string[]
}

export default function RevisedResume({ data, highlightKeywords = [] }: Props) {
  const { summary, experience, skills, education, ...rest } = data
  const hl = (text: string) =>
    highlightKeywords.length ? <HighlightedText text={text} keywords={highlightKeywords} /> : text

  return (
    <div className="space-y-5 text-sm text-gray-800">

      {summary && (
        <Section title="Summary">
          <p className="leading-relaxed">{hl(str(summary))}</p>
        </Section>
      )}

      {experience && Array.isArray(experience) && experience.length > 0 && (
        <Section title="Experience">
          <div className="space-y-4">
            {experience.map((job: unknown, i: number) => {
              if (typeof job !== 'object' || !job) return <p key={i}>{str(job)}</p>
              const j = job as Record<string, unknown>
              const bullets: unknown[] = Array.isArray(j.bullets) ? j.bullets : []
              return (
                <div key={i}>
                  <div className="flex items-baseline justify-between">
                    <p className="font-medium">{str(j.title ?? j.position ?? j.role ?? '')}</p>
                    <p className="text-gray-400 text-xs">{str(j.dates ?? j.date ?? j.duration ?? '')}</p>
                  </div>
                  <p className="text-gray-500 mb-1">{str(j.company ?? j.organization ?? '')}</p>
                  {bullets.length > 0 ? (
                    <ul className="list-disc list-inside space-y-0.5 text-gray-700">
                      {bullets.map((b, k) => <li key={k}>{hl(str(b))}</li>)}
                    </ul>
                  ) : j.description ? (
                    <p className="text-gray-700">{hl(str(j.description))}</p>
                  ) : null}
                </div>
              )
            })}
          </div>
        </Section>
      )}

      {skills && (
        <Section title="Skills">
          <p className="leading-relaxed">{hl(Array.isArray(skills) ? skills.join(', ') : str(skills))}</p>
        </Section>
      )}

      {education && (
        <Section title="Education">
          {Array.isArray(education) ? (
            <div className="space-y-3">
              {education.map((edu: unknown, i: number) => (
                <div key={i}><p>{str(edu)}</p></div>
              ))}
            </div>
          ) : typeof education === 'object' ? (
            <div>
              {Object.entries(education as Record<string, unknown>).map(([k, v]) => (
                <p key={k}><span className="capitalize text-gray-500">{k}: </span>{str(v)}</p>
              ))}
            </div>
          ) : (
            <p className="leading-relaxed">{str(education)}</p>
          )}
        </Section>
      )}

      {/* Render any unexpected top-level keys Claude added */}
      {Object.entries(rest).map(([key, val]) =>
        val ? (
          <Section key={key} title={key.replace(/_/g, ' ')}>
            <p className="leading-relaxed">{str(val)}</p>
          </Section>
        ) : null
      )}

    </div>
  )
}
