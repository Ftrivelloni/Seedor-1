import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side only - has access to SUPABASE_SERVICE_ROLE_KEY
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
    const body = await request.json();
    const {
      tenantName,
      slug,
      plan,
      primaryCrop,
      contactEmail,
      adminFullName,
      adminEmail,
      adminPassword,
      adminPhone,
      adminDocumentId,
    } = body;

    // Validate required fields
    if (!tenantName || !slug || !adminFullName || !adminEmail || !adminPassword) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    let createdUserId: string | null = null;
    let createdTenantId: string | null = null;

    try {
      // 1. Check if email already exists in auth
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingAuthUser = authUsers.users.find(user => user.email === adminEmail);

      if (existingAuthUser) {
        return NextResponse.json({
          success: false,
          error: "Este email ya está registrado. Use la opción de recuperar contraseña."
        });
      }

      // 2. Check if slug already exists
      const { data: existingTenant } = await supabaseAdmin
        .from('tenants')
        .select('slug')
        .eq('slug', slug)
        .maybeSingle();

      if (existingTenant) {
        return NextResponse.json({
          success: false,
          error: `Ya existe una empresa con el identificador "${slug}". Por favor, cambia el nombre de tu empresa.`
        });
      }

      // 3. Create the admin user in Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name: adminFullName,
        }
      });

      if (authError || !authData.user) {
        console.error('Auth error:', authError);
        return NextResponse.json({
          success: false,
          error: `Error de autenticación: ${authError?.message || 'No se pudo crear el usuario'}`
        });
      }

      createdUserId = authData.user.id;

      // 4. Create the tenant
      const { data: tenant, error: tenantError } = await supabaseAdmin
        .from('tenants')
        .insert([{
          name: tenantName,
          slug: slug,
          plan: plan,
          primary_crop: primaryCrop || 'general',
          contact_email: contactEmail,
          contact_name: adminFullName,
          created_by: authData.user.id,
        }])
        .select()
        .single();

      if (tenantError || !tenant) {
        console.error('Tenant error:', tenantError);
        throw new Error(`Error al crear la empresa: ${tenantError?.message || 'Error desconocido'}`);
      }

      createdTenantId = tenant.id;

      // 5. Create the tenant_membership
      const { data: membership, error: membershipError } = await supabaseAdmin
        .from('tenant_memberships')
        .insert([{
          tenant_id: tenant.id,
          user_id: authData.user.id,
          role_code: 'admin',
          status: 'active',
          accepted_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (membershipError || !membership) {
        console.error('Membership error:', membershipError);
        throw new Error(`Error al crear la membresía: ${membershipError?.message || 'Error desconocido'}`);
      }

      // Note: Workers module is now independent - no automatic worker creation

      // 7. Enable default modules
      const defaultModules = ['campo', 'empaque', 'finanzas', 'inventario'];
      const moduleRecords = defaultModules.map(module => ({
        tenant_id: tenant.id,
        module_code: module,
        enabled: true
      }));

      const { error: modulesError } = await supabaseAdmin
        .from('tenant_modules')
        .insert(moduleRecords);

      if (modulesError) {
        console.error('Modules error:', modulesError);
        throw new Error(`Error al crear los módulos: ${modulesError.message}`);
      }

      return NextResponse.json({
        success: true,
        tenant: tenant,
        message: 'Empresa creada exitosamente'
      });

    } catch (error: any) {
      console.error('Transaction error:', error);

      // Cleanup on error
      if (createdTenantId) {
        await supabaseAdmin.from('tenant_modules').delete().eq('tenant_id', createdTenantId);
        await supabaseAdmin.from('tenant_memberships').delete().eq('tenant_id', createdTenantId);
        await supabaseAdmin.from('tenants').delete().eq('id', createdTenantId);
      }

      if (createdUserId) {
        try {
          await supabaseAdmin.auth.admin.deleteUser(createdUserId);
        } catch (deleteError) {
          console.error('Failed to delete auth user:', deleteError);
        }
      }

      return NextResponse.json({
        success: false,
        error: error.message || 'Error inesperado al crear la empresa'
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al procesar la solicitud'
    }, { status: 500 });
  }
}