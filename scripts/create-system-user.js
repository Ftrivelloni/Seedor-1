#!/usr/bin/env node


require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar configurados');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createSystemUser() {
  console.log('🔧 Creando usuario de sistema permanente...\n');

  const systemEmail = 'system@seedor.internal';
  const systemPassword = Math.random().toString(36).slice(2) + Date.now().toString(36) + Math.random().toString(36).slice(2);

  try {
    // 1. Verificar si ya existe
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existing = existingUsers?.users?.find(u => u.email === systemEmail);

    if (existing) {
      console.log('✅ Usuario de sistema ya existe');
      console.log(`   ID: ${existing.id}`);
      console.log(`   Email: ${existing.email}`);
      console.log('\n📝 Agrega esta variable a tu .env.local y .env.production:');
      console.log(`\nSUPABASE_SERVICE_USER_ID=${existing.id}\n`);
      return existing.id;
    }

    // 2. Crear nuevo usuario de sistema
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: systemEmail,
      password: systemPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'Seedor System',
        is_system_user: true,
        created_at: new Date().toISOString()
      }
    });

    if (createError) {
      console.error('❌ Error creando usuario de sistema:', createError.message);
      process.exit(1);
    }

    console.log('✅ Usuario de sistema creado exitosamente');
    console.log(`   ID: ${newUser.user.id}`);
    console.log(`   Email: ${newUser.user.email}`);
    
    // 3. Crear profile para el usuario de sistema
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert([{
        user_id: newUser.user.id,
        full_name: 'Seedor System',
        phone: null,
        default_tenant_id: null
      }], { onConflict: 'user_id' });

    if (profileError) {
      console.warn('⚠️  Advertencia: No se pudo crear profile (puede ser normal):', profileError.message);
    }

    console.log('\n📝 IMPORTANTE: Agrega esta variable a tus archivos de entorno:');
    console.log('\n--- Para .env.local ---');
    console.log(`SUPABASE_SERVICE_USER_ID=${newUser.user.id}`);
    console.log('\n--- Para .env.production (Vercel) ---');
    console.log(`SUPABASE_SERVICE_USER_ID=${newUser.user.id}`);
    console.log('\n--- Para .env ---');
    console.log(`SUPABASE_SERVICE_USER_ID=${newUser.user.id}\n`);

    return newUser.user.id;

  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
    process.exit(1);
  }
}

async function updateExistingTenants(systemUserId) {
  console.log('\n🔄 Actualizando tenants existentes...');

  try {
    // Obtener todos los tenants que tienen created_by con emails @local.invalid
    const { data: ghostUsers } = await supabase.auth.admin.listUsers();
    const ghostUserIds = ghostUsers?.users
      ?.filter(u => u.email && u.email.includes('@local.invalid'))
      ?.map(u => u.id) || [];

    if (ghostUserIds.length === 0) {
      console.log('✅ No se encontraron tenants con usuarios fantasma');
      return;
    }

    console.log(`   Encontrados ${ghostUserIds.length} usuarios fantasma`);

    // Actualizar todos los tenants que usan estos IDs
    const { data: updated, error: updateError } = await supabase
      .from('tenants')
      .update({ created_by: systemUserId })
      .in('created_by', ghostUserIds)
      .select('id, name');

    if (updateError) {
      console.error('❌ Error actualizando tenants:', updateError.message);
      return;
    }

    console.log(`✅ Actualizados ${updated?.length || 0} tenants para usar el usuario de sistema`);

  } catch (error) {
    console.error('❌ Error actualizando tenants:', error.message);
  }
}

async function deleteGhostUsers() {
  console.log('\n🗑️  Eliminando usuarios fantasma...');

  try {
    const { data: allUsers } = await supabase.auth.admin.listUsers();
    const ghostUsers = allUsers?.users?.filter(u => 
      u.email && u.email.includes('@local.invalid')
    ) || [];

    if (ghostUsers.length === 0) {
      console.log('✅ No hay usuarios fantasma para eliminar');
      return;
    }

    console.log(`   Encontrados ${ghostUsers.length} usuarios fantasma para eliminar`);

    let deleted = 0;
    let failed = 0;

    for (const user of ghostUsers) {
      try {
        const { error } = await supabase.auth.admin.deleteUser(user.id);
        if (error) {
          console.error(`   ❌ Error eliminando ${user.email}: ${error.message}`);
          failed++;
        } else {
          deleted++;
          console.log(`   ✅ Eliminado: ${user.email}`);
        }
      } catch (err) {
        console.error(`   ❌ Error eliminando ${user.email}:`, err.message);
        failed++;
      }
    }

    console.log(`\n📊 Resumen: ${deleted} eliminados, ${failed} fallidos`);

  } catch (error) {
    console.error('❌ Error eliminando usuarios fantasma:', error.message);
  }
}

async function main() {
  console.log('🚀 Iniciando configuración del usuario de sistema\n');
  console.log('=' .repeat(60));
  
  const systemUserId = await createSystemUser();
  await updateExistingTenants(systemUserId);
  await deleteGhostUsers();

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Proceso completado');
  console.log('\n📋 Próximos pasos:');
  console.log('1. Copia el SUPABASE_SERVICE_USER_ID a tus archivos .env');
  console.log('2. Reinicia tu servidor de desarrollo (npm run dev)');
  console.log('3. Despliega a producción con la nueva variable de entorno');
  console.log('4. Los nuevos tenants usarán el usuario de sistema permanente\n');
}

main().catch(console.error);
