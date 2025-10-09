import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { buildInvitationUrl } from '../../../../../lib/utils/url'

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
    
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization token' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { email, role } = await request.json();

    console.log('🔄 Processing user invitation:', { email, role })

    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 });
    }

    // Get user from token
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    // Verify user is admin in a tenant
    const { data: userMemberships, error: membershipError } = await supabaseAdmin
      .from('tenant_memberships')
      .select(`
        *,
        tenant:tenants(*)
      `)
      .eq('user_id', user.id)
      .eq('role_code', 'admin')
      .eq('status', 'active');

    if (membershipError || !userMemberships || userMemberships.length === 0) {
      return NextResponse.json({ error: 'Admin access not found. Only admins can invite users.' }, { status: 403 });
    }

    const currentMembership = userMemberships[0];
    const tenant = currentMembership.tenant;

    // Generate invitation token
    const token_invitation = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`

    console.log('🔄 Creating invitation record...')
    
    // Create invitation record
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // 24 hours expiration
    
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from('invitations')
      .insert([{
        tenant_id: currentMembership.tenant_id,
        email: email.toLowerCase().trim(),
        role_code: role,
        token_hash: token_invitation,
        invited_by: user.id,
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

    const inviteUrl = buildInvitationUrl('user', token_invitation)

    console.log('🔄 Enviando invitación usuario:', {
      email: email.toLowerCase().trim(),
      redirectTo: inviteUrl,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    })

    const { error: inviteError, data: inviteData } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email.toLowerCase().trim(),
      {
        redirectTo: inviteUrl,
        data: {
          tenant_id: currentMembership.tenant_id,
          tenant_name: tenant.name,
          role: role,
          invitation_token: token_invitation,
          invited_by_id: user.id,
          is_user_invite: true
        }
      }
    )

    if (inviteError) {
      console.error('❌ Error enviando invitación usuario:', {
        error: inviteError,
        email: email,
        code: inviteError.status || inviteError.code,
        message: inviteError.message
      })
      console.error('Error sending user invitation email:', inviteError)

      await supabaseAdmin
        .from('invitations')
        .delete()
        .eq('id', invitation.id)

      return NextResponse.json(
        { 
          error: `Error al enviar email: ${inviteError.message}`,
          details: {
            code: inviteError.status || inviteError.code,
            inviteUrl: inviteUrl,
            email: email,
            environment: process.env.NODE_ENV
          }
        },
        { status: 500 }
      )
    } else {
      console.log('✅ User invitation sent successfully')
      
      return NextResponse.json({
        success: true,
        message: 'Invitación enviada exitosamente',
        data: {
          email: email,
          role: role,
          tenant: tenant.name,
          invitation_id: invitation.id
        }
      })
    }

  } catch (error) {
    console.error('POST /api/admin/users/invite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
