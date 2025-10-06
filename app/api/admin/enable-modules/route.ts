import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    const { tenantId, modules } = await request.json()

    if (!tenantId || !Array.isArray(modules)) {
      return NextResponse.json(
        { error: 'Parámetros inválidos' },
        { status: 400 }
      )
    }

    await supabaseAdmin
      .from('tenant_modules')
      .delete()
      .eq('tenant_id', tenantId)

    if (modules.length > 0) {
      const moduleInserts = modules.map(moduleCode => ({
        tenant_id: tenantId,
        module_code: moduleCode,
        enabled: true
      }))

      const { error: insertError } = await supabaseAdmin
        .from('tenant_modules')
        .insert(moduleInserts)

      if (insertError) {
        console.error('Error inserting modules:', insertError)
        return NextResponse.json(
          { error: `Error al habilitar módulos: ${insertError.message}` },
          { status: 500 }
        )
      }
    }

    await supabaseAdmin
      .from('audit_logs')
      .insert([{
        tenant_id: tenantId,
        actor_user_id: null,
        action: 'modules_enabled',
        entity: 'tenant_modules',
        entity_id: tenantId,
        details: { 
          enabled_modules: modules,
          context: 'admin_setup'
        }
      }])

    return NextResponse.json({ 
      success: true, 
      data: { enabledModules: modules }
    })

  } catch (error: any) {
    console.error('Error in enable-modules API:', error)
    return NextResponse.json(
      { error: error.message || 'Error inesperado' },
      { status: 500 }
    )
  }
}