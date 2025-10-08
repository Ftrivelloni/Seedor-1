import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Check if environment variables are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing required Supabase environment variables');
}

const supabaseAdmin = supabaseUrl && serviceRoleKey 
  ? createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  : null

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase configuration missing. Please check environment variables.' },
        { status: 500 }
      )
    }

    const { tenantId, email, fullName, documentId, phone, password, areaModule, membershipId } = await request.json()

    if (!tenantId || !email || !fullName || !documentId || !areaModule) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos' },
        { status: 400 }
      )
    }

    if (password && password.length < 8) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      )
    }

    const { data: existingWorker } = await supabaseAdmin
      .from('workers')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('document_id', documentId)
      .maybeSingle()

    if (existingWorker) {
      return NextResponse.json(
        { error: 'Ya existe un trabajador con ese documento en esta empresa' },
        { status: 400 }
      )
    }

    if (password) {
      try {
        console.log('🔄 Creating user in Supabase Auth for:', email);
        
        const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
          email: email.toLowerCase().trim(),
          password: password,
          user_metadata: {
            full_name: fullName,
            phone: phone || null
          },
          email_confirm: true
        })

        if (createUserError) {
          if (createUserError.message.includes('User already registered')) {
            console.log('⚠️ User already exists, continuing...');
          } else {
            console.error('❌ Error creating user:', createUserError);
            return NextResponse.json(
              { error: `Error al crear usuario: ${createUserError.message}` },
              { status: 500 }
            )
          }
        } else {
          console.log('✅ User created successfully');
          
          // Crear profile para el usuario
          console.log('🔄 Creating profile for user:', newUser.user.id);
          const { data: profileData, error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert([{
              user_id: newUser.user.id,
              full_name: fullName,
              phone: phone || null,
              default_tenant_id: tenantId
            }])
            .select()
            .single();

          if (profileError) {
            console.error('❌ Error creating profile:', profileError);
            console.error('❌ Profile error details:', profileError.details);
            console.error('❌ Profile error hint:', profileError.hint);
          } else {
            console.log('✅ Profile created successfully:', profileData);
          }
        }

      } catch (authError: any) {
        console.error('❌ Auth error:', authError);
        return NextResponse.json(
          { error: `Error en autenticación: ${authError.message}` },
          { status: 500 }
        )
      }
    } else {
      console.log('ℹ️ No password provided, skipping Supabase Auth user creation');
    }

    const { data: worker, error: workerError } = await supabaseAdmin
      .from('workers')
      .insert([{
        tenant_id: tenantId,
        full_name: fullName,
        document_id: documentId,
        email: email.toLowerCase().trim(),
        phone: phone || null,
        area_module: areaModule,
        membership_id: membershipId,
        status: 'active'
      }])
      .select()
      .single()

    if (workerError) {
      console.error('Error creating worker:', workerError)
      return NextResponse.json(
        { error: `Error al crear trabajador: ${workerError.message}` },
        { status: 500 }
      )
    }

    await supabaseAdmin
      .from('audit_logs')
      .insert([{
        tenant_id: tenantId,
        actor_user_id: null, 
        action: 'worker_created',
        entity: 'worker',
        entity_id: worker.id,
        details: { 
          worker_name: fullName,
          area_module: areaModule,
          password_configured: !!password,
          context: password ? 'regular_worker' : 'admin_setup'
        }
      }])

    return NextResponse.json({ 
      success: true, 
      data: worker
    })

  } catch (error: any) {
    console.error('Error in create-worker API:', error)
    return NextResponse.json(
      { error: error.message || 'Error inesperado' },
      { status: 500 }
    )
  }
}