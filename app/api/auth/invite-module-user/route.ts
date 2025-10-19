import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { buildInvitationUrl } from '../../../../lib/utils/url'

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

export async function POST(request: NextRequest) {
  try {
    const { tenantId, email, roleCode, invitedBy } = await request.json()

    if (!tenantId || !email || !roleCode) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos' },
        { status: 400 }
      )
    }

    // If invitedBy isn't supplied (tenant created by system), fall back to configured service user id
    const inviterId = invitedBy || process.env.SUPABASE_SERVICE_USER_ID || null

    const { data: tenant } = await supabaseAdmin
      .from('tenants')
      .select('current_users, max_users, name')
      .eq('id', tenantId)
      .single()

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant no encontrado' },
        { status: 404 }
      )
    }

    if (tenant.current_users >= tenant.max_users) {
      return NextResponse.json(
        { error: 'Se alcanzó el límite máximo de usuarios para este plan' },
        { status: 400 }
      )
    }

    const cleanEmail = email.toLowerCase().trim()

    // If the user already exists in auth, create membership directly (no email)
    let existingAuthUserId: string | null = null
    try {
      const { data: usersList, error: listErr } = await supabaseAdmin.auth.admin.listUsers()
      if (!listErr && usersList && usersList.users) {
        const found = usersList.users.find(u => u.email && u.email.toLowerCase() === cleanEmail)
        if (found) existingAuthUserId = found.id
      }
    } catch (e) {
      // fallback to direct table query
      try {
        const { data: authRow } = await supabaseAdmin.from('auth.users').select('id,email').eq('email', cleanEmail).maybeSingle()
        if (authRow) existingAuthUserId = authRow.id
      } catch (e2) {}
    }

    if (existingAuthUserId) {
      // Check if membership already exists
      const { data: existingMembership } = await supabaseAdmin
        .from('tenant_memberships')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('user_id', existingAuthUserId)
        .maybeSingle()

      if (existingMembership) {
        return NextResponse.json({ success: false, message: 'El usuario ya tiene un rol en este tenant' })
      }

      // Check tenant limits
      if (tenant.current_users >= tenant.max_users) {
        return NextResponse.json({ error: 'Se alcanzó el límite máximo de usuarios para este plan' }, { status: 409 })
      }

      // Create membership directly
      const { data: membershipData, error: membershipError } = await supabaseAdmin
        .from('tenant_memberships')
        .insert([{
          tenant_id: tenantId,
          user_id: existingAuthUserId,
          role_code: roleCode,
          status: 'active',
          invited_by: inviterId,
          accepted_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (membershipError) {
        console.error('Error creating membership for existing user:', membershipError)
        return NextResponse.json({ error: `Error creando membresía: ${membershipError.message}` }, { status: 500 })
      }

      // Increment tenant current_users (best-effort)
      const { error: updateError } = await supabaseAdmin
        .from('tenants')
        .update({ current_users: tenant.current_users + 1 })
        .eq('id', tenantId)

      if (updateError) {
        console.error('Error incrementing tenant current_users:', updateError)
      }

      return NextResponse.json({ success: true, data: { membership: membershipData, memberCreated: true } })
    }

    // continue to invitation flow for non-existing users
    const { data: existingInvitation } = await supabaseAdmin
      .from('invitations')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('email', cleanEmail)
      .eq('role_code', roleCode)
      .is('accepted_at', null)
      .is('revoked_at', null)
      .maybeSingle()

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'Ya existe una invitación pendiente para este email y rol' },
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
        email: email.toLowerCase().trim(),
        role_code: roleCode,
        token_hash: token,
        invited_by: inviterId,
        expires_at: expiresAt.toISOString()
      }])
      .select()
      .single()

    if (invitationError) {
      console.error('Error creating invitation:', invitationError)
      return NextResponse.json(
        { error: `Error al crear invitación: ${invitationError.message}` },
        { status: 500 }
      )
    }

    const inviteUrl = buildInvitationUrl('user', token)

    const { error: inviteError, data: inviteData } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email.toLowerCase().trim(),  
      {
        redirectTo: inviteUrl,
        data: {
          tenant_id: tenantId,
          tenant_name: tenant.name,
          role: roleCode,
          invitation_token: token,
          invited_by_id: inviterId,
          is_module_user: true
        }
      }
    )

    if (inviteError) {
      console.error('Error sending invitation email:', inviteError)
      
      await supabaseAdmin
        .from('invitations')
        .delete()
        .eq('id', invitation.id)

      return NextResponse.json(
        { error: `Error al enviar email: ${inviteError.message}` },
        { status: 500 }
      )
    } else {
      console.log('✅ Invitation sent successfully, creating profile for user...')
      
      try {
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
        
        if (!listError && users) {
          const invitedUser = users.find(u => u.email === email.toLowerCase().trim())
          
          if (invitedUser) {
            console.log('🔄 Creating profile for invited user:', invitedUser.id)
            
            const { data: profileData, error: profileError } = await supabaseAdmin
              .from('profiles')
              .insert([{
                user_id: invitedUser.id,
                full_name: invitedUser.user_metadata?.full_name || email.split('@')[0],
                phone: null,
                default_tenant_id: tenantId
              }])
              .select()
              .single()
            
            if (profileError) {
              console.error('❌ Error creating profile for invited user:', profileError)
            } else {
              console.log('✅ Profile created successfully for invited user:', profileData)
            }
          } else {
            console.warn('⚠️ Could not find invited user in auth.users')
          }
        }
      } catch (profileCreationError) {
        console.error('❌ Error in profile creation process:', profileCreationError)
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: { invitation, inviteUrl }
    })

  } catch (error: any) {
    console.error('Error in invite-module-user API:', error)
    return NextResponse.json(
      { error: error.message || 'Error inesperado' },
      { status: 500 }
    )
  }
}