import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { tenantId, name, kind } = body || {}

    if (!tenantId || !name || typeof name !== 'string') {
      return NextResponse.json({ error: 'tenantId y name son requeridos' }, { status: 400 })
    }

    if (!kind || (kind !== 'ingreso' && kind !== 'egreso')) {
      return NextResponse.json({ error: 'kind es requerido y debe ser "ingreso" o "egreso"' }, { status: 400 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase admin no configurado. Verifica SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 })
    }

    const payload = { tenant_id: tenantId, name, kind }

    const { data, error } = await supabaseAdmin
      .from('finance_categories')
      .insert(payload)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message, details: error }, { status: 400 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error desconocido' }, { status: 500 })
  }
}
