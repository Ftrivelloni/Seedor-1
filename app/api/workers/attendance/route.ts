import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * GET /api/workers/with-phone
 * Obtiene todos los trabajadores activos con teléfono registrado
 */
export async function GET() {
    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        const { data: workers, error } = await supabase
            .from('workers')
            .select('id, tenant_id, full_name, phone')
            .eq('status', 'active')
            .not('phone', 'is', null)
            .neq('phone', '')

        if (error) {
            console.error('[Workers API] Error getting workers:', error)
            return NextResponse.json({ error: 'Error obteniendo trabajadores' }, { status: 500 })
        }

        console.log(`[Workers API] Found ${workers?.length || 0} workers with phone`)

        return NextResponse.json({
            success: true,
            workers: workers || []
        })

    } catch (error) {
        console.error('[Workers API] Error:', error)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
}

/**
 * POST /api/workers/with-phone
 * Registra asistencia desde WhatsApp
 * Body: { phone: string, status: 'PRE' | 'AUS' }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { phone, status } = body

        console.log('[Attendance API] Registrando asistencia:', { phone, status })

        if (!phone || !status) {
            return NextResponse.json(
                { error: 'phone y status son requeridos' },
                { status: 400 }
            )
        }

        if (!['PRE', 'AUS'].includes(status)) {
            return NextResponse.json(
                { error: 'status debe ser "PRE" o "AUS"' },
                { status: 400 }
            )
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        const normalizedPhone = phone.replace(/\D/g, '')

        // Buscar trabajador por teléfono
        const { data: workers } = await supabase
            .from('workers')
            .select('id, full_name, tenant_id, phone')

        const worker = workers?.find(w => {
            if (!w.phone) return false
            const workerDigits = w.phone.replace(/\D/g, '')
            return workerDigits.endsWith(normalizedPhone.slice(-10)) ||
                normalizedPhone.endsWith(workerDigits.slice(-10))
        })

        if (!worker) {
            console.error('[Attendance API] Worker not found for phone:', normalizedPhone)
            return NextResponse.json(
                { error: 'Trabajador no encontrado' },
                { status: 404 }
            )
        }

        const today = new Date().toISOString().split('T')[0]

        // Verificar si ya existe registro para hoy
        const { data: existingRecord } = await supabase
            .from('attendance_records')
            .select('id')
            .eq('worker_id', worker.id)
            .eq('date', today)
            .single()

        if (existingRecord) {
            // Actualizar registro existente
            const { error: updateError } = await supabase
                .from('attendance_records')
                .update({ status })
                .eq('id', existingRecord.id)

            if (updateError) {
                console.error('[Attendance API] Error updating:', updateError)
                return NextResponse.json({ error: 'Error actualizando asistencia' }, { status: 500 })
            }

            console.log(`[Attendance API] Asistencia actualizada: ${worker.full_name} -> ${status}`)
        } else {
            // Crear nuevo registro
            const { error: insertError } = await supabase
                .from('attendance_records')
                .insert({
                    tenant_id: worker.tenant_id,
                    worker_id: worker.id,
                    date: today,
                    status
                })

            if (insertError) {
                console.error('[Attendance API] Error inserting:', insertError)
                return NextResponse.json({ error: 'Error registrando asistencia' }, { status: 500 })
            }

            console.log(`[Attendance API] Asistencia registrada: ${worker.full_name} -> ${status}`)
        }

        return NextResponse.json({
            success: true,
            worker: { id: worker.id, name: worker.full_name },
            status,
            date: today
        })

    } catch (error) {
        console.error('[Attendance API] Error:', error)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
}
