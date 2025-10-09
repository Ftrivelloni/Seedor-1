import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      )
    }

    // Verificar invitaciones en la tabla custom
    const { data: invitations, error: invitationsError } = await supabaseAdmin
      .from('invitations')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .order('created_at', { ascending: false })

    // Verificar usuarios en auth.users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    const userInAuth = authUsers?.users?.find(u => u.email === email.toLowerCase().trim())

    // Verificar logs de audit para esta invitación
    const { data: auditLogs, error: auditError } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .eq('action', 'admin_invited')
      .ilike('details->admin_email', `%${email}%`)
      .order('created_at', { ascending: false })
      .limit(5)

    const response = {
      email: email.toLowerCase().trim(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      invitations: {
        count: invitations?.length || 0,
        data: invitations || [],
        error: invitationsError?.message
      },
      authUser: {
        exists: !!userInAuth,
        data: userInAuth ? {
          id: userInAuth.id,
          email: userInAuth.email,
          created_at: userInAuth.created_at,
          email_confirmed_at: userInAuth.email_confirmed_at,
          last_sign_in_at: userInAuth.last_sign_in_at,
          user_metadata: userInAuth.user_metadata
        } : null,
        error: authError?.message
      },
      auditLogs: {
        count: auditLogs?.length || 0,
        data: auditLogs || [],
        error: auditError?.message
      },
      supabaseConfig: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('Error checking invitation status:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}