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
  const buffer = Buffer.from(await file.arrayBuffer())
  let text = ''

  if (fileName.endsWith('.pdf')) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>
    const result = await pdfParse(buffer)
    text = result.text
  } else if (fileName.endsWith('.docx')) {
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ buffer })
    text = result.value
  } else {
    return NextResponse.json({ error: 'Unsupported file type. Upload a PDF or .docx file.' }, { status: 400 })
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
