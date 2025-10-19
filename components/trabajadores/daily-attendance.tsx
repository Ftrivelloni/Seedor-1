'use client'

import { useState, useEffect, useMemo } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar as CalendarIcon, Check, Save, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { attendanceApi } from '@/lib/api'
import { Worker, AttendanceStatus, AttendanceRecord } from '@/lib/types'
import { cn } from '@/lib/utils'

interface DailyAttendanceProps {
  workers: Worker[]
  tenantId: string
  onSuccess: () => void
}

export function DailyAttendance({ workers, tenantId, onSuccess }: DailyAttendanceProps) {
  const [date, setDate] = useState<Date>(new Date())
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('')
  const [status, setStatus] = useState<string>('')
  const [reason, setReason] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [workerSelectorOpen, setWorkerSelectorOpen] = useState(false)
  const [statuses, setStatuses] = useState<Array<{ code: string; name: string }>>([
    { code: 'PRE', name: 'Presente' },
    { code: 'AUS', name: 'Ausente' },
    { code: 'TAR', name: 'Tardanza' },
    { code: 'LIC', name: 'Licencia' },
    { code: 'VAC', name: 'Vacaciones' }
  ])
  const [existingRecord, setExistingRecord] = useState<AttendanceRecord | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    loadStatuses()
  }, [])

  useEffect(() => {
    if (selectedWorkerId && date) {
      loadExistingRecord()
    }
  }, [date, selectedWorkerId, tenantId])

  const normalizeText = (text: string) =>
    text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()

  const filteredWorkers = useMemo(() => {
    const trimmed = searchTerm.trim()
    if (!trimmed) {
      return workers
    }
    const normalizedQuery = normalizeText(trimmed)
    return workers.filter((worker) =>
      normalizeText(worker.full_name || '').includes(normalizedQuery)
    )
  }, [workers, searchTerm])

  useEffect(() => {
    if (!workerSelectorOpen) {
      setSearchTerm('')
    }
  }, [workerSelectorOpen])

  const loadStatuses = async () => {
    try {
      const data = await attendanceApi.getAttendanceStatuses()
      if (data && data.length > 0) {
        const normalized = data.map((s: any) => (typeof s === 'string' ? { code: s, name: s } : s))
        setStatuses(normalized)
      }
    } catch (err) {
      console.error('Error loading statuses:', err)
    }
  }

  const loadExistingRecord = async () => {
    try {
      const dateStr = format(date, 'yyyy-MM-dd')
      const records = await attendanceApi.getAttendanceByDate(tenantId, dateStr)
      const record = records.find(r => r.worker_id === selectedWorkerId)
      
      if (record) {
        setExistingRecord(record)
  setStatus(typeof record.status === 'string' ? record.status : (record.status as any).code)
        setReason(record.reason || '')
      } else {
        setExistingRecord(null)
        setStatus('')
        setReason('')
      }
    } catch (err) {
      console.error('Error loading existing record:', err)
      setExistingRecord(null)
      setStatus('')
      setReason('')
    }
  }

  const handleWorkerChange = (workerId: string) => {
    setSelectedWorkerId(workerId)
    setStatus('')
    setReason('')
    setError('')
    setSuccess(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      // Validar que no sea una fecha futura
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const selectedDate = new Date(date)
      selectedDate.setHours(0, 0, 0, 0)
      
      if (selectedDate > today) {
        setError('No se puede registrar asistencia para fechas futuras')
        setLoading(false)
        return
      }

      if (!status) {
        setError('Debe seleccionar un estado')
        setLoading(false)
        return
      }

      const dateStr = format(date, 'yyyy-MM-dd')

      if (existingRecord) {
        // Update existing record
        await attendanceApi.updateAttendance(existingRecord.id, {
          status,
          reason: reason.trim() || undefined
        })
      } else {
        // Create new record
        await attendanceApi.createAttendance(tenantId, {
          worker_id: selectedWorkerId,
          date: dateStr,
          status,
          reason: reason.trim() || undefined
        })
      }

      setSuccess(true)
      onSuccess()
      
      // Reload the record
      await loadExistingRecord()
      
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      console.error('Error saving attendance:', err)
      setError(err.message || 'Error al guardar asistencia')
    } finally {
      setLoading(false)
    }
  }

  const selectedWorker = workers.find(w => w.id === selectedWorkerId)
  const needsReason = status && ['AUS', 'TAR'].includes(status)

  const getAreaColor = (area: string) => {
    switch (area) {
      case "campo":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "empaque":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "finanzas":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "admin":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getAreaLabel = (area: string) => {
    const labels: Record<string, string> = {
      campo: "Campo",
      empaque: "Empaque",
      finanzas: "Finanzas",
      admin: "Administración"
    }
    return labels[area] || area
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tomar Asistencia Diaria</CardTitle>
        <CardDescription>
          Registre la asistencia individual por trabajador para la fecha seleccionada
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
                  disabled={(date) => {
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    return date > today
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Worker Selector */}
          <div className="space-y-2">
            <Label>Seleccionar Trabajador</Label>
            <Popover open={workerSelectorOpen} onOpenChange={setWorkerSelectorOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={workerSelectorOpen}
                  className={cn(
                    'w-full justify-between',
                    !selectedWorker && 'text-muted-foreground'
                  )}
                >
                  {selectedWorker
                    ? `${selectedWorker.full_name} - ${getAreaLabel(selectedWorker.area_module)}`
                    : 'Seleccionar trabajador'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="w-[var(--radix-popover-trigger-width)] p-0"
              >
                <Command shouldFilter={false}>
                  <CommandInput
                    value={searchTerm}
                    onValueChange={setSearchTerm}
                    placeholder="Buscar por nombre..."
                    autoFocus
                  />
                  <CommandList>
                    <CommandEmpty>Sin resultados</CommandEmpty>
                    <CommandGroup>
                      {filteredWorkers.map((worker) => (
                        <CommandItem
                          key={worker.id}
                          value={worker.id}
                          onSelect={(value) => {
                            handleWorkerChange(value)
                            setWorkerSelectorOpen(false)
                          }}
                        >
                          {worker.full_name} - {getAreaLabel(worker.area_module)}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Worker Info Card */}
          {selectedWorker ? (
            <Card className="bg-muted/50 border-2">
              <CardContent className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-lg leading-tight">{selectedWorker.full_name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{selectedWorker.email}</p>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-muted-foreground">DNI: {selectedWorker.document_id}</p>
                  {selectedWorker.phone && (
                    <p className="text-muted-foreground">Tel: {selectedWorker.phone}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getAreaColor(selectedWorker.area_module)}>
                    {getAreaLabel(selectedWorker.area_module)}
                  </Badge>
                  {existingRecord && (
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      <Check className="h-3 w-3 mr-1" />
                      Ya registrado
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-muted/30 border-dashed border-2">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  Seleccione un trabajador para registrar su asistencia
                </p>
              </CardContent>
            </Card>
          )}

          {/* Status Selection */}
          <div className="space-y-2">
            <Label>Estado de Asistencia</Label>
            <Select value={status} onValueChange={setStatus} disabled={!selectedWorkerId}>
              <SelectTrigger aria-label="Estado de asistencia">
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

          {/* Reason Input */}
          {needsReason && (
            <div className="space-y-2">
              <Label>
                Motivo <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ingrese el motivo..."
                required
                disabled={!selectedWorkerId}
              />
            </div>
          )}

          {error && (
            <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="text-sm text-green-700 bg-green-50 p-3 rounded-md flex items-center gap-2">
              <Check className="h-4 w-4" />
              Asistencia guardada correctamente
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || !status || !selectedWorkerId || workers.length === 0}
            className="w-full"
          >
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Guardando...' : existingRecord ? 'Actualizar Asistencia' : 'Guardar Asistencia'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
