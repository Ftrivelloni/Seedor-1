import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Usamos service role para poder actualizar tareas sin autenticación
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * POST /api/tasks/update-status
 * Actualiza el estado de una tarea desde el bot de WhatsApp
 * Body: { phone: string, status: 'completada' | 'incompleta', comment?: string }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { phone, status, comment } = body

        if (!phone || !status) {
            return NextResponse.json(
                { error: 'phone y status son requeridos' },
                { status: 400 }
            )
        }

        if (!['completada', 'incompleta'].includes(status)) {
            return NextResponse.json(
                { error: 'status debe ser "completada" o "incompleta"' },
                { status: 400 }
            )
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Normalizar teléfono (solo dígitos)
        const normalizedPhone = phone.replace(/\D/g, '')

        // Buscar el trabajador por teléfono
        const { data: worker, error: workerError } = await supabase
            .from('workers')
            .select('id, full_name, tenant_id')
            .or(`phone.eq.${normalizedPhone},phone.eq.+${normalizedPhone}`)
            .single()

        if (workerError || !worker) {
            console.error('Worker not found for phone:', normalizedPhone, workerError)
            return NextResponse.json(
                { error: 'Trabajador no encontrado', phone: normalizedPhone },
                { status: 404 }
            )
        }

        // Buscar la tarea pendiente más reciente del trabajador para hoy
        const today = new Date().toISOString().split('T')[0]

        const { data: task, error: taskError } = await supabase
            .from('tasks')
            .select('id, title, status_code')
            .eq('worker_id', worker.id)
            .eq('scheduled_date', today)
            .neq('status_code', 'completada')
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (taskError || !task) {
            console.error('Task not found for worker:', worker.id, taskError)
            return NextResponse.json(
                { error: 'No se encontró tarea pendiente para hoy', workerId: worker.id },
                { status: 404 }
            )
        }

        // Actualizar el estado de la tarea
        const updateData: { status_code: string; completion_comment?: string } = {
            status_code: status
        }

        if (comment) {
            updateData.completion_comment = comment
        }

        const { data: updatedTask, error: updateError } = await supabase
            .from('tasks')
            .update(updateData)
            .eq('id', task.id)
            .select()
            .single()

        if (updateError) {
            console.error('Error updating task:', updateError)
            return NextResponse.json(
                { error: 'Error actualizando tarea' },
                { status: 500 }
            )
        }

        console.log(`[Tasks API] Tarea ${task.id} actualizada a "${status}" por ${worker.full_name}`)

        return NextResponse.json({
            success: true,
            task: {
                id: updatedTask.id,
                title: updatedTask.title,
                status: updatedTask.status_code
            },
            worker: {
                id: worker.id,
                name: worker.full_name
            }
        })

    } catch (error) {
        console.error('Error in update-status:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}
