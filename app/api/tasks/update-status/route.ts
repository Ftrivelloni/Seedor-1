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

        console.log('[Tasks API] Recibida solicitud:', { phone, status, comment })

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
        console.log('[Tasks API] Teléfono normalizado:', normalizedPhone)

        // Buscar el trabajador por teléfono - búsqueda más flexible con LIKE
        const { data: workers, error: workerError } = await supabase
            .from('workers')
            .select('id, full_name, tenant_id, phone')

        console.log('[Tasks API] Trabajadores encontrados:', workers?.length, 'Error:', workerError)

        // Buscar trabajador cuyo teléfono contenga los dígitos
        const worker = workers?.find(w => {
            if (!w.phone) return false
            const workerDigits = w.phone.replace(/\D/g, '')
            // Comparar los últimos 10 dígitos (sin código de país)
            return workerDigits.endsWith(normalizedPhone.slice(-10)) ||
                normalizedPhone.endsWith(workerDigits.slice(-10))
        })

        if (workerError || !worker) {
            console.error('[Tasks API] Worker not found for phone:', normalizedPhone)
            console.error('[Tasks API] Teléfonos disponibles:', workers?.map(w => w.phone))
            return NextResponse.json(
                { error: 'Trabajador no encontrado', phone: normalizedPhone, availablePhones: workers?.map(w => w.phone) },
                { status: 404 }
            )
        }

        console.log('[Tasks API] Trabajador encontrado:', worker.id, worker.full_name)

        // Buscar la tarea pendiente más reciente del trabajador (sin filtrar por fecha)
        console.log('[Tasks API] Buscando tareas pendientes para worker_id:', worker.id)

        // Primero buscar todas las tareas del trabajador para debug
        const { data: allTasks, error: allTasksError } = await supabase
            .from('tasks')
            .select('id, title, status_code, scheduled_date, worker_id')
            .eq('worker_id', worker.id)

        console.log('[Tasks API] Todas las tareas del trabajador:', allTasks)

        // Buscar cualquier tarea pendiente (sin filtrar por fecha)
        const { data: task, error: taskError } = await supabase
            .from('tasks')
            .select('id, title, status_code, scheduled_date')
            .eq('worker_id', worker.id)
            .neq('status_code', 'completada')
            .order('scheduled_date', { ascending: true }) // La más próxima primero
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (taskError || !task) {
            console.error('[Tasks API] No pending task found for worker:', worker.id)
            console.error('[Tasks API] Task error:', taskError)
            return NextResponse.json(
                {
                    error: 'No se encontró tarea pendiente',
                    workerId: worker.id,
                    allTasks: allTasks?.map(t => ({ id: t.id, title: t.title, date: t.scheduled_date, status: t.status_code }))
                },
                { status: 404 }
            )
        }


        console.log('[Tasks API] Tarea encontrada:', task.id, task.title)

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
            console.error('[Tasks API] Error updating task:', updateError)
            return NextResponse.json(
                { error: 'Error actualizando tarea', details: updateError },
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
        console.error('[Tasks API] Error in update-status:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor', details: String(error) },
            { status: 500 }
        )
    }
}
