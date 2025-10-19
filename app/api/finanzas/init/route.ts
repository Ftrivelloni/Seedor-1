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
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase admin no configurado' }, { status: 500 })
    }

    // Insertar los tipos de finanzas (ingreso y egreso)
    const { data: kinds, error: kindsError } = await supabaseAdmin
      .from('finance_kinds')
      .upsert([
        { code: 'ingreso', name: 'Ingreso' },
        { code: 'egreso', name: 'Egreso' },
      ], { onConflict: 'code' })

    if (kindsError) {
      return NextResponse.json({ 
        error: 'Error insertando finance_kinds', 
        details: kindsError 
      }, { status: 400 })
    }

    // Verificar que se insertaron
    const { data: allKinds, error: selectError } = await supabaseAdmin
      .from('finance_kinds')
      .select('*')

    if (selectError) {
      return NextResponse.json({ 
        error: 'Error verificando finance_kinds', 
        details: selectError 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      message: 'Finance kinds inicializados correctamente',
      data: allKinds 
    }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ 
      error: err?.message || 'Error desconocido' 
    }, { status: 500 })
  }
}
