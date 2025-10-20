// components/inventario/movement-form-modal.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Textarea } from "../ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog"
import { inventoryApi } from "../../lib/api"
import { useToast } from "../../hooks/use-toast"
import type { 
  InventoryItem,
  InventoryMovementType,
  CreateMovementPayload,
  MovementTypeCode 
} from "../../lib/types"
import { getSessionManager } from "../../lib/sessionManager"

interface MovementFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  items: InventoryItem[]
  tenantId: string
}

export function MovementFormModal({ 
  isOpen, 
  onClose, 
  onSave, 
  items, 
  tenantId 
}: MovementFormModalProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [movementTypes, setMovementTypes] = useState<InventoryMovementType[]>([])
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)

  // Formulario
  const [formData, setFormData] = useState({
    item_id: "",
    type: "" as MovementTypeCode | "",
    quantity: "" as string | number,
    unit_cost: "" as string | number,
    reason: "",
    date: new Date().toISOString().split('T')[0]
  })

  // Cargar tipos de movimiento
  useEffect(() => {
    if (isOpen) {
      loadMovementTypes()
    }
  }, [isOpen])

  // Resetear formulario
  useEffect(() => {
    if (isOpen) {
      setFormData({
        item_id: "",
        type: "",
        quantity: "",
        unit_cost: "",
        reason: "",
        date: new Date().toISOString().split('T')[0]
      })
      setSelectedItem(null)
    }
  }, [isOpen])

  const loadMovementTypes = async () => {
    try {
      const types = await inventoryApi.listMovementTypes()
      if (!types || types.length === 0) {
        // fallback básico si la tabla está vacía
        setMovementTypes([
          { code: 'IN', name: 'Entrada' },
          { code: 'OUT', name: 'Salida' }
        ])
      } else {
        setMovementTypes(types)
      }
    } catch (error) {
      console.error('Error al cargar tipos de movimiento:', error)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleItemChange = (itemId: string) => {
    const item = items.find(i => i.id === itemId)
    setSelectedItem(item || null)
    handleInputChange("item_id", itemId)
  }

  const getMovementTypeDescription = (type: MovementTypeCode) => {
    switch (type) {
      case 'IN':
        return 'Suma la cantidad al stock actual'
      case 'OUT':
        return 'Resta la cantidad del stock actual'
      default:
        return ''
    }
  }

  const validateMovement = () => {
    console.log("Validando movimiento...", formData)
    
    if (!formData.item_id) {
      console.log("Falta item_id")
      toast({
        title: "Error",
        description: "Debe seleccionar un item",
        variant: "destructive"
      })
      return false
    }

    if (!formData.type) {
      console.log("Falta tipo de movimiento")
      toast({
        title: "Error",
        description: "Debe seleccionar un tipo de movimiento",
        variant: "destructive"
      })
      return false
    }

    // Validar cantidad
    console.log("Validando cantidad:", formData.quantity)
    let quantity: number
    if (typeof formData.quantity === 'string') {
      if (formData.quantity.trim() === '') {
        console.log("Cantidad está vacía")
        toast({
          title: "Error",
          description: "La cantidad es requerida",
          variant: "destructive"
        })
        return false
      }
      quantity = parseFloat(formData.quantity.trim())
    } else {
      quantity = formData.quantity
    }
    
    if (isNaN(quantity) || quantity <= 0) {
      console.log("Cantidad no válida:", quantity)
      toast({
        title: "Error",
        description: "La cantidad debe ser un número válido mayor a cero",
        variant: "destructive"
      })
      return false
    }

    if (!formData.reason.trim()) {
      console.log("Falta razón del movimiento")
      toast({
        title: "Error",
        description: "Debe proporcionar una razón para el movimiento",
        variant: "destructive"
      })
      return false
    }

    // Validar fecha
    if (!formData.date) {
      console.log("Falta fecha")
      toast({
        title: "Error",
        description: "La fecha es requerida",
        variant: "destructive"
      })
      return false
    }

    // Validación específica para salidas
    if (formData.type === 'OUT') {
      if (selectedItem && quantity > selectedItem.current_stock) {
        console.log("Stock insuficiente")
        toast({
          title: "Error",
          description: `Stock insuficiente. Disponible: ${selectedItem.current_stock} ${selectedItem.unit}`,
          variant: "destructive"
        })
        return false
      }
    }

    console.log("Validación completada exitosamente")
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Enviando formulario de movimiento...", formData)

    if (!validateMovement()) {
      console.log("Validación falló")
      return
    }

    try {
      setIsLoading(true)
      console.log("Validación pasó, procesando...")

      const sessionManager = getSessionManager()
      const currentUser = sessionManager.getCurrentUser()
      
      const quantity = typeof formData.quantity === 'string' ? parseFloat(formData.quantity) : formData.quantity
      
      // Procesar unit_cost - solo enviar si tiene un valor válido
      let unitCost: number | null = null
      if (formData.unit_cost !== '' && formData.unit_cost !== 0) {
        const parsedCost = typeof formData.unit_cost === 'string' ? parseFloat(formData.unit_cost) : formData.unit_cost
        if (!isNaN(parsedCost) && parsedCost > 0) {
          unitCost = parsedCost
        }
      }

      // Validar que el tipo de movimiento sea válido antes de crear el payload
      if (!formData.type || (formData.type !== 'IN' && formData.type !== 'OUT')) {
        toast({
          title: "Error",
          description: "Tipo de movimiento no válido",
          variant: "destructive"
        })
        return
      }

      const payload: CreateMovementPayload = {
        item_id: formData.item_id,
        type: formData.type,
        quantity: quantity,
        unit_cost: unitCost ?? undefined,
        reason: formData.reason.trim(),
        date: formData.date,
        created_by: currentUser?.id
      }

      console.log("Payload creado:", payload)
      console.log("TenantId:", tenantId)
      console.log("Llamando a inventoryApi.createMovement...")
      
      const result = await inventoryApi.createMovement(payload, tenantId)
      console.log("Movimiento creado exitosamente:", result)
      
      toast({
        title: "Éxito",
        description: "Movimiento registrado correctamente"
      })

      onSave()
      onClose()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al registrar el movimiento",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getQuantityLabel = () => {
    if (!formData.type) return "Cantidad"
    
    switch (formData.type) {
      case 'IN':
        return "Cantidad a ingresar"
      case 'OUT':
        return "Cantidad a retirar"
      default:
        return "Cantidad"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo Movimiento</DialogTitle>
          <DialogDescription>
            Registra un movimiento de inventario
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4">
            {/* Selección de item */}
            <div className="space-y-2">
              <Label htmlFor="item" className="text-sm font-medium">Item <span className="text-red-500">*</span></Label>
              <Select
                value={formData.item_id}
                onValueChange={handleItemChange}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar item del inventario" />
                </SelectTrigger>
                <SelectContent>
                  {items.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">No hay items. Crea un item primero.</div>
                  ) : (
                    items.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        <div className="flex flex-col">
                          <span>{item.name}</span>
                          <span className="text-xs text-muted-foreground">
                            Stock: {item.current_stock} {item.unit}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {selectedItem && (
                <div className="bg-muted/50 px-3 py-2 rounded text-sm">
                  <div className="flex justify-between">
                    <span>Stock actual:</span>
                    <span className="font-medium">{selectedItem.current_stock} {selectedItem.unit}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Tipo de movimiento y fecha */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-medium">Tipo de movimiento <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: MovementTypeCode) => handleInputChange("type", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {movementTypes.map((type) => (
                      <SelectItem key={type.code} value={type.code}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.type && (
                  <p className="text-xs text-muted-foreground">
                    {getMovementTypeDescription(formData.type)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-medium">Fecha <span className="text-red-500">*</span></Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                  required
                  className="w-full"
                />
              </div>
            </div>

            {/* Cantidad y costo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-sm font-medium">{getQuantityLabel()} <span className="text-red-500">*</span></Label>
                <Input
                  id="quantity"
                  type="text"
                  inputMode="numeric"
                  value={formData.quantity === 0 ? "" : String(formData.quantity)}
                  onChange={(e) => handleInputChange("quantity", e.target.value === "" ? "" : parseFloat(e.target.value) || 0)}
                  placeholder="Ingrese cantidad"
                  required
                  className="w-full"
                />
                {selectedItem && (
                  <p className="text-xs text-muted-foreground">
                    Unidad: {selectedItem.unit}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit_cost" className="text-sm font-medium">Costo unitario</Label>
                <Input
                  id="unit_cost"
                  type="text"
                  inputMode="decimal"
                  value={formData.unit_cost === 0 ? "" : String(formData.unit_cost)}
                  onChange={(e) => handleInputChange("unit_cost", e.target.value === "" ? "" : parseFloat(e.target.value) || 0)}
                  placeholder="Precio por unidad (opcional)"
                  className="w-full"
                />
              </div>
            </div>

            {/* Razón del movimiento */}
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-sm font-medium">Motivo del movimiento <span className="text-red-500">*</span></Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => handleInputChange("reason", e.target.value)}
                placeholder="Describe la razón del movimiento (ej: Compra de insumos, Uso en producción, Ajuste de inventario)"
                required
                rows={3}
                className="w-full resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Registrando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}