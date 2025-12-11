import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const buildInvitationUrl = (role: string, token: string): string => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${baseUrl}/auth/invite?token=${token}&role=${role}`
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

/**
 * DEV ONLY: Create tenant without payment (bypasses LemonSqueezy)
 * 
 * This route is for DEVELOPMENT ONLY. In production, use the LemonSqueezy flow.
 * DELETE THIS FILE before deploying to production.
 */
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development mode' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const { tenantName, slug, plan, contactName, contactEmail } = body

    if (!tenantName || !slug || !contactName || !contactEmail) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    console.log('[dev-create-tenant] Creating tenant without payment:', { tenantName, plan })

    // Get system user ID
    const systemUserId = process.env.SUPABASE_SERVICE_USER_ID

    if (!systemUserId) {
      return NextResponse.json(
        { success: false, error: 'SUPABASE_SERVICE_USER_ID not configured' },
        { status: 500 }
      )
    }

    // Set limits based on plan
    const limits = plan === 'basico' || plan === 'basic'
      ? { maxUsers: 10, maxFields: 5 }
      : { maxUsers: 30, maxFields: 20 }

    // Create tenant
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .insert([{
        name: tenantName,
        slug,
        plan: plan === 'basico' ? 'basico' : 'pro',
        contact_name: contactName,
        contact_email: contactEmail,
        created_by: systemUserId,
        max_users: limits.maxUsers,
        max_fields: limits.maxFields,
        current_users: 0,
        current_fields: 0,
        payment_status: 'legacy', // Mark as legacy (free tier)
        payment_provider: 'dev', // Mark as dev created
      }])
      .select()
      .single()

    if (tenantError || !tenant) {
      console.error('[dev-create-tenant] Error creating tenant:', tenantError)
      return NextResponse.json(
        { success: false, error: tenantError?.message || 'Error al crear tenant' },
        { status: 500 }
      )
    }

    console.log('[dev-create-tenant] Tenant created:', tenant.id)

    // Create admin invitation
    const token = Math.random().toString(36).slice(2) + Date.now().toString(36)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

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
      console.error('[dev-create-tenant] Error creating invitation:', inviteError)
      // Rollback tenant
      await supabaseAdmin.from('tenants').delete().eq('id', tenant.id)
      return NextResponse.json(
        { success: false, error: inviteError?.message || 'Error creando invitación' },
        { status: 500 }
      )
    }

    // Send invite email
    const inviteUrl = buildInvitationUrl('admin', token)

    const { error: sendError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      contactEmail.toLowerCase(),
      {
        redirectTo: inviteUrl,
        data: {
          tenant_id: tenant.id,
          tenant_name: tenantName,
          role: 'admin',
          invitation_token: token,
          is_admin_setup: true
        }
      }
    )

    if (sendError) {
      console.error('[dev-create-tenant] Error sending invitation:', sendError)
      // Don't rollback, just warn
      console.warn('[dev-create-tenant] Tenant created but email failed. User can use invitation link manually.')
    }

    console.log('[dev-create-tenant] Success! Invitation URL:', inviteUrl)

    return NextResponse.json({
      success: true,
      data: {
        tenantId: tenant.id,
        invitationUrl: inviteUrl,
        message: 'Tenant creado exitosamente (modo desarrollo - sin pago)'
      }
    })

  } catch (error: any) {
    console.error('[dev-create-tenant] Unexpected error:', error)
    return NextResponse.json(
      { error: error.message || 'Error inesperado' },
      { status: 500 }
    )
  }
}
