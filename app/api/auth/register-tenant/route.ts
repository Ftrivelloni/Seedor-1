import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase Admin para operaciones con privilegios
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Validadores
const validators = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },
  
  text: (text: string, minLength: number = 1, maxLength: number = 255): boolean => {
    const trimmed = text.trim()
    return trimmed.length >= minLength && trimmed.length <= maxLength
  },
  
  slug: (slug: string): boolean => {
    const slugRegex = /^[a-z0-9\-]+$/
    return slugRegex.test(slug) && slug.length >= 3 && slug.length <= 50
  },
  
  password: (password: string): boolean => {
    return password.length >= 8 && password.length <= 128
  }
};

// Sanitizadores
const sanitizeInput = {
  text: (input: string): string => input.trim().replace(/\s+/g, ' '),
  email: (input: string): string => input.trim().toLowerCase(),
  slug: (input: string): string => input.trim().toLowerCase().replace(/[^a-z0-9\-]/g, '')
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenantName,       // Nombre de la empresa
      slug,             // Identificador único (opcional, se generará si no se provee)
      plan,             // Plan seleccionado (basico, profesional)
      contactName,      // Nombre del propietario/admin
      contactEmail,     // Email del propietario/admin
      password,         // Contraseña del propietario/admin
      phoneNumber       // Teléfono (opcional)
    } = body;

    // Validar campos requeridos
    const errors: Record<string, string> = {};
    
    if (!validators.text(tenantName, 2, 100)) {
      errors.tenantName = 'El nombre de la empresa debe tener entre 2 y 100 caracteres';
    }
    
    if (!validators.text(contactName, 2, 100)) {
      errors.contactName = 'El nombre de contacto debe tener entre 2 y 100 caracteres';
    }
    
    if (!validators.email(contactEmail)) {
      errors.contactEmail = 'El email no tiene un formato válido';
    }
    
    if (!validators.password(password)) {
      errors.password = 'La contraseña debe tener al menos 8 caracteres';
    }
    
    if (!plan || !['basico', 'profesional'].includes(plan)) {
      errors.plan = 'Debe seleccionar un plan válido';
    }
    
    // Crear slug si no se provee
    const finalSlug = slug ? sanitizeInput.slug(slug) : sanitizeInput.slug(tenantName);
    
    if (!validators.slug(finalSlug)) {
      errors.slug = 'El identificador debe contener solo letras minúsculas, números y guiones';
    }
    
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({
        success: false, 
        errors
      }, { status: 400 });
    }

    // Limpiar los datos de entrada
    const cleanData = {
      tenantName: sanitizeInput.text(tenantName),
      slug: finalSlug,
      plan,
      contactName: sanitizeInput.text(contactName),
      contactEmail: sanitizeInput.email(contactEmail),
      password,
      phoneNumber: phoneNumber ? phoneNumber.trim() : null
    };

    let createdUserId: string | null = null;
    let createdTenantId: string | null = null;

    try {
      // 1. Verificar si el email ya está registrado
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = authUsers.users.find(user => user.email === cleanData.contactEmail);
      
      if (existingUser) {
        return NextResponse.json({
          success: false,
          error: "Este email ya está registrado. Por favor use otro o recupere su contraseña."
        }, { status: 400 });
      }

      // 2. Verificar si el slug ya existe
      const { data: existingTenant } = await supabaseAdmin
        .from('tenants')
        .select('id, slug')
        .eq('slug', cleanData.slug)
        .maybeSingle();

      if (existingTenant) {
        return NextResponse.json({
          success: false,
          error: `Ya existe una empresa con el identificador "${cleanData.slug}". Por favor, use otro nombre.`
        }, { status: 400 });
      }

      // 3. Crear el usuario en Supabase Auth con confirmación automática
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: cleanData.contactEmail,
        password: cleanData.password,
        email_confirm: true, // Auto-confirmar email (no requiere verificación)
        user_metadata: {
          full_name: cleanData.contactName,
          phone: cleanData.phoneNumber
        }
      });

      if (authError || !authData.user) {
        console.error('Error al crear usuario:', authError);
        return NextResponse.json({
          success: false,
          error: `Error de autenticación: ${authError?.message || 'No se pudo crear el usuario'}`
        }, { status: 500 });
      }

      createdUserId = authData.user.id;

      // Configuración de límites según el plan
      const planLimits = {
        basico: { maxUsers: 10, maxFields: 5 },
        profesional: { maxUsers: 30, maxFields: 20 }
      };
      
      const limits = planLimits[cleanData.plan as keyof typeof planLimits] || planLimits.basico;

      // 4. Crear el tenant
      const { data: tenant, error: tenantError } = await supabaseAdmin
        .from('tenants')
        .insert([{
          name: cleanData.tenantName,
          slug: cleanData.slug,
          plan: cleanData.plan,
          contact_email: cleanData.contactEmail,
          contact_name: cleanData.contactName,
          created_by: authData.user.id,
          max_users: limits.maxUsers,
          max_fields: limits.maxFields,
          current_users: 1, // El propietario es el primer usuario
          current_fields: 0
        }])
        .select()
        .single();

      if (tenantError || !tenant) {
        console.error('Error al crear tenant:', tenantError);
        throw new Error(`Error al crear la empresa: ${tenantError?.message || 'Error desconocido'}`);
      }

      createdTenantId = tenant.id;

      // 5. Crear el perfil del usuario
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert([{
          user_id: authData.user.id,
          email: cleanData.contactEmail,
          full_name: cleanData.contactName,
          phone: cleanData.phoneNumber,
          default_tenant_id: tenant.id
        }]);

      if (profileError) {
        console.warn('Advertencia al crear perfil:', profileError);
        // No detenemos el flujo por un error en el perfil
      }

      // 6. Crear la membresía de tenant
      const { data: membership, error: membershipError } = await supabaseAdmin
        .from('tenant_memberships')
        .insert([{
          tenant_id: tenant.id,
          user_id: authData.user.id,
          role_code: 'owner', // Rol específico para el creador/propietario
          status: 'active',
          accepted_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (membershipError || !membership) {
        console.error('Error al crear membresía:', membershipError);
        throw new Error(`Error al crear la membresía: ${membershipError?.message || 'Error desconocido'}`);
      }

      // 7. Crear un registro de trabajador asociado
      const { error: workerError } = await supabaseAdmin
        .from('workers')
        .insert([{
          tenant_id: tenant.id,
          full_name: cleanData.contactName,
          email: cleanData.contactEmail,
          phone: cleanData.phoneNumber,
          area_module: 'general',
          membership_id: membership.id,
          status: 'active'
        }]);

      if (workerError) {
        console.warn('Advertencia al crear perfil de trabajador:', workerError);
        // No detenemos el flujo por un error en el worker
      }

      // 8. Habilitar módulos predeterminados
      const defaultModules = ['campo', 'empaque', 'finanzas', 'inventario', 'dashboard'];
      const moduleRecords = defaultModules.map(module => ({
        tenant_id: tenant.id,
        module_code: module,
        enabled: true
      }));

      const { error: modulesError } = await supabaseAdmin
        .from('tenant_modules')
        .insert(moduleRecords);

      if (modulesError) {
        console.warn('Advertencia al crear módulos:', modulesError);
        // No detenemos el flujo por un error en los módulos
      }

      // 9. Registrar en el log de auditoría
      await supabaseAdmin
        .from('audit_logs')
        .insert([{
          tenant_id: tenant.id,
          actor_user_id: authData.user.id,
          action: 'tenant_created',
          entity: 'tenant',
          entity_id: tenant.id,
          details: {
            tenant_name: tenant.name,
            slug: tenant.slug,
            plan: cleanData.plan
          }
        }]);

      // 10. Generar sesión para el usuario
      const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: cleanData.contactEmail,
      });

      if (sessionError) {
        console.warn('Advertencia al generar enlace de sesión:', sessionError);
      }

      // Respuesta exitosa
      return NextResponse.json({
        success: true,
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          plan: tenant.plan
        },
        user: {
          id: authData.user.id,
          email: authData.user.email,
          name: cleanData.contactName
        },
        membership: {
          id: membership.id,
          role: membership.role_code
        }
      });

    } catch (error: any) {
      console.error('Error en la transacción:', error);

      // Limpieza en caso de error
      if (createdTenantId) {
        await supabaseAdmin.from('audit_logs').delete().eq('tenant_id', createdTenantId);
        await supabaseAdmin.from('tenant_modules').delete().eq('tenant_id', createdTenantId);
        await supabaseAdmin.from('workers').delete().eq('tenant_id', createdTenantId);
        await supabaseAdmin.from('tenant_memberships').delete().eq('tenant_id', createdTenantId);
        await supabaseAdmin.from('profiles').delete().eq('default_tenant_id', createdTenantId);
        await supabaseAdmin.from('tenants').delete().eq('id', createdTenantId);
      }
      
      if (createdUserId) {
        try {
          await supabaseAdmin.auth.admin.deleteUser(createdUserId);
        } catch (deleteError) {
          console.error('Error al eliminar usuario de auth:', deleteError);
        }
      }

      return NextResponse.json({
        success: false,
        error: error.message || 'Error inesperado al crear la empresa'
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Error de la API:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al procesar la solicitud'
    }, { status: 500 });
  }
}