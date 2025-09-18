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