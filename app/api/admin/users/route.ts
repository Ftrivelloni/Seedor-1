import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// GET /api/admin/users - Get all users for the admin's tenant
export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization token' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify the user with the token
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get the worker profile for this user
    const { data: currentWorker, error: workerError } = await supabaseAdmin
      .from('workers')
      .select('*, tenant:tenants(*)')
      .eq('email', user.email)
      .single();

    if (workerError || !currentWorker) {
      return NextResponse.json({ error: 'Worker profile not found' }, { status: 404 });
    }

    // Get the membership to check role
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('tenant_memberships')
      .select('*')
      .eq('id', currentWorker.membership_id)
      .single();

    if (membershipError || !membership || membership.role_code !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 });
    }

    // Get all workers for the tenant
    const { data: workers, error: workersError } = await supabaseAdmin
      .from('workers')
      .select(`
        *,
        membership:tenant_memberships!workers_membership_id_fkey(
          id,
          role_code,
          status,
          user_id,
          invited_by,
          accepted_at
        )
      `)
      .eq('tenant_id', currentWorker.tenant_id)
      .order('created_at', { ascending: false });

    if (workersError) {
      console.error('Error fetching workers:', workersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    return NextResponse.json({
      users: workers || [],
      tenant: currentWorker.tenant
    });

  } catch (error) {
    console.error('GET /api/admin/users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/users - Update a user's role or status
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization token' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const body = await request.json();
    const { workerId, role, status } = body;

    if (!workerId) {
      return NextResponse.json({ error: 'Worker ID is required' }, { status: 400 });
    }

    // Verify the requesting user
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get the current user's worker profile
    const { data: currentWorker, error: currentWorkerError } = await supabaseAdmin
      .from('workers')
      .select('*, membership:tenant_memberships!workers_membership_id_fkey(*)')
      .eq('email', user.email)
      .single();

    if (currentWorkerError || !currentWorker) {
      return NextResponse.json({ error: 'Worker profile not found' }, { status: 404 });
    }

    // Check if current user is admin
    if (!currentWorker.membership || currentWorker.membership.role_code !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 });
    }

    // Get the worker to update
    const { data: targetWorker, error: targetWorkerError } = await supabaseAdmin
      .from('workers')
      .select('*')
      .eq('id', workerId)
      .eq('tenant_id', currentWorker.tenant_id)
      .single();

    if (targetWorkerError || !targetWorker) {
      return NextResponse.json({ error: 'Target worker not found' }, { status: 404 });
    }

    // Update worker status if provided
    if (status) {
      const { error: updateWorkerError } = await supabaseAdmin
        .from('workers')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', workerId);

      if (updateWorkerError) {
        return NextResponse.json({ error: 'Failed to update worker status' }, { status: 500 });
      }
    }

    // Update membership role if provided
    if (role && targetWorker.membership_id) {
      const { error: updateMembershipError } = await supabaseAdmin
        .from('tenant_memberships')
        .update({ role_code: role })
        .eq('id', targetWorker.membership_id);

      if (updateMembershipError) {
        return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
      }

      // Also update area_module in worker to match role
      await supabaseAdmin
        .from('workers')
        .update({ area_module: role })
        .eq('id', workerId);
    }

    return NextResponse.json({ 
      success: true,
      message: 'User updated successfully'
    });

  } catch (error) {
    console.error('PUT /api/admin/users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/users - Deactivate a user
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization token' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { searchParams } = new URL(request.url);
    const workerId = searchParams.get('id');

    if (!workerId) {
      return NextResponse.json({ error: 'Worker ID is required' }, { status: 400 });
    }

    // Verify the requesting user
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get the current user's worker profile
    const { data: currentWorker, error: currentWorkerError } = await supabaseAdmin
      .from('workers')
      .select('*, membership:tenant_memberships!workers_membership_id_fkey(*)')
      .eq('email', user.email)
      .single();

    if (currentWorkerError || !currentWorker) {
      return NextResponse.json({ error: 'Worker profile not found' }, { status: 404 });
    }

    // Check if current user is admin
    if (!currentWorker.membership || currentWorker.membership.role_code !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 });
    }

    // Deactivate the worker
    const { error: deactivateError } = await supabaseAdmin
      .from('workers')
      .update({ status: 'inactive', updated_at: new Date().toISOString() })
      .eq('id', workerId)
      .eq('tenant_id', currentWorker.tenant_id);

    if (deactivateError) {
      return NextResponse.json({ error: 'Failed to deactivate user' }, { status: 500 });
    }

    // Also deactivate the membership
    const { data: targetWorker } = await supabaseAdmin
      .from('workers')
      .select('membership_id')
      .eq('id', workerId)
      .single();

    if (targetWorker?.membership_id) {
      await supabaseAdmin
        .from('tenant_memberships')
        .update({ status: 'inactive' })
        .eq('id', targetWorker.membership_id);
    }

    return NextResponse.json({ 
      success: true,
      message: 'User deactivated successfully'
    });

  } catch (error) {
    console.error('DELETE /api/admin/users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
