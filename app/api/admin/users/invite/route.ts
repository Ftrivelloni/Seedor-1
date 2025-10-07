import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// POST /api/admin/users/invite - Invite a new user
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/admin/users/invite - Request received');
    
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      console.log('POST /api/admin/users/invite - No authorization token provided');
      return NextResponse.json({ error: 'No authorization token' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const body = await request.json();
    const { email, fullName, role, documentId, phone } = body;

    if (!email || !fullName || !role) {
      console.error('POST /api/admin/users/invite - Missing required fields');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log(`POST /api/admin/users/invite - Inviting user ${email} with role ${role}`);

    // Verify the requesting user
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error('POST /api/admin/users/invite - Invalid token:', userError);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    console.log(`POST /api/admin/users/invite - User verified: ${user.email}`);

    // Get user's memberships directly
    const { data: adminMemberships, error: adminMembershipError } = await supabaseAdmin
      .from('tenant_memberships')
      .select('*, tenants(*)')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (adminMembershipError || !adminMemberships || adminMemberships.length === 0) {
      console.error('POST /api/admin/users/invite - No active memberships found:', adminMembershipError);
      return NextResponse.json({ error: 'No active memberships found' }, { status: 403 });
    }
    
    // Find admin membership
    const adminMembership = adminMemberships.find(m => m.role_code === 'admin' || m.role_code === 'owner');
    
    if (!adminMembership) {
      console.error(`POST /api/admin/users/invite - Access denied. User is not admin: ${user.email}`);
      return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 });
    }
    
    const tenantId = adminMembership.tenant_id;
    const tenantName = adminMembership.tenants?.name || 'Tenant';
    console.log(`POST /api/admin/users/invite - Admin verified: ${user.email}, tenant: ${tenantId}`);

    // Check if email already exists in this tenant's workers or memberships
    const { data: existingWorker } = await supabaseAdmin
      .from('workers')
      .select('email')
      .eq('email', email)
      .eq('tenant_id', tenantId)
      .single();

    if (existingWorker) {
      console.log(`POST /api/admin/users/invite - User with email ${email} already exists as a worker in tenant`);
      return NextResponse.json({ error: 'A user with this email already exists in this tenant' }, { status: 409 });
    }

    // Check tenant limits before creating new user
    const { data: tenant } = await supabaseAdmin
      .from('tenants')
      .select('max_users, current_users, plan')
      .eq('id', tenantId)
      .single();
    
    if (tenant) {
      // Get current user count from tenant_memberships
      const { count: currentUserCount } = await supabaseAdmin
        .from('tenant_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('status', 'active');
      
      const maxUsers = tenant.max_users || 3;
      
      // Check if tenant has reached user limit (skip for unlimited plans)
      if (maxUsers > 0 && (currentUserCount || 0) >= maxUsers) {
        console.error(`POST /api/admin/users/invite - Tenant has reached user limit: ${currentUserCount}/${maxUsers}`);
        return NextResponse.json({ 
          error: `You have reached the maximum number of users (${maxUsers}) for your plan.`,
          tenant_limits: {
            current: currentUserCount,
            max: maxUsers,
            plan: tenant.plan
          }
        }, { status: 400 });
      }
    }

    // Create auth user without password, this forces the user to set their own password
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: false, // User needs to verify email
      user_metadata: {
        full_name: fullName,
        invited_by: user.id
      }
    });

    if (authError || !authData.user) {
      console.error('POST /api/admin/users/invite - Auth error:', authError);
      return NextResponse.json({ 
        error: 'Failed to create auth user: ' + authError?.message 
      }, { status: 500 });
    }

    console.log(`POST /api/admin/users/invite - Auth user created: ${authData.user.id}`);

    // Create tenant membership
    const { data: membership, error: createMembershipError } = await supabaseAdmin
      .from('tenant_memberships')
      .insert([{
        tenant_id: tenantId,
        user_id: authData.user.id,
        role_code: role,
        status: 'pending',
        invited_by: user.id
      }])
      .select()
      .single();

    if (createMembershipError) {
      // Cleanup: delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      console.error('POST /api/admin/users/invite - Membership error:', createMembershipError);
      return NextResponse.json({ 
        error: 'Failed to create membership: ' + createMembershipError.message 
      }, { status: 500 });
    }

    console.log(`POST /api/admin/users/invite - Membership created: ${membership.id}`);

    // Create worker profile
    const { data: worker, error: workerError } = await supabaseAdmin
      .from('workers')
      .insert([{
        tenant_id: tenantId,
        full_name: fullName,
        document_id: documentId || '',
        email: email,
        phone: phone || null,
        area_module: role,
        membership_id: membership.id,
        status: 'active'
      }])
      .select()
      .single();

    if (workerError) {
      // Cleanup: delete the membership and auth user
      await supabaseAdmin.from('tenant_memberships').delete().eq('id', membership.id);
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      console.error('POST /api/admin/users/invite - Worker error:', workerError);
      return NextResponse.json({ 
        error: 'Failed to create worker profile: ' + workerError.message 
      }, { status: 500 });
    }

    console.log(`POST /api/admin/users/invite - Worker created: ${worker.id}`);

    // Send invitation email with a link to set password and complete registration
    try {
      // Generate a sign-up link that will route to accept-invitacion page with the token
      // The token will be a UUID that identifies the invitation in the database
      const invitationToken = crypto.randomUUID();
      
      // Store the invitation token in the user's metadata
      await supabaseAdmin.auth.admin.updateUserById(
        authData.user.id, 
        { user_metadata: { ...authData.user.user_metadata, invitation_token: invitationToken } }
      );
      
      // Send the email with the invitation link
      await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${appUrl}/accept-invitacion?token=${invitationToken}`
      });
      
      console.log(`POST /api/admin/users/invite - Invitation email sent to ${email} with token ${invitationToken}`);
    } catch (emailError) {
      console.error('POST /api/admin/users/invite - Failed to send invitation email:', emailError);
      // Don't fail the request if email sending fails
    }
    
    // Increment the tenant's current_users count
    await supabaseAdmin
      .from('tenants')
      .update({ current_users: tenant ? (tenant.current_users || 0) + 1 : 1 })
      .eq('id', tenantId);

    return NextResponse.json({ 
      success: true,
      worker: worker,
      message: 'Usuario invitado exitosamente. Recibirá un correo para completar su registro y crear su contraseña.'
    });

  } catch (error) {
    console.error('POST /api/admin/users/invite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
