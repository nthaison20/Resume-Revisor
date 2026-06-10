import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Returns the authenticated user's revision history, newest first.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('revisions')
    .select('id, name, job_description, revised_json, score_before, score_after, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ revisions: data ?? [] })
}
