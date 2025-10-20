import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null

// GET - List locations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId es requerido' },
        { status: 400 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase admin no configurado' }, { status: 500 })
    }

    const { data, error } = await supabaseAdmin
      .from('inventory_locations')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name')

    if (error) {
      return NextResponse.json(
        { error: `Error al obtener ubicaciones: ${error.message}` },
        { status: 400 }
      )
    }

    return NextResponse.json({ data: data || [] }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error desconocido' }, { status: 500 })
  }
}

// POST - Create location
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantId, name } = body || {}

    if (!tenantId || !name) {
      return NextResponse.json(
        { error: 'tenantId y name son requeridos' },
        { status: 400 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase admin no configurado' }, { status: 500 })
    }

    const { data, error } = await supabaseAdmin
      .from('inventory_locations')
      .insert({
        name: name.trim(),
        tenant_id: tenantId
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: `Error al crear ubicación: ${error.message}` },
        { status: 400 }
      )
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error desconocido' }, { status: 500 })
  }
}

// DELETE - Delete location
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const locationId = searchParams.get('locationId')
    
    if (!tenantId || !locationId) {
      return NextResponse.json(
        { error: 'tenantId y locationId son requeridos' },
        { status: 400 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase admin no configurado' }, { status: 500 })
    }

    // Verificar que no hay items asociados
    const { data: items } = await supabaseAdmin
      .from('inventory_items')
      .select('id')
      .eq('location_id', locationId)
      .eq('tenant_id', tenantId)
      .limit(1)

    if (items && items.length > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar una ubicación que tiene items asociados' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('inventory_locations')
      .delete()
      .eq('id', locationId)
      .eq('tenant_id', tenantId)

    if (error) {
      return NextResponse.json(
        { error: `Error al eliminar ubicación: ${error.message}` },
        { status: 400 }
      )
    }

    return NextResponse.json({ message: 'Ubicación eliminada correctamente' }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error desconocido' }, { status: 500 })
  }
}