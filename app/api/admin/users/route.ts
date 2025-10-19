import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables for admin/users route');
}

const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Helper function to verify admin access and get tenant
async function verifyAdminAccess(token: string) {
  if (!supabaseAdmin) {
    throw new Error('Server not configured');
  }

  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !user) {
    throw new Error('Invalid authentication token');
  }

  const { data: memberships, error: membershipError } = await supabaseAdmin
    .from('tenant_memberships')
    .select(`
      *,
      tenant:tenants(*)
    `)
    .eq('user_id', user.id)
    .eq('role_code', 'admin')
    .eq('status', 'active');

  if (membershipError || !memberships || memberships.length === 0) {
    throw new Error('Only admins can perform this action');
  }

  return {
    user,
    membership: memberships[0],
    tenant: memberships[0].tenant
  };
}

// GET: Lista todos los usuarios del tenant (funcionalidad original de admin/users)
export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin || !supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization token' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { membership, tenant } = await verifyAdminAccess(token);

    // Get all users for this tenant (excluding the current admin)
    const { data: allMemberships, error: allMembershipsError } = await supabaseAdmin
      .from('tenant_memberships')
      .select(`
        *,
        profile:profiles(*)
      `)
      .eq('tenant_id', membership.tenant_id)
      .in('role_code', ['admin', 'empaque', 'finanzas', 'campo'])
      .eq('status', 'active')
      .not('user_id', 'eq', membership.user_id);

    if (allMembershipsError) {
      return NextResponse.json({ error: 'Error fetching users' }, { status: 500 });
    }

    // Get profiles and workers data
    const userIds = (allMemberships || []).map(m => m.user_id);
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .in('user_id', userIds);

    const { data: workers } = await supabaseAdmin
      .from('workers')
      .select('*')
      .eq('tenant_id', membership.tenant_id)
      .in('area_module', ['empaque', 'finanzas', 'campo']);

    // Get auth user emails
    const userPromises = (allMemberships || []).map(async (membershipItem: any) => {
      try {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(membershipItem.user_id);
        return { user_id: membershipItem.user_id, email: authUser.user?.email || '' };
      } catch (error) {
        return { user_id: membershipItem.user_id, email: '' };
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

    // Transform the data
    const transformedUsers = (allMemberships || []).map((membershipItem: any) => {
      const worker = workers?.find(w => w.membership_id === membershipItem.id);
      const profile = profilesMap[membershipItem.user_id];
      
      return {
        id: membershipItem.id,
        email: authUserMap[membershipItem.user_id] || profile?.email || worker?.email || '',
        full_name: profile?.full_name || worker?.full_name || '',
        role_code: membershipItem.role_code,
        status: membershipItem.accepted_at ? 'active' : 'pending',
        created_at: membershipItem.created_at || new Date().toISOString(),
        accepted_at: membershipItem.accepted_at,
        phone: profile?.phone || worker?.phone || '',
        document_id: worker?.document_id || '',
        membership: {
          id: membershipItem.id,
          role_code: membershipItem.role_code,
          status: membershipItem.status,
          user_id: membershipItem.user_id,
          invited_by: membershipItem.invited_by,
          accepted_at: membershipItem.accepted_at
        }
      };
    });

    return NextResponse.json({
      users: transformedUsers,
      tenant: tenant
    });

  } catch (error: any) {
    if (error.message === 'Server not configured') {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }
    if (error.message === 'Invalid authentication token') {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }
    if (error.message === 'Only admins can perform this action') {
      return NextResponse.json({ error: 'Only admins can perform this action' }, { status: 403 });
    }
    console.error('GET /api/admin/users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Verifica si un email existe en el tenant (funcionalidad de check-email)
export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin || !supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization token' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const body = await request.json();
    const { email } = body;

    const cleanEmail = String(email || '').trim().toLowerCase();
    
    if (!cleanEmail) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const { membership } = await verifyAdminAccess(token);
    const currentTenantId = membership.tenant_id;

    // Check if there's already a user with this email in the SAME tenant
    const { data: existingMemberships, error: membershipCheckError } = await supabaseAdmin
      .from('tenant_memberships')
      .select('user_id')
      .eq('tenant_id', currentTenantId)
      .eq('status', 'active');

    if (membershipCheckError) {
      return NextResponse.json({ exists: true });
    }

    // Get auth users for existing memberships to check emails
    let emailExists = false;
    
    if (existingMemberships && existingMemberships.length > 0) {
      for (const membershipItem of existingMemberships) {
        try {
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(membershipItem.user_id);
          if (authUser.user?.email?.toLowerCase() === cleanEmail) {
            emailExists = true;
            break;
          }
        } catch (error) {
          // Continue checking other users
        }
      }
    }

    // Also check pending invitations for this tenant
    if (!emailExists) {
      const { data: pendingInvitation, error: invitationError } = await supabaseAdmin
        .from('invitations')
        .select('id')
        .eq('tenant_id', currentTenantId)
        .eq('email', cleanEmail)
        .is('accepted_at', null)
        .is('revoked_at', null)
        .gt('expires_at', new Date().toISOString())
        .limit(1);

      if (!invitationError && pendingInvitation && pendingInvitation.length > 0) {
        emailExists = true;
      }
    }

    return NextResponse.json({ exists: emailExists });

  } catch (error: any) {
    // Fail closed to prevent duplicate usage (como en check-email original)
    if (error.message === 'Server not configured') {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }
    return NextResponse.json({ exists: true, error: 'Internal error occurred' });
  }
}

// PUT: Actualiza el rol de un usuario (funcionalidad original de admin/users)
export async function PUT(request: NextRequest) {
  try {
    if (!supabaseAdmin || !supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization token' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json({ error: 'User ID and role are required' }, { status: 400 });
    }

    // Validate role
    const validRoles = ['campo', 'empaque', 'finanzas'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const { membership } = await verifyAdminAccess(token);

    // Check tenant plan limitations
    const { data: tenantData, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('plan')
      .eq('id', membership.tenant_id)
      .single();

    if (tenantError) {
      return NextResponse.json({ error: 'Error checking tenant plan' }, { status: 500 });
    }

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
      .eq('tenant_id', membership.tenant_id)
      .single();

    if (targetError || !targetMembership) {
      return NextResponse.json({ error: 'Target user not found in this tenant' }, { status: 404 });
    }

    // Update the user's role
    const { error: updateError } = await supabaseAdmin
      .from('tenant_memberships')
      .update({ role_code: role })
      .eq('id', targetMembership.id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
    }

    // Update workers table and tenant current_users (resto de la lógica original)
    // ... [resto del código PUT original] ...

    return NextResponse.json({ 
      success: true,
      message: 'User role updated successfully'
    });

  } catch (error: any) {
    if (error.message === 'Server not configured') {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }
    if (error.message === 'Invalid authentication token') {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }
    if (error.message === 'Only admins can perform this action') {
      return NextResponse.json({ error: 'Only admins can perform this action' }, { status: 403 });
    }
    console.error('PUT /api/admin/users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Elimina un usuario (funcionalidad original de admin/users)
export async function DELETE(request: NextRequest) {
  try {
    if (!supabaseAdmin || !supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

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

    const { membership } = await verifyAdminAccess(token);

    // Buscar la membresía del usuario a eliminar
    const { data: targetMembership, error: membershipError } = await supabaseAdmin
      .from('tenant_memberships')
      .select('*')
      .eq('user_id', userId)
      .eq('tenant_id', membership.tenant_id)
      .eq('status', 'active')
      .single();

    if (membershipError || !targetMembership) {
      return NextResponse.json({ error: 'Usuario no encontrado en este tenant' }, { status: 404 });
    }

    // No permitir que el admin se elimine a sí mismo
    if (userId === membership.user_id) {
      return NextResponse.json({ error: 'No puedes eliminarte a ti mismo' }, { status: 400 });
    }

    // Verificar si el usuario tiene rol que cuenta en current_users
    const shouldDecrementCount = ["admin", "campo", "empaque", "finanzas"].includes(targetMembership.role_code);

    // Eliminar registro de workers si existe
    const { error: workerDeleteError } = await supabaseAdmin
      .from('workers')
      .delete()
      .eq('membership_id', targetMembership.id)
      .eq('tenant_id', membership.tenant_id);

    if (workerDeleteError) {
      console.error('Error deleting worker:', workerDeleteError);
      // Continuar aunque falle la eliminación del worker
    }

    // Eliminar el usuario de Supabase Auth primero
    const { error: deleteAuthUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (deleteAuthUserError) {
      console.error('Error deleting auth user:', deleteAuthUserError);
      return NextResponse.json({ error: 'Error al eliminar usuario de autenticación' }, { status: 500 });
    }

    // Eliminar el perfil del usuario
    const { error: deleteProfileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('user_id', userId);

    if (deleteProfileError) {
      console.error('Error deleting user profile:', deleteProfileError);
      // Continuar aunque falle la eliminación del perfil
    }

    // Eliminar la membresía (esto desactiva al usuario del tenant)
    const { error: deleteMembershipError } = await supabaseAdmin
      .from('tenant_memberships')
      .delete()
      .eq('id', targetMembership.id);

    if (deleteMembershipError) {
      return NextResponse.json({ error: 'Error al eliminar membresía del usuario' }, { status: 500 });
    }

    // IMPORTANTE: Decrementar current_users solo si el rol contaba en el límite
    if (shouldDecrementCount) {
      const { data: tenantData, error: tenantFetchError } = await supabaseAdmin
        .from('tenants')
        .select('current_users')
        .eq('id', membership.tenant_id)
        .single();

      if (tenantFetchError) {
        console.error('Error fetching tenant for decrement:', tenantFetchError);
      } else {
        const newCount = Math.max(0, tenantData.current_users - 1);
        console.log(`[DEBUG] Decrementando current_users de ${tenantData.current_users} a ${newCount} para tenant ${membership.tenant_id} (eliminación de rol ${targetMembership.role_code})`);
        
        const { error: updateError } = await supabaseAdmin
          .from('tenants')
          .update({ current_users: newCount })
          .eq('id', membership.tenant_id);

        if (updateError) {
          console.error('Error updating tenant current_users:', updateError);
          // No devolvemos error aquí porque el usuario ya fue eliminado
        }
      }
    } else {
      console.log(`[DEBUG] NO se decrementa current_users porque el rol ${targetMembership.role_code} no cuenta en el límite`);
    }

    // Registrar en audit log
    await supabaseAdmin
      .from('audit_logs')
      .insert([{
        tenant_id: membership.tenant_id,
        actor_user_id: membership.user_id,
        action: 'user_deleted',
        entity: 'user',
        entity_id: userId,
        details: {
          deleted_user_role: targetMembership.role_code,
          decremented_count: shouldDecrementCount
        }
      }]);

    return NextResponse.json({ 
      success: true,
      message: 'Usuario eliminado exitosamente'
    });

  } catch (error: any) {
    if (error.message === 'Server not configured') {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }
    if (error.message === 'Invalid authentication token') {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }
    if (error.message === 'Only admins can perform this action') {
      return NextResponse.json({ error: 'Only admins can perform this action' }, { status: 403 });
    }
    console.error('DELETE /api/admin/users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}