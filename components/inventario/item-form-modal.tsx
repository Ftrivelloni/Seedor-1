// components/inventario/item-form-modal.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog"
import { inventoryApi } from "../../lib/api"
import { useToast } from "../../hooks/use-toast"
import type { 
  InventoryItem, 
  InventoryCategory, 
  InventoryLocation, 
  CreateItemPayload,
  UpdateItemPayload 
} from "../../lib/types"
import { Plus, Trash2, ChevronDown } from "lucide-react"

interface ItemFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  item?: InventoryItem | null
  categories: InventoryCategory[]
  locations: InventoryLocation[]
  tenantId: string
}

export function ItemFormModal({ 
  isOpen, 
  onClose, 
  onSave, 
  item, 
  categories, 
  locations, 
  tenantId 
}: ItemFormModalProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false)
  const [showNewLocationForm, setShowNewLocationForm] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newLocationName, setNewLocationName] = useState("")
  // Mantener versiones locales para poder insertar el nuevo elemento inmediatamente
  const [localCategories, setLocalCategories] = useState<InventoryCategory[]>(categories || [])
  const [localLocations, setLocalLocations] = useState<InventoryLocation[]>(locations || [])

  // Formulario principal
  const [formData, setFormData] = useState({
    name: "",
    category_id: "",
    location_id: "",
    unit: "",
    min_stock: "" as string | number,
    current_stock: "" as string | number
  })

  // Resetear formulario cuando se abre/cierra o cambia el item
  useEffect(() => {
    if (isOpen) {
      if (item) {
        // Editar item existente
        setFormData({
          name: item.name,
          category_id: item.category_id,
          location_id: item.location_id,
          unit: item.unit,
          min_stock: item.min_stock,
          current_stock: item.current_stock
        })
      } else {
        // Nuevo item
        setFormData({
          name: "",
          category_id: "",
          location_id: "",
          unit: "",
          min_stock: "",
          current_stock: ""
        })
      }
      // Si hay categorías/ubicaciones disponibles, preseleccionar la primera
      if (!item) {
        if (localCategories.length > 0 && !formData.category_id) {
          setFormData(prev => ({ ...prev, category_id: localCategories[0].id }))
        }
        if (localLocations.length > 0 && !formData.location_id) {
          setFormData(prev => ({ ...prev, location_id: localLocations[0].id }))
        }
      }
      setShowNewCategoryForm(false)
      setShowNewLocationForm(false)
      setNewCategoryName("")
      setNewLocationName("")
    }
  }, [isOpen, item])

  // Mantener local lists sincronizadas con props
  useEffect(() => {
    setLocalCategories(categories || [])
  }, [categories])

  useEffect(() => {
    setLocalLocations(locations || [])
  }, [locations])

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la categoría es requerido",
        variant: "destructive"
      })
      return
    }

    try {
      const newCategory = await inventoryApi.createCategory(newCategoryName, tenantId)
      // actualizar lista local inmediatamente para que aparezca en el select
      setLocalCategories(prev => [ ...(prev || []), newCategory ])
      setFormData(prev => ({ ...prev, category_id: newCategory.id }))
      setShowNewCategoryForm(false)
      setNewCategoryName("")
      toast({
        title: "Éxito",
        description: "Categoría creada correctamente"
      })
      // Recargar categorías en el componente padre
      window.dispatchEvent(new CustomEvent('inventory:categoriesChanged'))
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al crear la categoría",
        variant: "destructive"
      })
    }
  }

  const handleCreateLocation = async () => {
    if (!newLocationName.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la ubicación es requerido",
        variant: "destructive"
      })
      return
    }

    try {
      const newLocation = await inventoryApi.createLocation(newLocationName, tenantId)
      // actualizar lista local inmediatamente
      setLocalLocations(prev => [ ...(prev || []), newLocation ])
      setFormData(prev => ({ ...prev, location_id: newLocation.id }))
      setShowNewLocationForm(false)
      setNewLocationName("")
      toast({
        title: "Éxito",
        description: "Ubicación creada correctamente"
      })
      // Recargar ubicaciones en el componente padre
      window.dispatchEvent(new CustomEvent('inventory:locationsChanged'))
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al crear la ubicación",
        variant: "destructive"
      })
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await inventoryApi.deleteCategory(categoryId, tenantId)
      // Actualizar lista local
      setLocalCategories(prev => (prev || []).filter(cat => cat.id !== categoryId))
      // Si la categoría eliminada estaba seleccionada, limpiar selección
      if (formData.category_id === categoryId) {
        setFormData(prev => ({ ...prev, category_id: '' }))
      }
      toast({
        title: "Éxito",
        description: "Categoría eliminada correctamente"
      })
      // Recargar categorías en el componente padre
      window.dispatchEvent(new CustomEvent('inventory:categoriesChanged'))
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar la categoría",
        variant: "destructive"
      })
    }
  }

  const handleDeleteLocation = async (locationId: string) => {
    try {
      await inventoryApi.deleteLocation(locationId, tenantId)
      // Actualizar lista local
      setLocalLocations(prev => (prev || []).filter(loc => loc.id !== locationId))
      // Si la ubicación eliminada estaba seleccionada, limpiar selección
      if (formData.location_id === locationId) {
        setFormData(prev => ({ ...prev, location_id: '' }))
      }
      toast({
        title: "Éxito",
        description: "Ubicación eliminada correctamente"
      })
      // Recargar ubicaciones en el componente padre
      window.dispatchEvent(new CustomEvent('inventory:locationsChanged'))
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar la ubicación",
        variant: "destructive"
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validaciones
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre del item es requerido",
        variant: "destructive"
      })
      return
    }

    if (!formData.category_id) {
      toast({
        title: "Error",
        description: "Debe seleccionar una categoría",
        variant: "destructive"
      })
      return
    }

    if (!formData.location_id) {
      toast({
        title: "Error",
        description: "Debe seleccionar una ubicación",
        variant: "destructive"
      })
      return
    }

    if (!formData.unit.trim()) {
      toast({
        title: "Error",
        description: "La unidad de medida es requerida",
        variant: "destructive"
      })
      return
    }

    const minStock = typeof formData.min_stock === 'string' ? parseFloat(formData.min_stock) : formData.min_stock
    const currentStock = typeof formData.current_stock === 'string' ? parseFloat(formData.current_stock) : formData.current_stock

    if (isNaN(minStock) || minStock < 0) {
      toast({
        title: "Error",
        description: "El stock mínimo debe ser un número válido y no negativo",
        variant: "destructive"
      })
      return
    }

    if (!item && (isNaN(currentStock) || currentStock < 0)) {
      toast({
        title: "Error",
        description: "El stock inicial debe ser un número válido y no negativo",
        variant: "destructive"
      })
      return
    }

    try {
      setIsLoading(true)

      if (item) {
        // Actualizar item existente
        const updatePayload: UpdateItemPayload = {
          name: formData.name.trim(),
          category_id: formData.category_id,
          location_id: formData.location_id,
          unit: formData.unit.trim(),
          min_stock: minStock
        }
        await inventoryApi.updateItem(item.id, updatePayload, tenantId)
        toast({
          title: "Éxito",
          description: "Item actualizado correctamente"
        })
      } else {
        // Crear nuevo item
        const createPayload: CreateItemPayload = {
          name: formData.name.trim(),
          category_id: formData.category_id,
          location_id: formData.location_id,
          unit: formData.unit.trim(),
          min_stock: minStock,
          current_stock: currentStock
        }
        await inventoryApi.createItem(createPayload, tenantId)
        toast({
          title: "Éxito",
          description: "Item creado correctamente"
        })
      }

      onSave()
      onClose()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al guardar el item",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {item ? "Editar Item" : "Nuevo Item"}
          </DialogTitle>
          <DialogDescription>
            {item ? "Modifica los datos del item" : "Agrega un nuevo item al inventario"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información básica */}
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Nombre del Item <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Ej: Fertilizante NPK, Pesticida orgánico"
                required
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label htmlFor="category" className="text-sm font-medium">Categoría <span className="text-red-500">*</span></Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewCategoryForm(!showNewCategoryForm)}
                  className="text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Nueva categoría
                </Button>
              </div>
            
              {showNewCategoryForm ? (
              <div className="flex gap-2">
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Nombre de la categoría"
                />
                <Button type="button" onClick={handleCreateCategory} size="sm">
                  Crear
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => handleInputChange("category_id", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {localCategories.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">No hay categorías. Usa 'Nueva categoría' para crear una.</div>
                    ) : (
                      localCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id} className="text-sm">
                          {category.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                
                {/* Gestión de categorías existentes */}
                {localCategories.length > 0 && (
                  <div className="border rounded-md p-2 bg-muted/20">
                    <div className="text-xs font-medium text-muted-foreground mb-1">Gestionar categorías:</div>
                    <div className="flex flex-wrap gap-1">
                      {localCategories.map((category) => (
                        <div key={category.id} className="flex items-center gap-1 bg-background border rounded px-2 py-1 text-xs">
                          <span>{category.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteCategory(category.id)}
                            title={`Eliminar ${category.name}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label htmlFor="location" className="text-sm font-medium">Ubicación <span className="text-red-500">*</span></Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewLocationForm(!showNewLocationForm)}
                  className="text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Nueva ubicación
                </Button>
              </div>
            
            {showNewLocationForm ? (
              <div className="flex gap-2">
                <Input
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  placeholder="Nombre de la ubicación"
                />
                <Button type="button" onClick={handleCreateLocation} size="sm">
                  Crear
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Select
                  value={formData.location_id}
                  onValueChange={(value) => handleInputChange("location_id", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar ubicación" />
                  </SelectTrigger>
                  <SelectContent>
                    {localLocations.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">No hay ubicaciones. Usa 'Nueva ubicación' para crear una.</div>
                    ) : (
                      localLocations.map((location) => (
                        <SelectItem key={location.id} value={location.id} className="text-sm">
                          {location.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                
                {/* Gestión de ubicaciones existentes */}
                {localLocations.length > 0 && (
                  <div className="border rounded-md p-2 bg-muted/20">
                    <div className="text-xs font-medium text-muted-foreground mb-1">Gestionar ubicaciones:</div>
                    <div className="flex flex-wrap gap-1">
                      {localLocations.map((location) => (
                        <div key={location.id} className="flex items-center gap-1 bg-background border rounded px-2 py-1 text-xs">
                          <span>{location.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteLocation(location.id)}
                            title={`Eliminar ${location.name}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

            {/* Información de medidas y stock */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="unit" className="text-sm font-medium">Unidad de medida <span className="text-red-500">*</span></Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => handleInputChange("unit", e.target.value)}
                  placeholder="kg, lt, unidades, sacos"
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="min_stock" className="text-sm font-medium">Stock mínimo <span className="text-red-500">*</span></Label>
                <Input
                  id="min_stock"
                  type="text"
                  inputMode="numeric"
                  value={formData.min_stock === 0 ? "" : String(formData.min_stock)}
                  onChange={(e) => handleInputChange("min_stock", e.target.value === "" ? "" : parseInt(e.target.value) || 0)}
                  placeholder="Cantidad mínima"
                  required
                  className="w-full"
                />
              </div>

              {!item && (
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="current_stock" className="text-sm font-medium">Stock inicial <span className="text-red-500">*</span></Label>
                  <Input
                    id="current_stock"
                    type="text"
                    inputMode="numeric"
                    value={formData.current_stock === 0 ? "" : String(formData.current_stock)}
                    onChange={(e) => handleInputChange("current_stock", e.target.value === "" ? "" : parseInt(e.target.value) || 0)}
                    placeholder="Cantidad inicial en inventario"
                    required
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : (item ? "Actualizar" : "Crear")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}