import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase environment variables for check-email route')
}

const supabaseAdmin = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin || !supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization token' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { email } = await request.json()

    const cleanEmail = String(email || '').trim().toLowerCase()
    
    if (!cleanEmail) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Verify requester is an admin and get their tenant
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 })
    }

    const { data: memberships, error: membershipError } = await supabaseAdmin
      .from('tenant_memberships')
      .select('tenant_id')
      .eq('user_id', user.id)
      .eq('role_code', 'admin')
      .eq('status', 'active')
      .limit(1)

    if (membershipError || !memberships || memberships.length === 0) {
      return NextResponse.json({ error: 'Only admins can check emails' }, { status: 403 })
    }

    const currentTenantId = memberships[0].tenant_id

    // Check if there's already a user with this email in the SAME tenant
    // Method 1: Check in tenant_memberships (active users in this tenant)
    const { data: existingMemberships, error: membershipCheckError } = await supabaseAdmin
      .from('tenant_memberships')
      .select('user_id')
      .eq('tenant_id', currentTenantId)
      .eq('status', 'active')

    if (membershipCheckError) {
      return NextResponse.json({ exists: true })
    }

    // Get auth users for existing memberships to check emails
    let emailExists = false
    
    if (existingMemberships && existingMemberships.length > 0) {
      for (const membership of existingMemberships) {
        try {
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(membership.user_id)
          if (authUser.user?.email?.toLowerCase() === cleanEmail) {
            emailExists = true
            break
          }
        } catch (error) {
          // Continue checking other users
        }
      }
    }

    // Method 2: Also check pending invitations for this tenant
    if (!emailExists) {
      const { data: pendingInvitation, error: invitationError } = await supabaseAdmin
        .from('invitations')
        .select('id')
        .eq('tenant_id', currentTenantId)
        .eq('email', cleanEmail)
        .is('accepted_at', null)
        .is('revoked_at', null)
        .gt('expires_at', new Date().toISOString())
        .limit(1)

      if (!invitationError && pendingInvitation && pendingInvitation.length > 0) {
        emailExists = true
      }
    }

    return NextResponse.json({ exists: emailExists })
  } catch (error) {
    // Fail closed to prevent duplicate usage
    return NextResponse.json({ exists: true, error: 'Internal error occurred' })
  }
}