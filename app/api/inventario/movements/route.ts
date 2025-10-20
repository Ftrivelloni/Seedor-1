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
  console.log('🔄 POST /api/inventario/movements - Inicio de la petición')
  
  try {
    const body = await request.json()
    console.log('📦 Body recibido:', body)
    
    const { tenantId, item_id, type, quantity, unit_cost, reason, date, created_by } = body || {}

    if (!tenantId || !item_id || !type || !quantity || !reason || !date) {
      console.log('❌ Faltan campos requeridos:', { tenantId, item_id, type, quantity, reason, date })
      return NextResponse.json(
        { error: 'tenantId, item_id, type, quantity, reason y date son requeridos' },
        { status: 400 }
      )
    }

    if (!supabaseAdmin) {
      console.log('❌ Supabase admin no configurado')
      return NextResponse.json({ error: 'Supabase admin no configurado' }, { status: 500 })
    }

    // Verificar que el tipo de movimiento existe en la tabla de tipos
    console.log('🔍 Verificando tipo de movimiento:', type)
    const { data: movementTypes, error: typeError } = await supabaseAdmin
      .from('inventory_movement_types')
      .select('code')
    
    console.log('📋 Tipos de movimiento disponibles:', movementTypes)
    
    if (typeError) {
      console.log('⚠️ Error al obtener tipos de movimiento:', typeError)
    }

    const validTypes = movementTypes?.map(t => t.code) || ['IN', 'OUT']
    if (!validTypes.includes(type)) {
      console.log('❌ Tipo de movimiento inválido:', type, 'Tipos válidos:', validTypes)
      return NextResponse.json({ 
        error: `Tipo de movimiento inválido. Tipos válidos: ${validTypes.join(', ')}` 
      }, { status: 400 })
    }
    
    console.log('✅ Validaciones básicas pasaron, buscando item...')

    // Iniciar transacción - Obtener stock actual del item
    const { data: currentItem, error: itemError } = await supabaseAdmin
      .from('inventory_items')
      .select('current_stock')
      .eq('id', item_id)
      .eq('tenant_id', tenantId)
      .single()

    if (itemError) {
      return NextResponse.json(
        { error: `Item no encontrado: ${itemError.message}` },
        { status: 404 }
      )
    }

    const currentStock = currentItem.current_stock
    let newStock = currentStock

    // Calcular nuevo stock según el tipo de movimiento
    switch (type) {
      case 'IN': // Entrada
        newStock = currentStock + Number(quantity)
        break
      case 'OUT': // Salida
        newStock = currentStock - Number(quantity)
        if (newStock < 0) {
          return NextResponse.json(
            { error: 'El stock no puede quedar en negativo' },
            { status: 400 }
          )
        }
        break
      default:
        return NextResponse.json(
          { error: 'Tipo de movimiento no válido' },
          { status: 400 }
        )
    }

    // Crear el movimiento
    const movementPayload: any = {
      tenant_id: tenantId,
      item_id,
      type,
      quantity: Number(quantity),
      reason: reason.trim(),
      date,
      created_by: created_by || null,
    }

    // Solo agregar unit_cost si tiene un valor válido
    if (unit_cost !== null && unit_cost !== undefined && unit_cost !== '') {
      const costValue = Number(unit_cost)
      if (!isNaN(costValue) && costValue > 0) {
        movementPayload.unit_cost = costValue
      }
    }

    console.log('📦 Payload final a insertar:', movementPayload)

    const { data: movement, error: movementError } = await supabaseAdmin
      .from('inventory_movements')
      .insert(movementPayload)
      .select(`
        *,
        item_name:inventory_items(name)
      `)
      .single()

    if (movementError) {
      return NextResponse.json(
        { error: `Error al crear movimiento: ${movementError.message}` },
        { status: 400 }
      )
    }

    // Actualizar el stock del item
    const { error: updateError } = await supabaseAdmin
      .from('inventory_items')
      .update({ current_stock: newStock })
      .eq('id', item_id)
      .eq('tenant_id', tenantId)

    if (updateError) {
      // Si falla la actualización del stock, intentamos limpiar el movimiento creado
      await supabaseAdmin
        .from('inventory_movements')
        .delete()
        .eq('id', movement.id)

      return NextResponse.json(
        { error: `Error al actualizar stock: ${updateError.message}` },
        { status: 500 }
      )
    }

    // Formatear respuesta
    const responseData = {
      ...movement,
      item_name: movement.item_name?.name
    }

    console.log('✅ Movimiento creado exitosamente:', responseData.id)
    return NextResponse.json({ data: responseData }, { status: 201 })
  } catch (err: any) {
    console.log('❌ Error inesperado:', err)
    return NextResponse.json({ error: err?.message || 'Error desconocido' }, { status: 500 })
  }
}

// GET endpoint para verificar tipos de movimiento disponibles
export async function GET(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase admin no configurado' }, { status: 500 })
    }

    const { data: movementTypes, error } = await supabaseAdmin
      .from('inventory_movement_types')
      .select('*')
      .order('code')

    if (error) {
      console.error('Error al obtener tipos de movimiento:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Si no hay tipos de movimiento, intentar crearlos
    if (!movementTypes || movementTypes.length === 0) {
      console.log('⚠️ No hay tipos de movimiento, creando tipos por defecto...')
      
      const defaultTypes = [
        { code: 'IN', name: 'Entrada' },
        { code: 'OUT', name: 'Salida' }
      ]

      const { data: createdTypes, error: createError } = await supabaseAdmin
        .from('inventory_movement_types')
        .insert(defaultTypes)
        .select()

      if (createError) {
        console.error('Error al crear tipos de movimiento por defecto:', createError)
        return NextResponse.json({ 
          error: 'No hay tipos de movimiento configurados y no se pudieron crear automáticamente',
          details: createError.message 
        }, { status: 500 })
      }

      console.log('✅ Tipos de movimiento creados:', createdTypes)
      return NextResponse.json({ data: createdTypes }, { status: 200 })
    }

    return NextResponse.json({ data: movementTypes }, { status: 200 })
  } catch (err: any) {
    console.error('Error en GET /api/inventario/movements:', err)
    return NextResponse.json({ error: err?.message || 'Error desconocido' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  console.log('🗑️ DELETE /api/inventario/movements - Inicio de la petición')
  
  try {
    const { searchParams } = new URL(request.url)
    const movementId = searchParams.get('movementId')
    const tenantId = searchParams.get('tenantId')
    
    console.log('📦 Parámetros recibidos:', { movementId, tenantId })

    if (!movementId || !tenantId) {
      console.log('❌ Faltan parámetros requeridos')
      return NextResponse.json(
        { error: 'movementId y tenantId son requeridos' },
        { status: 400 }
      )
    }

    if (!supabaseAdmin) {
      console.log('❌ Supabase admin no configurado')
      return NextResponse.json({ error: 'Supabase admin no configurado' }, { status: 500 })
    }

    // Obtener el movimiento antes de eliminarlo para revertir el stock
    console.log('🔍 Buscando movimiento:', movementId)
    const { data: movement, error: fetchError } = await supabaseAdmin
      .from('inventory_movements')
      .select('*, inventory_items(current_stock)')
      .eq('id', movementId)
      .eq('tenant_id', tenantId)
      .single()

    if (fetchError || !movement) {
      console.log('❌ Error al buscar movimiento:', fetchError)
      return NextResponse.json({ 
        error: 'Movimiento no encontrado',
        details: fetchError?.message 
      }, { status: 404 })
    }

    console.log('📊 Movimiento encontrado:', movement)

    // Revertir el cambio de stock
    const currentStock = movement.inventory_items?.current_stock || 0
    let newStock = currentStock

    if (movement.type === 'IN') {
      // Si fue entrada, al eliminar debemos restar
      newStock = currentStock - movement.quantity
      console.log(`⬇️ Revirtiendo entrada: ${currentStock} - ${movement.quantity} = ${newStock}`)
    } else if (movement.type === 'OUT') {
      // Si fue salida, al eliminar debemos sumar
      newStock = currentStock + movement.quantity
      console.log(`⬆️ Revirtiendo salida: ${currentStock} + ${movement.quantity} = ${newStock}`)
    }

    // Validar que el stock no quede negativo
    if (newStock < 0) {
      console.log('❌ No se puede eliminar: el stock quedaría negativo')
      return NextResponse.json({ 
        error: 'No se puede eliminar este movimiento porque el stock resultante sería negativo' 
      }, { status: 400 })
    }

    // Actualizar el stock del item
    console.log('📝 Actualizando stock del item:', movement.item_id, 'a', newStock)
    const { error: updateError } = await supabaseAdmin
      .from('inventory_items')
      .update({ current_stock: newStock })
      .eq('id', movement.item_id)
      .eq('tenant_id', tenantId)

    if (updateError) {
      console.log('❌ Error al actualizar stock:', updateError)
      return NextResponse.json({ 
        error: 'Error al actualizar el stock del item',
        details: updateError.message 
      }, { status: 500 })
    }

    // Eliminar el movimiento
    console.log('🗑️ Eliminando movimiento:', movementId)
    const { error: deleteError } = await supabaseAdmin
      .from('inventory_movements')
      .delete()
      .eq('id', movementId)
      .eq('tenant_id', tenantId)

    if (deleteError) {
      console.log('❌ Error al eliminar movimiento:', deleteError)
      
      // Intentar revertir el cambio de stock
      await supabaseAdmin
        .from('inventory_items')
        .update({ current_stock: currentStock })
        .eq('id', movement.item_id)
        .eq('tenant_id', tenantId)
      
      return NextResponse.json({ 
        error: 'Error al eliminar movimiento',
        details: deleteError.message 
      }, { status: 500 })
    }

    console.log('✅ Movimiento eliminado exitosamente')
    return NextResponse.json({ 
      message: 'Movimiento eliminado exitosamente',
      stockUpdated: newStock
    }, { status: 200 })

  } catch (err: any) {
    console.error('Error en DELETE /api/inventario/movements:', err)
    return NextResponse.json({ error: err?.message || 'Error desconocido' }, { status: 500 })
  }
}