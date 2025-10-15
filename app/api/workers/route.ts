import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create a Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenantId,
      fullName,
      documentId,
      email,
      password,
      phone,
      areaModule,
      membershipId
    } = body;

    // Validate required fields
    if (!tenantId || !fullName || !email || !password || !areaModule) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    // Check if tenant exists
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json(
        { error: "Tenant no encontrado" },
        { status: 404 }
      );
    }

    // Check if email already exists
    const { data: existingWorker } = await supabase
      .from('workers')
      .select('email')
      .eq('email', email)
      .single();

    if (existingWorker) {
      return NextResponse.json(
        { error: "Ya existe un usuario con este email" },
        { status: 409 }
      );
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        full_name: fullName,
      },
      email_confirm: true // Auto-confirm email for admin-created users
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: "Error al crear usuario de autenticación: " + authError?.message },
        { status: 500 }
      );
    }

    // Create worker profile
    const { data: worker, error: workerError } = await supabase
      .from('workers')
      .insert([{
        tenant_id: tenantId,
        full_name: fullName,
        document_id: documentId,
        email: email,
        phone: phone,
        area_module: areaModule,
        membership_id: membershipId || `${areaModule.toUpperCase()}-${Date.now()}`,
        status: 'active',
      }])
      .select()
      .single();

    if (workerError) {
      // Clean up auth user if worker creation failed
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: "Error al crear perfil del trabajador: " + workerError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      worker: worker,
      message: "Usuario creado exitosamente"
    });

  } catch (error: any) {
    console.error('Error creating worker:', error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: "No authorization token" },
        { status: 401 }
      );
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      return NextResponse.json(
        { error: "Invalid authorization token" },
        { status: 401 }
      );
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const requestedTenantId = searchParams.get('tenantId')?.trim();
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const rawQuery = (searchParams.get('name') ?? searchParams.get('q') ?? '').trim();

    const { data: memberships, error: membershipError } = await supabase
      .from('tenant_memberships')
      .select('id, tenant_id, role_code, status')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (membershipError) {
      console.error('Error fetching memberships:', membershipError);
      return NextResponse.json(
        { error: "Error fetching memberships" },
        { status: 500 }
      );
    }

    if (!memberships || memberships.length === 0) {
      return NextResponse.json(
        { error: "No active membership found" },
        { status: 403 }
      );
    }

    const membership = requestedTenantId
      ? memberships.find((m) => m.tenant_id === requestedTenantId)
      : memberships[0];

    if (!membership) {
      return NextResponse.json(
        { error: "Tenant access denied" },
        { status: 403 }
      );
    }

    const allowedRoles = ['admin', 'campo', 'empaque', 'finanzas'];
    const normalizedRole = membership.role_code?.toLowerCase?.() ?? '';
    if (!allowedRoles.includes(normalizedRole)) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    let query = supabase
      .from('workers')
      .select('*')
      .eq('tenant_id', membership.tenant_id);

    if (!includeInactive) {
      query = query.eq('status', 'active');
    }

    if (rawQuery.length > 0) {
      const sanitized = rawQuery.replace(/\s+/g, ' ');
      const limited = sanitized.slice(0, 120);
      const cleaned = limited.replace(/[%_]/g, (match) => `\\${match}`);
      const pattern = `%${cleaned}%`;
      query = query.ilike('full_name', pattern);
    }

    const { data: workers, error: workersError } = await query.order('full_name', { ascending: true });

    if (workersError) {
      console.error('Error fetching workers:', workersError);
      return NextResponse.json(
        { error: "Error fetching workers" },
        { status: 500 }
      );
    }

    return NextResponse.json({ workers: workers || [] });
  } catch (error) {
    console.error('Error in GET /api/workers:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
