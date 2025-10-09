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

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization token' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Find user's memberships to get tenant access and admin role
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
      return NextResponse.json({ error: 'Admin access not found. Only admins can manage users.' }, { status: 403 });
    }

    // Use the first admin membership (in case user is admin of multiple tenants)
    const currentMembership = userMemberships[0];
    const currentTenant = currentMembership.tenant;

    // Admin access already verified above

    
        // Get all users for this tenant (excluding the current admin)
    const { data: allMemberships, error: allMembershipsError } = await supabaseAdmin
      .from('tenant_memberships')
      .select(`
        *,
        profile:profiles(*)
      `)
      .eq('tenant_id', currentMembership.tenant_id)
      .in('role_code', ['empaque', 'finanzas', 'campo']) // Only non-admin roles
      .not('user_id', 'eq', user.id); // Exclude current admin

    if (allMembershipsError) {
      return NextResponse.json({ error: 'Error fetching users' }, { status: 500 });
    }
      
    // Get profiles data for all users
    const userIds = (allMemberships || []).map(m => m.user_id);
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .in('user_id', userIds);



    // Get corresponding workers data to complement the information (excluding admin)
    const { data: workers, error: workersError } = await supabaseAdmin
      .from('workers')
      .select('*')
      .eq('tenant_id', currentMembership.tenant_id)
      .in('area_module', ['empaque', 'finanzas', 'campo']); // Excluir admin
      


    // Get auth user emails for all memberships
    const userPromises = (allMemberships || []).map(async (membership: any) => {
      try {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(membership.user_id);
        return { user_id: membership.user_id, email: authUser.user?.email || '' };
      } catch (error) {
        console.error(`Error fetching auth user for ${membership.user_id}:`, error);
        return { user_id: membership.user_id, email: '' };
      }
    });

    const authUsers = await Promise.all(userPromises);
    const authUserMap = authUsers.reduce((acc: Record<string, string>, user: any) => {
      acc[user.user_id] = user.email;
      return acc;
    }, {} as Record<string, string>);
    
    const profilesMap = (profiles || []).reduce((acc, profile) => {
      acc[profile.user_id] = profile;
      return acc;
    }, {} as Record<string, any>);

    // Transform the data to match the expected format
    const transformedUsers = (allMemberships || []).map((membership: any) => {
      // Find corresponding worker data
      const worker = workers?.find(w => w.membership_id === membership.id);
      const profile = profilesMap[membership.user_id];
      
      return {
        id: worker?.id || membership.id,
        email: worker?.email || authUserMap[membership.user_id] || '',
        full_name: worker?.full_name || profile?.full_name || '',
        role_code: membership.role_code,
        status: membership.accepted_at ? 'active' : 'pending',
        created_at: membership.accepted_at || new Date().toISOString(),
        accepted_at: membership.accepted_at,
        phone: worker?.phone || profile?.phone || '',
        document_id: worker?.document_id || '',
        membership: {
          id: membership.id,
          role_code: membership.role_code,
          status: membership.status,
          user_id: membership.user_id,
          invited_by: membership.invited_by,
          accepted_at: membership.accepted_at
        }
      };
    });



    return NextResponse.json({
      users: transformedUsers,
      tenant: currentTenant
    });

  } catch (error) {
    console.error('GET /api/admin/users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    const { data: targetWorker, error: targetWorkerError } = await supabaseAdmin
      .from('workers')
      .select('*')
      .eq('id', workerId)
      .eq('tenant_id', currentWorker.tenant_id)
      .single();

    if (targetWorkerError || !targetWorker) {
      return NextResponse.json({ error: 'Target worker not found' }, { status: 404 });
    }

    if (status) {
      const { error: updateWorkerError } = await supabaseAdmin
        .from('workers')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', workerId);

      if (updateWorkerError) {
        return NextResponse.json({ error: 'Failed to update worker status' }, { status: 500 });
      }
    }

    if (role && targetWorker.membership_id) {
      const { error: updateMembershipError } = await supabaseAdmin
        .from('tenant_memberships')
        .update({ role_code: role })
        .eq('id', targetWorker.membership_id);

      if (updateMembershipError) {
        return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
      }

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

    const { error: deactivateError } = await supabaseAdmin
      .from('workers')
      .update({ status: 'inactive', updated_at: new Date().toISOString() })
      .eq('id', workerId)
      .eq('tenant_id', currentWorker.tenant_id);

    if (deactivateError) {
      return NextResponse.json({ error: 'Failed to deactivate user' }, { status: 500 });
    }

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
