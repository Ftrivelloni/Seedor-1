import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing required Supabase environment variables');
}

const supabaseAdmin = supabaseUrl && serviceRoleKey
  ? createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  : null

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase configuration missing. Please check environment variables.' },
        { status: 500 }
      );
    }
    
    const { tenantId, adminEmail, invitedBy } = await request.json()

    console.log('🔄 Processing admin invitation:', { tenantId, adminEmail, invitedBy })

    if (!tenantId || !adminEmail || !invitedBy) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos' },
        { status: 400 }
      )
    }

    const { data: membership } = await supabaseAdmin
      .from('tenant_memberships')
      .select('role_code')
      .eq('tenant_id', tenantId)
      .eq('user_id', invitedBy)
      .eq('status', 'active')
      .single()

    if (!membership || membership.role_code !== 'owner') {
      return NextResponse.json(
        { error: 'Solo el propietario puede invitar al administrador' },
        { status: 403 }
      )
    }

    const { data: existingAdmin } = await supabaseAdmin
      .from('tenant_memberships')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('role_code', 'admin')
      .eq('status', 'active')
      .maybeSingle()

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Ya existe un administrador para esta empresa' },
        { status: 400 }
      )
    }

    const { data: existingInvitation } = await supabaseAdmin
      .from('invitations')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('email', adminEmail.toLowerCase().trim())
      .eq('role_code', 'admin')
      .is('accepted_at', null)
      .is('revoked_at', null)
      .maybeSingle()

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'Ya existe una invitación pendiente para este email' },
        { status: 400 }
      )
    }

    const { data: tenant } = await supabaseAdmin
      .from('tenants')
      .select('name')
      .eq('id', tenantId)
      .single()

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant no encontrado' },
        { status: 404 }
      )
    }

    const { data: inviterProfile } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('user_id', invitedBy)
      .single()

    if (!inviterProfile) {
      return NextResponse.json(
        { error: 'El usuario invitador no tiene un perfil válido' },
        { status: 400 }
      )
    }

    const crypto = require('crypto')
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días

    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from('invitations')
      .insert([{
        tenant_id: tenantId,
        email: adminEmail.toLowerCase().trim(),
        role_code: 'admin',
        token_hash: token,
        invited_by: invitedBy,
        expires_at: expiresAt.toISOString()
      }])
      .select()
      .single()

    if (invitationError) {
      console.error('❌ Error creating invitation record:', invitationError)
      return NextResponse.json(
        { error: `Error al crear invitación: ${invitationError.message}` },
        { status: 500 }
      )
    }

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/admin-setup?token=${token}`

    const { error: inviteError, data: inviteData } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      adminEmail.toLowerCase().trim(),
      {
        redirectTo: inviteUrl,
        data: {
          tenant_id: tenantId,
          tenant_name: tenant.name,
          role: 'admin',
          invitation_token: token,
          invited_by_id: invitedBy,
          is_admin_invite: true
        }
      }
    )

    if (inviteError) {
      console.error('Error sending admin invitation email:', inviteError)

      await supabaseAdmin
        .from('invitations')
        .delete()
        .eq('id', invitation.id)

      return NextResponse.json(
        { error: `Error al enviar email: ${inviteError.message}` },
        { status: 500 }
      )
    }

    await supabaseAdmin
      .from('audit_logs')
      .insert([{
        tenant_id: tenantId,
        actor_user_id: invitedBy,
        action: 'admin_invited',
        entity: 'invitation',
        entity_id: invitation.id,
        details: { 
          admin_email: adminEmail,
          context: 'tenant_setup',
          invite_method: 'supabase_invite'
        }
      }])

    return NextResponse.json({ 
      success: true, 
      data: { 
        invitation,
        inviteUrl,
        message: 'Invitación enviada por email.'
      } 
    })

  } catch (error: any) {
    console.error('❌ Unexpected error in invite-admin API:', error)
    return NextResponse.json(
      { error: error.message || 'Error inesperado' },
      { status: 500 }
    )
  }
}