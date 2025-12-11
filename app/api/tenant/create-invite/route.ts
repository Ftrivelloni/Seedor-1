import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { buildInvitationUrl } from '../../../../lib/utils/url'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantName, slug, plan, contactName, contactEmail, ownerPhone } = body

    if (!tenantName || !slug || !contactName || !contactEmail) {
      return NextResponse.json({ success: false, error: 'Faltan campos requeridos' }, { status: 400 })
    }

    // 1. Create tenant
    const limits = plan === 'basico' ? { maxUsers: 10, maxFields: 5 } : { maxUsers: 30, maxFields: 20 }

    // Get system user ID - MUST be configured
    const systemUserId = process.env.SUPABASE_SERVICE_USER_ID

    if (!systemUserId) {
      console.error('[create-invite] SUPABASE_SERVICE_USER_ID not configured')
      return NextResponse.json({ 
        success: false, 
        error: 'Server misconfigured: SUPABASE_SERVICE_USER_ID is required. Run: npm run setup:system-user' 
      }, { status: 500 })
    }

    console.log('[create-invite] Using system user:', systemUserId)

    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .insert([{
        name: tenantName,
        slug,
        plan,
        contact_name: contactName,
        contact_email: contactEmail,
        created_by: systemUserId,
        max_users: limits.maxUsers,
        max_fields: limits.maxFields,
        current_users: 0,
        current_fields: 0
      }])
      .select()
      .single()

    if (tenantError || !tenant) {
      return NextResponse.json({ success: false, error: tenantError?.message || 'Error al crear tenant' }, { status: 500 })
    }

    // 2. Create an invitation for admin role
    const token = Math.random().toString(36).slice(2) + Date.now().toString(36)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from('invitations')
      .insert([{
        tenant_id: tenant.id,
        email: contactEmail.toLowerCase(),
        role_code: 'admin',
        token_hash: token,
        invited_by: null,
        expires_at: expiresAt
      }])
      .select()
      .single()

    if (inviteError || !invitation) {
      // rollback tenant
      await supabaseAdmin.from('tenants').delete().eq('id', tenant.id)
      return NextResponse.json({ success: false, error: inviteError?.message || 'Error creando invitación' }, { status: 500 })
    }

    // 3. Send invite email via Supabase admin
    const inviteUrl = buildInvitationUrl('admin', token)

    const { error: sendError } = await supabaseAdmin.auth.admin.inviteUserByEmail(contactEmail.toLowerCase(), {
      redirectTo: inviteUrl,
      data: {
        tenant_id: tenant.id,
        tenant_name: tenant.name,
        role_code: 'admin',
        invitation_token: token
      }
    })

    if (sendError) {
      // cleanup invitation and tenant
      await supabaseAdmin.from('invitations').delete().eq('id', invitation.id)
      await supabaseAdmin.from('tenants').delete().eq('id', tenant.id)
      return NextResponse.json({ success: false, error: sendError.message || 'Error enviando invitación' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: { tenant, invitation, inviteUrl } })

  } catch (error: any) {
    console.error('create-invite error', error)
    return NextResponse.json({ success: false, error: error.message || 'Error inesperado' }, { status: 500 })
  }
}
