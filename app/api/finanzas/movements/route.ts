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
    const { tenantId, userId, date, kind, amount, notes, categoryId } = body || {}

    if (!tenantId || !date || !kind || amount == null || !categoryId) {
      return NextResponse.json(
        { error: 'tenantId, date, kind, amount y categoryId son requeridos' },
        { status: 400 }
      )
    }

    if (kind !== 'ingreso' && kind !== 'egreso') {
      return NextResponse.json({ error: 'kind debe ser "ingreso" o "egreso"' }, { status: 400 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase admin no configurado' }, { status: 500 })
    }

    const payload: any = {
      tenant_id: tenantId,
      date,
      kind,
      amount: Number(amount),
      category_id: categoryId,
      notes: notes || null,
      created_by: userId || null,
    }

    const { data, error } = await supabaseAdmin
      .from('cash_movements')
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
