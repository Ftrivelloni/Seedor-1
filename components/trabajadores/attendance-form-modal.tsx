'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar as CalendarIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { attendanceApi } from '@/lib/api'
import { Worker, AttendanceStatus, CreateAttendanceData } from '@/lib/types'
import { cn } from '@/lib/utils'

interface AttendanceFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  tenantId: string
  worker: Worker
  initialDate?: Date
}

export function AttendanceFormModal({
  isOpen,
  onClose,
  onSuccess,
  tenantId,
  worker,
  initialDate = new Date()
}: AttendanceFormModalProps) {
  const [date, setDate] = useState<Date>(initialDate)
  const [status, setStatus] = useState<string>('')
  const [reason, setReason] = useState<string>('')
  const [statuses, setStatuses] = useState<Array<{ code: string; name: string }>>([
    { code: 'PRE', name: 'Presente' },
    { code: 'AUS', name: 'Ausente' },
    { code: 'TAR', name: 'Tardanza' },
    { code: 'LIC', name: 'Licencia' },
    { code: 'VAC', name: 'Vacaciones' }
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (isOpen) {
      loadStatuses()
      setDate(initialDate)
      setStatus('')
      setReason('')
      setError('')
    }
  }, [isOpen, initialDate])

  const loadStatuses = async () => {
    try {
      const data = await attendanceApi.getAttendanceStatuses()
      if (data && data.length > 0) {
        const normalized = data.map((s: any) => (typeof s === 'string' ? { code: s, name: s } : s))
        setStatuses(normalized)
      }
      // Si no hay datos en la BD, usa los valores predefinidos arriba
    } catch (err) {
      console.error('Error loading statuses:', err)
      // Mantiene los valores predefinidos en caso de error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!status) {
      setError('Debe seleccionar un estado')
      return
    }

    setLoading(true)
    setError('')

    try {
      const attendanceData: CreateAttendanceData = {
        worker_id: worker.id,
        date: format(date, 'yyyy-MM-dd'),
        status: status,
        reason: reason.trim() || undefined
      }

      await attendanceApi.createAttendance(tenantId, attendanceData)
      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Error creating attendance:', err)
      setError(err.message || 'Error al registrar asistencia')
    } finally {
      setLoading(false)
    }
  }

  const needsReason = status && ['AUS', 'TAR'].includes(status)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registrar Asistencia</DialogTitle>
          <div className="text-sm text-muted-foreground">
            Trabajador: <span className="font-medium">{worker.full_name}</span>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Fecha */}
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
          </div>

          {/* Estado */}
          <div className="space-y-2">
            <Label>Estado *</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar estado" />
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

          {/* Motivo (opcional o requerido según el estado) */}
          {status && (
            <div className="space-y-2">
              <Label>
                Motivo {needsReason && '*'}
                {!needsReason && <span className="text-xs text-muted-foreground"> (opcional)</span>}
              </Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ingrese el motivo..."
                rows={3}
              />
            </div>
          )}

          {error && (
            <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
