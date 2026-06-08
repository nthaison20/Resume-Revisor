import jsPDF from 'jspdf'

// ── helpers ──────────────────────────────────────────────────────────────────

function safe(val: unknown): string {
  if (val === null || val === undefined) return ''
  if (typeof val === 'string') return val
  if (typeof val === 'number' || typeof val === 'boolean') return String(val)
  if (Array.isArray(val)) return val.map(safe).join(', ')
  if (typeof val === 'object') return Object.values(val as Record<string, unknown>).map(safe).join(', ')
  return String(val)
}

const PAGE_W = 210      // A4 mm
const MARGIN = 18
const CONTENT_W = PAGE_W - MARGIN * 2

// Write wrapped text and return new Y position
function writeWrapped(doc: jsPDF, text: string, x: number, y: number, maxW: number, lineH: number): number {
  const lines = doc.splitTextToSize(text, maxW) as string[]
  lines.forEach((line: string) => {
    doc.text(line, x, y)
    y += lineH
  })
  return y
}

// Section heading with an underline rule
function sectionHeading(doc: jsPDF, title: string, y: number): number {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(80, 80, 80)
  doc.text(title.toUpperCase(), MARGIN, y)
  y += 1.5
  doc.setDrawColor(200, 200, 200)
  doc.line(MARGIN, y, PAGE_W - MARGIN, y)
  return y + 4
}

// ── main export function ──────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function exportResumeToPdf(data: Record<string, any>, fileName = 'revised-resume.pdf') {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageH = doc.internal.pageSize.getHeight()

  let y = MARGIN

  // Guard: add a new page if we're near the bottom
  function checkPageBreak(needed = 8) {
    if (y + needed > pageH - MARGIN) {
      doc.addPage()
      y = MARGIN
    }
  }

  // ── Name / header ──────────────────────────────────────────────────────────
  const name: string = safe(data.name ?? data.full_name ?? '')
  if (name) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(30, 30, 30)
    doc.text(name, MARGIN, y)
    y += 8
  }

  const contact: string = safe(data.contact ?? data.contact_info ?? data.email ?? '')
  if (contact) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    y = writeWrapped(doc, contact, MARGIN, y, CONTENT_W, 5)
    y += 3
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  if (data.summary) {
    checkPageBreak()
    y = sectionHeading(doc, 'Summary', y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(40, 40, 40)
    y = writeWrapped(doc, safe(data.summary), MARGIN, y, CONTENT_W, 5.5)
    y += 5
  }

  // ── Experience ─────────────────────────────────────────────────────────────
  if (data.experience && Array.isArray(data.experience) && data.experience.length > 0) {
    checkPageBreak()
    y = sectionHeading(doc, 'Experience', y)

    for (const job of data.experience) {
      const j = (typeof job === 'object' && job ? job : {}) as Record<string, unknown>
      const title = safe(j.title ?? j.position ?? j.role ?? '')
      const company = safe(j.company ?? j.organization ?? '')
      const dates = safe(j.dates ?? j.date ?? j.duration ?? '')
      const bullets: unknown[] = Array.isArray(j.bullets) ? j.bullets : []

      checkPageBreak(10)

      // Role + dates on same line
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(30, 30, 30)
      doc.text(title, MARGIN, y)
      if (dates) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(120, 120, 120)
        doc.text(dates, PAGE_W - MARGIN, y, { align: 'right' })
      }
      y += 5

      if (company) {
        doc.setFont('helvetica', 'italic')
        doc.setFontSize(9.5)
        doc.setTextColor(80, 80, 80)
        doc.text(company, MARGIN, y)
        y += 5
      }

      // Bullets
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9.5)
      doc.setTextColor(50, 50, 50)
      for (const bullet of bullets) {
        const text = safe(bullet)
        if (!text) continue
        checkPageBreak(6)
        const lines = doc.splitTextToSize(`• ${text}`, CONTENT_W - 4) as string[]
        for (let li = 0; li < lines.length; li++) {
          doc.text(li === 0 ? lines[li] : `  ${lines[li]}`, MARGIN + 2, y)
          y += 5
        }
      }

      // Plain description fallback
      if (bullets.length === 0 && j.description) {
        checkPageBreak(6)
        y = writeWrapped(doc, safe(j.description), MARGIN + 2, y, CONTENT_W - 4, 5)
      }

      y += 2
    }
    y += 3
  }

  // ── Skills ─────────────────────────────────────────────────────────────────
  if (data.skills) {
    checkPageBreak()
    y = sectionHeading(doc, 'Skills', y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(40, 40, 40)
    const skillText = Array.isArray(data.skills) ? data.skills.map(safe).join(' · ') : safe(data.skills)
    y = writeWrapped(doc, skillText, MARGIN, y, CONTENT_W, 5.5)
    y += 5
  }

  // ── Education ──────────────────────────────────────────────────────────────
  if (data.education) {
    checkPageBreak()
    y = sectionHeading(doc, 'Education', y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(40, 40, 40)

    const edu = data.education
    if (typeof edu === 'string') {
      y = writeWrapped(doc, edu, MARGIN, y, CONTENT_W, 5.5)
    } else if (Array.isArray(edu)) {
      for (const entry of edu) {
        checkPageBreak(8)
        y = writeWrapped(doc, safe(entry), MARGIN, y, CONTENT_W, 5.5)
        y += 2
      }
    } else if (typeof edu === 'object') {
      const e = edu as Record<string, unknown>
      if (e.degree) {
        doc.setFont('helvetica', 'bold')
        doc.text(safe(e.degree), MARGIN, y)
        y += 5
      }
      if (e.institution) {
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(80, 80, 80)
        const loc = e.location ? `${safe(e.institution)}, ${safe(e.location)}` : safe(e.institution)
        doc.text(loc, MARGIN, y)
        y += 5
      }
      if (e.graduation) {
        doc.setFontSize(9)
        doc.setTextColor(120, 120, 120)
        doc.text(safe(e.graduation), MARGIN, y)
        y += 5
      }
    }
    y += 3
  }

  // ── Any extra sections Claude may have added ───────────────────────────────
  const knownKeys = new Set(['name', 'full_name', 'contact', 'contact_info', 'email', 'summary', 'experience', 'skills', 'education'])
  for (const [key, val] of Object.entries(data)) {
    if (knownKeys.has(key) || !val) continue
    checkPageBreak()
    y = sectionHeading(doc, key.replace(/_/g, ' '), y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(40, 40, 40)
    y = writeWrapped(doc, safe(val), MARGIN, y, CONTENT_W, 5.5)
    y += 5
  }

  doc.save(fileName)
}
