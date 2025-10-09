import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization token' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const body = await request.json();
    const { email, fullName, role, documentId, phone } = body;

    if (!email || !fullName || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { data: currentWorker, error: currentWorkerError } = await supabaseAdmin
      .from('workers')
      .select('*, membership:tenant_memberships!workers_membership_id_fkey(*)')
      .eq('email', user.email)
      .single();

    if (currentWorkerError || !currentWorker) {
      return NextResponse.json({ error: 'Worker profile not found' }, { status: 404 });
    }

    if (!currentWorker.membership || currentWorker.membership.role_code !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 });
    }

    const { data: existingWorker } = await supabaseAdmin
      .from('workers')
      .select('email')
      .eq('email', email)
      .eq('tenant_id', currentWorker.tenant_id)
      .single();

    if (existingWorker) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }

    const tempPassword = `Temp${Math.random().toString(36).slice(-8)}!`;

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: false, 
      user_metadata: {
        full_name: fullName,
        invited_by: currentWorker.id
      }
    });

    if (authError || !authData.user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ 
        error: 'Failed to create auth user: ' + authError?.message 
      }, { status: 500 });
    }

    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('tenant_memberships')
      .insert([{
        tenant_id: currentWorker.tenant_id,
        user_id: authData.user.id,
        role_code: role,
        status: 'pending',
        invited_by: currentWorker.id
      }])
      .select()
      .single();

    if (membershipError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      console.error('Membership error:', membershipError);
      return NextResponse.json({ 
        error: 'Failed to create membership: ' + membershipError.message 
      }, { status: 500 });
    }
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([{
        user_id: authData.user.id,
        full_name: fullName,
        phone: phone || null,
        default_tenant_id: currentWorker.tenant_id
      }])
      .select()
      .single();

    if (profileError) {
    } else {
    }

    const { data: worker, error: workerError } = await supabaseAdmin
      .from('workers')
      .insert([{
        tenant_id: currentWorker.tenant_id,
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
      await supabaseAdmin.from('tenant_memberships').delete().eq('id', membership.id);
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      console.error('Worker error:', workerError);
      return NextResponse.json({ 
        error: 'Failed to create worker profile: ' + workerError.message 
      }, { status: 500 });
    }

    try {
      await supabaseAdmin.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password`
      });
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError);
    }

    return NextResponse.json({ 
      success: true,
      worker: worker,
      message: 'User invited successfully. They will receive an email to set their password.'
    });

  } catch (error) {
    console.error('POST /api/admin/users/invite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
