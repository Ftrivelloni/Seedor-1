// components/inventario/movement-history-modal.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog"
import { ScrollArea } from "../ui/scroll-area"
import { inventoryApi } from "../../lib/api"
import { useToast } from "../../hooks/use-toast"
import type { InventoryItem, InventoryMovement } from "../../lib/types"
import { ArrowUp, ArrowDown, Repeat, ArrowRight } from "lucide-react"

interface MovementHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  item: InventoryItem | null
  tenantId: string
  onDelete?: () => void
}

export function MovementHistoryModal({ 
  isOpen, 
  onClose, 
  item, 
  tenantId,
  onDelete 
}: MovementHistoryModalProps) {
  const { toast } = useToast()
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen && item) {
      loadMovements()
    }
  }, [isOpen, item])

  const loadMovements = async () => {
    if (!item) return

    try {
      setIsLoading(true)
      const data = await inventoryApi.listMovements({
        tenantId,
        itemId: item.id,
        limit: 100
      })
      setMovements(data)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al cargar el historial",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteMovement = async (movementId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este movimiento? El stock se ajustará automáticamente.')) {
      return
    }

    try {
      await inventoryApi.deleteMovement(movementId, tenantId)
      toast({
        title: "Éxito",
        description: "Movimiento eliminado y stock actualizado correctamente"
      })
      await loadMovements() // Recargar el historial
      if (onDelete) {
        onDelete() // Notificar al componente padre para recargar datos
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar el movimiento",
        variant: "destructive"
      })
    }
  }

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'IN':
        return <ArrowUp className="h-4 w-4 text-green-600" />
      case 'OUT':
        return <ArrowDown className="h-4 w-4 text-red-600" />
      case 'ADJ':
        return <Repeat className="h-4 w-4 text-blue-600" />
      case 'TRF':
        return <ArrowRight className="h-4 w-4 text-purple-600" />
      default:
        return <Repeat className="h-4 w-4 text-gray-600" />
    }
  }

  const getMovementTypeLabel = (type: string) => {
    switch (type) {
      case 'IN':
        return 'Entrada'
      case 'OUT':
        return 'Salida'
      case 'ADJ':
        return 'Ajuste'
      case 'TRF':
        return 'Transferencia'
      default:
        return type
    }
  }

  const getMovementVariant = (type: string) => {
    switch (type) {
      case 'IN':
        return 'default' as const
      case 'OUT':
        return 'destructive' as const
      case 'ADJ':
        return 'secondary' as const
      case 'TRF':
        return 'outline' as const
      default:
        return 'outline' as const
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount?: number | null) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] lg:max-w-6xl max-h-[85vh] w-full">
        <DialogHeader>
          <DialogTitle>Historial de Movimientos</DialogTitle>
          <DialogDescription>
            {item ? `Movimientos para: ${item.name}` : "Historial de movimientos"}
          </DialogDescription>
        </DialogHeader>

        {item && (
          <div className="mb-4 p-4 bg-muted rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="font-medium text-muted-foreground">Stock Actual</p>
                <p className="text-lg font-bold">{item.current_stock} {item.unit}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Stock Mínimo</p>
                <p className="text-lg">{item.min_stock} {item.unit}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Categoría</p>
                <p>{item.category_name}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Ubicación</p>
                <p>{item.location_name}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-[450px] w-full">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : movements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay movimientos registrados para este item
              </div>
            ) : (
              <div className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Fecha</TableHead>
                      <TableHead className="w-[140px]">Tipo</TableHead>
                      <TableHead className="w-[120px]">Cantidad</TableHead>
                      <TableHead className="w-[120px]">Costo Unit.</TableHead>
                      <TableHead className="min-w-[200px]">Razón</TableHead>
                      <TableHead className="w-[140px]">Registrado</TableHead>
                      <TableHead className="w-[80px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell className="font-medium">
                          {formatDate(movement.date)}
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getMovementIcon(movement.type)}
                            <Badge variant={getMovementVariant(movement.type)}>
                              {getMovementTypeLabel(movement.type)}
                            </Badge>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-1">
                            {movement.type === 'OUT' ? '-' : '+'}
                            <span className="font-mono font-medium">
                              {Math.abs(movement.quantity)} {item?.unit}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          {movement.unit_cost ? (
                            <div>
                              <p className="font-medium">{formatCurrency(movement.unit_cost)}</p>
                              <p className="text-xs text-muted-foreground">
                                Total: {formatCurrency(movement.unit_cost * movement.quantity)}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>

                        <TableCell>
                          <div className="max-w-md">
                            <p className="truncate" title={movement.reason}>
                              {movement.reason}
                            </p>
                            {movement.ref_module && (
                              <p className="text-xs text-muted-foreground">
                                Ref: {movement.ref_module}
                              </p>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(movement.created_at)}
                          </p>
                        </TableCell>

                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteMovement(movement.id)}
                            className="h-8 w-8 p-0"
                            title="Eliminar movimiento"
                          >
                            <span className="text-destructive">🗑️</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}