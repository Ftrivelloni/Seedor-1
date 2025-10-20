import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null

// GET - List items (si necesario)
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

    let query = supabaseAdmin
      .from('inventory_items')
      .select(`
        *,
        category_name:inventory_categories(name),
        location_name:inventory_locations(name)
      `)
      .eq('tenant_id', tenantId)

    const { data, error } = await query.order('name')

    if (error) {
      return NextResponse.json(
        { error: `Error al obtener items: ${error.message}` },
        { status: 400 }
      )
    }

    // Flatten nested objects
    const items = (data || []).map((item: any) => ({
      ...item,
      category_name: item.category_name?.name,
      location_name: item.location_name?.name
    }))

    return NextResponse.json({ data: items }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error desconocido' }, { status: 500 })
  }
}

// POST - Create item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantId, name, category_id, location_id, unit, min_stock, current_stock } = body || {}

    if (!tenantId || !name || !category_id || !location_id || !unit || min_stock == null) {
      return NextResponse.json(
        { error: 'tenantId, name, category_id, location_id, unit y min_stock son requeridos' },
        { status: 400 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase admin no configurado' }, { status: 500 })
    }

    const { data, error } = await supabaseAdmin
      .from('inventory_items')
      .insert({
        tenant_id: tenantId,
        name: name.trim(),
        category_id,
        location_id,
        unit: unit.trim(),
        min_stock: Number(min_stock),
        current_stock: current_stock ? Number(current_stock) : 0
      })
      .select(`
        *,
        category_name:inventory_categories(name),
        location_name:inventory_locations(name)
      `)
      .single()

    if (error) {
      return NextResponse.json(
        { error: `Error al crear item: ${error.message}` },
        { status: 400 }
      )
    }

    const responseData = {
      ...data,
      category_name: data.category_name?.name,
      location_name: data.location_name?.name
    }

    return NextResponse.json({ data: responseData }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error desconocido' }, { status: 500 })
  }
}

// PUT - Update item  
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantId, itemId, name, category_id, location_id, unit, min_stock } = body || {}

    if (!tenantId || !itemId) {
      return NextResponse.json(
        { error: 'tenantId y itemId son requeridos' },
        { status: 400 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase admin no configurado' }, { status: 500 })
    }

    const updateData: any = {}
    if (name) updateData.name = name.trim()
    if (category_id) updateData.category_id = category_id
    if (location_id) updateData.location_id = location_id
    if (unit) updateData.unit = unit.trim()
    if (min_stock != null) updateData.min_stock = Number(min_stock)

    const { data, error } = await supabaseAdmin
      .from('inventory_items')
      .update(updateData)
      .eq('id', itemId)
      .eq('tenant_id', tenantId)
      .select(`
        *,
        category_name:inventory_categories(name),
        location_name:inventory_locations(name)
      `)
      .single()

    if (error) {
      return NextResponse.json(
        { error: `Error al actualizar item: ${error.message}` },
        { status: 400 }
      )
    }

    const responseData = {
      ...data,
      category_name: data.category_name?.name,
      location_name: data.location_name?.name
    }

    return NextResponse.json({ data: responseData }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error desconocido' }, { status: 500 })
  }
}

// DELETE - Delete item (with CASCADE, movements will be automatically deleted)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const itemId = searchParams.get('itemId')
    
    console.log('🗑️ DELETE item request:', { tenantId, itemId })
    
    if (!tenantId || !itemId) {
      return NextResponse.json(
        { error: 'tenantId y itemId son requeridos' },
        { status: 400 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase admin no configurado' }, { status: 500 })
    }

    // Con CASCADE configurado en la DB, los movimientos se eliminarán automáticamente
    const { error } = await supabaseAdmin
      .from('inventory_items')
      .delete()
      .eq('id', itemId)
      .eq('tenant_id', tenantId)

    if (error) {
      console.error('❌ Error al eliminar item:', error)
      return NextResponse.json(
        { error: `Error al eliminar item: ${error.message}` },
        { status: 400 }
      )
    }

    console.log('✅ Item eliminado exitosamente (movimientos eliminados por CASCADE)')
    return NextResponse.json({ 
      message: 'Item eliminado correctamente (incluyendo sus movimientos)' 
    }, { status: 200 })
  } catch (err: any) {
    console.error('❌ Error en DELETE item:', err)
    return NextResponse.json({ error: err?.message || 'Error desconocido' }, { status: 500 })
  }
}