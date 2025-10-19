import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase env variables for check-email route')
}

const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, { auth: { autoRefreshToken: false, persistSession: false } })
  : null

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 })
    }

    const { email } = await request.json()
    if (!email) return NextResponse.json({ success: false, error: 'Email requerido' }, { status: 400 })

    const cleanEmail = String(email).toLowerCase()

    // Try admin listUsers first (may not scale; acceptable for admin key)
    try {
      const { data: users, error } = await supabaseAdmin.auth.admin.listUsers()
      if (!error && users && users.users) {
        const exists = users.users.some((u: any) => u.email && u.email.toLowerCase() === cleanEmail)
        return NextResponse.json({ success: true, exists })
      }
    } catch (e) {
      // fallback
    }

    // Fallback: direct query to auth.users
    try {
      const { data } = await supabaseAdmin.from('auth.users').select('id,email').eq('email', cleanEmail).maybeSingle()
      return NextResponse.json({ success: true, exists: !!data })
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message || 'Error checking email' }, { status: 500 })
    }

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Error inesperado' }, { status: 500 })
  }
}