'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar as CalendarIcon, Check, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { attendanceApi } from '@/lib/api'
import { Worker, AttendanceStatus, CreateAttendanceData, AttendanceRecord } from '@/lib/types'
import { cn } from '@/lib/utils'

interface DailyAttendanceProps {
  workers: Worker[]
  tenantId: string
  onSuccess: () => void
}

interface WorkerAttendanceState {
  workerId: string
  status: string
  reason: string
}

export function DailyAttendance({ workers, tenantId, onSuccess }: DailyAttendanceProps) {
  const [date, setDate] = useState<Date>(new Date())
  const [statuses, setStatuses] = useState<AttendanceStatus[]>([
    { code: 'PRE', name: 'Presente' },
    { code: 'AUS', name: 'Ausente' },
    { code: 'TAR', name: 'Tardanza' },
    { code: 'LIC', name: 'Licencia' },
    { code: 'VAC', name: 'Vacaciones' }
  ])
  const [existingRecords, setExistingRecords] = useState<AttendanceRecord[]>([])
  const [workerStates, setWorkerStates] = useState<Record<string, WorkerAttendanceState>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    loadStatuses()
  }, [])

  useEffect(() => {
    loadExistingRecords()
  }, [date, tenantId])

  const loadStatuses = async () => {
    try {
      const data = await attendanceApi.getAttendanceStatuses()
      if (data && data.length > 0) {
        setStatuses(data)
      }
      // Si no hay datos en la BD, usa los valores predefinidos arriba
    } catch (err) {
      console.error('Error loading statuses:', err)
      // Mantiene los valores predefinidos en caso de error
    }
  }

  const loadExistingRecords = async () => {
    try {
      const dateStr = format(date, 'yyyy-MM-dd')
      const records = await attendanceApi.getAttendanceByDate(tenantId, dateStr)
      setExistingRecords(records)

      // Pre-populate worker states with existing records
      const newStates: Record<string, WorkerAttendanceState> = {}
      records.forEach(record => {
        newStates[record.worker_id] = {
          workerId: record.worker_id,
          status: record.status,
          reason: record.reason || ''
        }
      })
      setWorkerStates(newStates)
    } catch (err) {
      console.error('Error loading existing records:', err)
    }
  }

  const handleStatusChange = (workerId: string, status: string) => {
    setWorkerStates(prev => ({
      ...prev,
      [workerId]: {
        workerId,
        status,
        reason: prev[workerId]?.reason || ''
      }
    }))
  }

  const handleReasonChange = (workerId: string, reason: string) => {
    setWorkerStates(prev => ({
      ...prev,
      [workerId]: {
        ...prev[workerId],
        workerId,
        status: prev[workerId]?.status || '',
        reason
      }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const dateStr = format(date, 'yyyy-MM-dd')
      
      // Filter workers with status selected
      const attendancesToCreate: CreateAttendanceData[] = []
      const recordsToUpdate: { id: string; updates: Partial<CreateAttendanceData> }[] = []

      for (const worker of workers) {
        const state = workerStates[worker.id]
        if (!state?.status) continue

        const existingRecord = existingRecords.find(r => r.worker_id === worker.id)

        if (existingRecord) {
          // Update existing record
          recordsToUpdate.push({
            id: existingRecord.id,
            updates: {
              status: state.status,
              reason: state.reason.trim() || undefined
            }
          })
        } else {
          // Create new record
          attendancesToCreate.push({
            worker_id: worker.id,
            date: dateStr,
            status: state.status,
            reason: state.reason.trim() || undefined
          })
        }
      }

      // Execute updates
      const updatePromises = recordsToUpdate.map(({ id, updates }) =>
        attendanceApi.updateAttendance(id, updates)
      )
      await Promise.all(updatePromises)

      // Execute creates
      if (attendancesToCreate.length > 0) {
        await attendanceApi.bulkCreateAttendance(tenantId, attendancesToCreate)
      }

      setSuccess(true)
      onSuccess()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      console.error('Error saving attendance:', err)
      setError(err.message || 'Error al guardar asistencias')
    } finally {
      setLoading(false)
    }
  }

  const hasRecordsForDate = existingRecords.length > 0
  const hasChanges = Object.keys(workerStates).length > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tomar Asistencia Diaria</CardTitle>
        <CardDescription>
          Registre la asistencia de todos los trabajadores para la fecha seleccionada
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date Picker */}
          <div className="space-y-2">
            <Label>Fecha</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: es }) : 'Seleccionar fecha'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => newDate && setDate(newDate)}
                  initialFocus
                  locale={es}
                />
              </PopoverContent>
            </Popover>
            {hasRecordsForDate && (
              <p className="text-xs text-amber-600">
                ⚠️ Ya existen registros para esta fecha. Los cambios actualizarán los registros existentes.
              </p>
            )}
          </div>

          {/* Workers List */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {workers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay trabajadores activos
              </div>
            ) : (
              workers.map((worker) => {
                const state = workerStates[worker.id]
                const existingRecord = existingRecords.find(r => r.worker_id === worker.id)
                const needsReason = state?.status && ['AUS', 'TAR'].includes(state.status)

                return (
                  <div key={worker.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{worker.full_name}</p>
                        <p className="text-sm text-muted-foreground">{worker.area_module}</p>
                      </div>
                      {existingRecord && (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          Registrado
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Estado</Label>
                        <Select
                          value={state?.status || ''}
                          onValueChange={(value) => handleStatusChange(worker.id, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                          <SelectContent>
                            {statuses.map((s) => (
                              <SelectItem key={s.code} value={s.code}>
                                {s.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {needsReason && (
                        <div>
                          <Label className="text-xs">
                            Motivo <span className="text-red-500">*</span>
                          </Label>
                          <input
                            type="text"
                            value={state.reason}
                            onChange={(e) => handleReasonChange(worker.id, e.target.value)}
                            placeholder="Motivo..."
                            className="w-full px-3 py-2 text-sm border rounded-md"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {error && (
            <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="text-sm text-green-700 bg-green-50 p-3 rounded-md flex items-center gap-2">
              <Check className="h-4 w-4" />
              Asistencias guardadas correctamente
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || !hasChanges || workers.length === 0}
            className="w-full"
          >
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Guardando...' : 'Guardar Asistencias'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
