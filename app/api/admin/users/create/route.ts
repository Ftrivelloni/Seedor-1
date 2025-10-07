import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { authService } from '../../../../../lib/supabaseAuth';

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

// POST /api/admin/users/create - Create a new user directly
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/admin/users/create - Request received');
    
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      console.log('POST /api/admin/users/create - No authorization token provided');
      return NextResponse.json({ error: 'No authorization token' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const body = await request.json();
    const { email, password, fullName, role, documentId, phone } = body;

    if (!email || !password || !fullName || !role || !documentId) {
      console.error('POST /api/admin/users/create - Missing required fields');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log(`POST /api/admin/users/create - Creating user ${email} with role ${role}`);

    // Verify the requesting user
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error('POST /api/admin/users/create - Invalid token:', userError);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    console.log(`POST /api/admin/users/create - User verified: ${user.email}`);

    // Get user's memberships directly
    const { data: adminMemberships, error: adminMembershipError } = await supabaseAdmin
      .from('tenant_memberships')
      .select('*, tenants(*)')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (adminMembershipError || !adminMemberships || adminMemberships.length === 0) {
      console.error('POST /api/admin/users/create - No active memberships found:', adminMembershipError);
      return NextResponse.json({ error: 'No active memberships found' }, { status: 403 });
    }
    
    // Find admin membership
    const adminMembership = adminMemberships.find(m => m.role_code === 'admin' || m.role_code === 'owner');
    
    if (!adminMembership) {
      console.error(`POST /api/admin/users/create - Access denied. User is not admin: ${user.email}`);
      return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 });
    }
    
    const tenantId = adminMembership.tenant_id;
    console.log(`POST /api/admin/users/create - Admin verified: ${user.email}, tenant: ${tenantId}`);

    // Use the authService createUser function
    const result = await authService.createUser({
      tenantId,
      email,
      password,
      full_name: fullName,
      document_id: documentId,
      phone: phone || '',
      role_code: role,
      created_by: user.id
    });

    if (!result.success) {
      console.error('POST /api/admin/users/create - Failed to create user:', result.error);
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    console.log('POST /api/admin/users/create - User created successfully:', result.data?.worker?.id);

    return NextResponse.json({ 
      success: true,
      worker: result.data?.worker,
      message: 'Usuario creado exitosamente. Ya puede iniciar sesión con sus credenciales.'
    });

  } catch (error) {
    console.error('POST /api/admin/users/create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}