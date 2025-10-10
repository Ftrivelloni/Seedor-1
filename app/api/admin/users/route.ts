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
      .eq('status', 'active') // Only active memberships
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

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    }

    // Users and workers are now independent modules
      


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

    // Transform the data to match the expected format (users module independent from workers)
    const transformedUsers = (allMemberships || []).map((membership: any) => {
      const profile = profilesMap[membership.user_id];
      
      return {
        id: membership.id, // Use membership.id as primary ID
        email: authUserMap[membership.user_id] || '',
        full_name: profile?.full_name || '',
        role_code: membership.role_code,
        status: membership.accepted_at ? 'active' : 'pending',
        created_at: membership.created_at || new Date().toISOString(),
        accepted_at: membership.accepted_at,
        phone: profile?.phone || '',
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
      console.error('PUT /api/admin/users: Missing authorization header');
      return NextResponse.json({ error: 'No authorization token' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const body = await request.json();
    const { userId, role } = body;

    console.log('🔄 PUT /api/admin/users:', { userId, role });

    if (!userId || !role) {
      console.error('PUT /api/admin/users: Missing userId or role');
      return NextResponse.json({ error: 'User ID and role are required' }, { status: 400 });
    }

    // Validate role
    const validRoles = ['campo', 'empaque', 'finanzas'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

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

    const currentMembership = userMemberships[0];
    const currentTenant = currentMembership.tenant;

    // Check if role is allowed for current tenant plan
    const { data: tenantData, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('plan')
      .eq('id', currentMembership.tenant_id)
      .single();

    if (tenantError) {
      return NextResponse.json({ error: 'Error checking tenant plan' }, { status: 500 });
    }

    // Validate role against plan
    const allowedRoles = tenantData.plan === 'profesional' 
      ? ['campo', 'empaque', 'finanzas'] 
      : ['campo', 'empaque'];

    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ 
        error: `El rol ${role} no está disponible en el plan ${tenantData.plan}` 
      }, { status: 400 });
    }

    // Find target user membership
    const { data: targetMembership, error: targetError } = await supabaseAdmin
      .from('tenant_memberships')
      .select('*')
      .eq('user_id', userId)
      .eq('tenant_id', currentMembership.tenant_id)
      .single();

    if (targetError || !targetMembership) {
      return NextResponse.json({ error: 'Target user not found in this tenant' }, { status: 404 });
    }

    // Update the user's role
    const { error: updateError } = await supabaseAdmin
      .from('tenant_memberships')
      .update({ 
        role_code: role
      })
      .eq('id', targetMembership.id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
    }

    console.log('✅ User role updated successfully in tenant_memberships');

    return NextResponse.json({ 
      success: true,
      message: 'User role updated successfully'
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
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Verify the requesting user is admin
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
      return NextResponse.json({ error: 'Admin access not found. Only admins can delete users.' }, { status: 403 });
    }

    const currentMembership = userMemberships[0];

    // Find target user membership
    const { data: targetMembership, error: targetError } = await supabaseAdmin
      .from('tenant_memberships')
      .select('*')
      .eq('user_id', userId)
      .eq('tenant_id', currentMembership.tenant_id)
      .single();

    if (targetError || !targetMembership) {
      console.error('❌ Target user not found:', { userId, tenant_id: currentMembership.tenant_id, error: targetError });
      return NextResponse.json({ error: 'Target user not found in this tenant' }, { status: 404 });
    }

    console.log('📋 Target membership found:', targetMembership);

    console.log('� Proceeding to delete user membership without affecting workers table');

    // Delete from tenant_memberships
    console.log('🗑️ Deleting from tenant_memberships for id:', targetMembership.id);
    const { error: membershipDeleteError } = await supabaseAdmin
      .from('tenant_memberships')
      .delete()
      .eq('id', targetMembership.id);

    if (membershipDeleteError) {
      console.error('❌ Error deleting from tenant_memberships:', membershipDeleteError);
      return NextResponse.json({ error: 'Failed to delete user membership' }, { status: 500 });
    }
    
    console.log('✅ Successfully deleted from tenant_memberships');

    console.log('ℹ️ Workers table is independent from users - no automatic cleanup needed');

    // Check if user has any other memberships
    const { data: otherMemberships, error: otherError } = await supabaseAdmin
      .from('tenant_memberships')
      .select('id')
      .eq('user_id', userId);

    if (otherError) {
      console.error('Error checking other memberships:', otherError);
    }

    // If user has no other memberships, delete from auth.users
    if (!otherMemberships || otherMemberships.length === 0) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(userId);
        
        // Also delete from profiles table if exists
        await supabaseAdmin
          .from('profiles')
          .delete()
          .eq('user_id', userId);
      } catch (authError) {
        console.error('Error deleting auth user:', authError);
        // Continue anyway since the membership was deleted
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('DELETE /api/admin/users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}