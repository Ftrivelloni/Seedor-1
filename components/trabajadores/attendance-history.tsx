'use client'

import { useState, useEffect } from 'react'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar as CalendarIcon, CheckCircle2, XCircle, Clock, FileText, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { attendanceApi } from '@/lib/api'
import { AttendanceRecord, Worker } from '@/lib/types'

interface AttendanceHistoryProps {
  worker: Worker
  tenantId: string
}

export function AttendanceHistory({ worker, tenantId }: AttendanceHistoryProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'))
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
    leave: 0,
    vacation: 0,
    total: 0
  })

  useEffect(() => {
    loadRecords()
  }, [worker.id, startDate, endDate])

  const loadRecords = async () => {
    setLoading(true)
    try {
      const data = await attendanceApi.getAttendanceByWorker(worker.id, startDate, endDate)
      setRecords(data)
      calculateStats(data)
    } catch (err) {
      console.error('Error loading attendance records:', err)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (records: AttendanceRecord[]) => {
    const stats = {
      present: records.filter(r => r.status === 'PRE').length,
      absent: records.filter(r => r.status === 'AUS').length,
      late: records.filter(r => r.status === 'TAR').length,
      leave: records.filter(r => r.status === 'LIC').length,
      vacation: records.filter(r => r.status === 'VAC').length,
      total: records.length
    }
    setStats(stats)
  }

  const handleDeleteRecord = async (recordId: string) => {
    if (!confirm('¿Está seguro de eliminar este registro?')) return

    try {
      await attendanceApi.deleteAttendance(recordId)
      loadRecords()
    } catch (err) {
      console.error('Error deleting record:', err)
      alert('Error al eliminar el registro')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      PRE: { label: 'Presente', variant: 'default' },
      AUS: { label: 'Ausente', variant: 'destructive' },
      TAR: { label: 'Tardanza', variant: 'secondary' },
      LIC: { label: 'Licencia', variant: 'outline' },
      VAC: { label: 'Vacaciones', variant: 'outline' }
    }

    const config = statusConfig[status] || { label: status, variant: 'outline' }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const loadPreviousMonth = () => {
    const newMonth = subMonths(currentMonth, 1)
    setCurrentMonth(newMonth)
    setStartDate(format(startOfMonth(newMonth), 'yyyy-MM-dd'))
    setEndDate(format(endOfMonth(newMonth), 'yyyy-MM-dd'))
  }

  const loadCurrentMonth = () => {
    const today = new Date()
    setCurrentMonth(today)
    setStartDate(format(startOfMonth(today), 'yyyy-MM-dd'))
    setEndDate(format(endOfMonth(today), 'yyyy-MM-dd'))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Asistencia</CardTitle>
        <CardDescription>
          {worker.full_name} - {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Navigation */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadPreviousMonth}>
            Mes Anterior
          </Button>
          <Button variant="outline" size="sm" onClick={loadCurrentMonth}>
            Mes Actual
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-700">{stats.present}</p>
                  <p className="text-xs text-green-600">Presente</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-2xl font-bold text-red-700">{stats.absent}</p>
                  <p className="text-xs text-red-600">Ausente</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                <div>
                  <p className="text-2xl font-bold text-amber-700">{stats.late}</p>
                  <p className="text-xs text-amber-600">Tardanza</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-blue-700">{stats.leave}</p>
                  <p className="text-xs text-blue-600">Licencia</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold text-purple-700">{stats.vacation}</p>
                  <p className="text-xs text-purple-600">Vacaciones</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Records Table */}
        <div className="border rounded-lg">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              Cargando registros...
            </div>
          ) : records.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No hay registros de asistencia para este período
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead className="w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      {format(new Date(record.date), 'dd/MM/yyyy', { locale: es })}
                    </TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                    <TableCell>
                      {record.reason ? (
                        <span className="text-sm">{record.reason}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRecord(record.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Total Records */}
        {records.length > 0 && (
          <div className="text-sm text-muted-foreground text-right">
            Total de registros: {stats.total}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
