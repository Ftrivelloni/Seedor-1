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
    const { tenantId, email, fullName, documentId, phone, areaModule, membershipId } = await request.json()

    if (!tenantId || !email || !fullName || !documentId || !areaModule) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos' },
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
          context: 'admin_setup'
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