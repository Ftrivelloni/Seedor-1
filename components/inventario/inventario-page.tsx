// components/inventario/inventario-page.tsx
"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Sidebar } from "../sidebar"
import { useAuth } from "../../hooks/use-auth"
import { FeatureProvider } from "../../lib/features-context"
import { Search, Package, AlertTriangle, Plus, Edit, Trash2, Eye } from "lucide-react"
import { ItemFormModal } from "./item-form-modal"
import { MovementFormModal } from "./movement-form-modal"
import { MovementHistoryModal } from "./movement-history-modal"
import {
  inventoryApiService,
  type InventoryItem,
  type InventoryCategory,
  type InventoryLocation,
  type InventorySummary,
  type InventoryMovement,
} from "../../lib/inventario/inventario-service"
import { useToast } from "../../hooks/use-toast"

export function InventarioPage() {
  const { user, loading, handleLogout } = useAuth({
    redirectToLogin: true,
    requireRoles: ["admin", "campo", "empaque"]
  })
  const router = useRouter()
  const { toast } = useToast()

  // Estado principal
  const [items, setItems] = useState<InventoryItem[]>([])
  const [categories, setCategories] = useState<InventoryCategory[]>([])
  const [locations, setLocations] = useState<InventoryLocation[]>([])
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [summary, setSummary] = useState<InventorySummary>({ totalItems: 0, lowStockItems: 0 })
  
  // Estados de carga
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [isLoadingLocations, setIsLoadingLocations] = useState(true)
  const [isLoadingMovements, setIsLoadingMovements] = useState(true)

  // Filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedLocation, setSelectedLocation] = useState("all")
  const [showLowStockOnly, setShowLowStockOnly] = useState(false)

  // Estados de modales
  const [showItemModal, setShowItemModal] = useState(false)
  const [showMovementModal, setShowMovementModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)

  // Cargar datos iniciales
  useEffect(() => {
    if (user?.tenantId) {
      loadData()
    }
  }, [user?.tenantId])

  // Escuchar eventos disparados por los modales para recargar listas al crear categorías/ubicaciones
  useEffect(() => {
    const tenantId = user?.tenantId
    const onCategoriesChanged = () => { if (tenantId) loadCategories() }
    const onLocationsChanged = () => { if (tenantId) loadLocations() }

    window.addEventListener('inventory:categoriesChanged', onCategoriesChanged)
    window.addEventListener('inventory:locationsChanged', onLocationsChanged)

    return () => {
      window.removeEventListener('inventory:categoriesChanged', onCategoriesChanged)
      window.removeEventListener('inventory:locationsChanged', onLocationsChanged)
    }
  }, [user?.tenantId])

  const loadData = async () => {
    if (!user?.tenantId) return

    try {
      await Promise.all([
        loadItems(),
        loadCategories(),
        loadLocations(),
        loadSummary(),
        loadMovements()
      ])
    } catch (error) {
      console.error('Error al cargar datos:', error)
    }
  }

  const loadItems = async () => {
    if (!user?.tenantId) return

    try {
      setIsLoading(true)
      const data = await inventoryApiService.items.listItems({
        tenantId: user.tenantId,
        search: searchTerm || undefined,
        categoryId: selectedCategory !== "all" ? selectedCategory : undefined,
        locationId: selectedLocation !== "all" ? selectedLocation : undefined
      })
      setItems(data)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al cargar los items del inventario",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadCategories = async () => {
    if (!user?.tenantId) return

    try {
      setIsLoadingCategories(true)
      const data = await inventoryApiService.categories.listCategories(user.tenantId)
      setCategories(data)
    } catch (error: any) {
      console.error('Error al cargar categorías:', error)
    } finally {
      setIsLoadingCategories(false)
    }
  }

  const loadLocations = async () => {
    if (!user?.tenantId) return

    try {
      setIsLoadingLocations(true)
      const data = await inventoryApiService.locations.listLocations(user.tenantId)
      setLocations(data)
    } catch (error: any) {
      console.error('Error al cargar ubicaciones:', error)
    } finally {
      setIsLoadingLocations(false)
    }
  }

  const loadSummary = async () => {
    if (!user?.tenantId) return

    try {
      const data = await inventoryApiService.summary.getSummary(user.tenantId)
      setSummary(data)
    } catch (error: any) {
      console.error('Error al cargar resumen:', error)
    }
  }

  const loadMovements = async () => {
    if (!user?.tenantId) return

    try {
      setIsLoadingMovements(true)
      const data = await inventoryApiService.movements.listMovements({
        tenantId: user.tenantId,
        limit: 10 // Últimos 10 movimientos
      })
      setMovements(data)
    } catch (error: any) {
      console.error('Error al cargar movimientos:', error)
      toast({
        title: "Error",
        description: error.message || "Error al cargar los movimientos",
        variant: "destructive"
      })
    } finally {
      setIsLoadingMovements(false)
    }
  }

  // Filtrar items
  const filteredItems = items.filter(item => {
    if (showLowStockOnly && item.current_stock > item.min_stock) {
      return false
    }
    return true
  })

  // Actualizar filtros
  useEffect(() => {
    if (user?.tenantId) {
      loadItems()
    }
  }, [searchTerm, selectedCategory, selectedLocation, user?.tenantId])

  // Handlers
  const handleEditItem = (item: InventoryItem) => {
    setSelectedItem(item)
    setShowItemModal(true)
  }

  const handleDeleteItem = async (item: InventoryItem) => {
    if (!user?.tenantId) return

    if (!confirm(`¿Estás seguro de que deseas eliminar "${item.name}"?`)) {
      return
    }

    try {
      await inventoryApiService.items.deleteItem(item.id)
      toast({
        title: "Éxito",
        description: "Item eliminado correctamente"
      })
      await loadData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar el item",
        variant: "destructive"
      })
    }
  }

  const handleViewHistory = (item: InventoryItem) => {
    setSelectedItem(item)
    setShowHistoryModal(true)
  }

  const handleItemSaved = () => {
    setShowItemModal(false)
    setSelectedItem(null)
    loadData()
  }

  const handleMovementSaved = () => {
    setShowMovementModal(false)
    loadData() // Esto recargará items, summary y movimientos
  }

  const handleDeleteMovement = async (movementId: string) => {
    if (!user?.tenantId) return

    if (!confirm('¿Estás seguro de que deseas eliminar este movimiento? El stock se ajustará automáticamente.')) {
      return
    }

    try {
      await inventoryApiService.movements.deleteMovement(movementId)
      toast({
        title: "Éxito",
        description: "Movimiento eliminado y stock actualizado correctamente"
      })
      await loadData() // Recargar items, summary y movimientos
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar el movimiento",
        variant: "destructive"
      })
    }
  }

  const getStockStatus = (item: InventoryItem) => {
    if (item.current_stock <= item.min_stock) {
      return { label: "Bajo stock", variant: "destructive" as const }
    }
    return { label: "OK", variant: "default" as const }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Sin movimientos"
    return new Date(dateString).toLocaleDateString('es-ES')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <FeatureProvider user={user}>
      <div className="min-h-screen bg-background flex">
        <Sidebar 
          user={user} 
          onLogout={handleLogout}
          onNavigate={(page) => {
            const pageRoutes: Record<string, string> = {
              dashboard: "/home",
              campo: "/campo",
              empaque: "/empaque",
              inventario: "/inventario",
              finanzas: "/finanzas",
              ajustes: "/ajustes",
              trabajadores: "/trabajadores",
              contactos: "/contactos",
              usuarios: "/usuarios"
            }
            const targetRoute = pageRoutes[page] || "/home"
            router.push(targetRoute)
          }} 
          currentPage="inventario" 
        />
        
        <div className="flex-1 flex flex-col">
          <header className="border-b bg-card">
            <div className="flex h-16 items-center justify-between px-6">
              <div>
                <h1 className="text-xl font-semibold">Gestión de Inventario</h1>
                <p className="text-sm text-muted-foreground">Control de insumos y stock - {user?.tenant?.name || 'Tu Empresa'}</p>
              </div>
              <div className="flex items-center space-x-4">
                <Button onClick={() => setShowItemModal(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nuevo ítem
                </Button>
                <Button 
                  onClick={() => setShowMovementModal(true)} 
                  variant="outline" 
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Nuevo movimiento
                </Button>
                <div className="text-right">
                  <p className="text-sm font-medium">{user?.nombre || user?.email}</p>
                  <p className="text-xs text-muted-foreground">{user?.rol || 'Usuario'}</p>
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 p-6 space-y-6">

            {/* Resumen Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total ítems</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.totalItems}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Bajo stock</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{summary.lowStockItems}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Último movimiento</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-medium">{formatDate(summary.lastMovementDate)}</div>
                </CardContent>
              </Card>
            </div>

            {/* Filtros */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filtros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar insumo..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas las categorías" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las categorías</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas las ubicaciones" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las ubicaciones</SelectItem>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="lowStock"
                      checked={showLowStockOnly}
                      onChange={(e) => setShowLowStockOnly(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="lowStock" className="text-sm">
                      Solo bajo stock
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabla de Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Inventario</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay items que mostrar
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Insumo</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Ubicación</TableHead>
                        <TableHead>Stock actual</TableHead>
                        <TableHead>Mínimo</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredItems.map((item) => {
                        const status = getStockStatus(item)
                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>{item.category_name}</TableCell>
                            <TableCell>{item.location_name}</TableCell>
                            <TableCell>
                              <span className="font-mono">{item.current_stock} {item.unit}</span>
                            </TableCell>
                            <TableCell>
                              <span className="font-mono">{item.min_stock} {item.unit}</span>
                            </TableCell>
                            <TableCell>
                              <Badge variant={status.variant}>
                                {status.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewHistory(item)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditItem(item)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteItem(item)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Tabla de Movimientos Recientes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Movimientos Recientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingMovements ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Cargando movimientos...</p>
                  </div>
                ) : movements.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No hay movimientos registrados</p>
                    <p className="text-sm text-muted-foreground mt-1">Los movimientos aparecerán aquí cuando registres entradas o salidas</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Motivo</TableHead>
                        <TableHead className="w-[100px]">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movements.map((movement) => {
                        const isEntry = movement.type === 'IN'
                        return (
                          <TableRow key={movement.id}>
                            <TableCell className="font-medium">
                              {new Date(movement.date).toLocaleDateString('es-AR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })}
                            </TableCell>
                            <TableCell>{movement.item_name || 'N/A'}</TableCell>
                            <TableCell>
                              <Badge variant={isEntry ? 'default' : 'secondary'}>
                                {isEntry ? '↑ Entrada' : '↓ Salida'}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono">
                              <span className={isEntry ? 'text-green-600' : 'text-red-600'}>
                                {isEntry ? '+' : '-'}{movement.quantity}
                              </span>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {movement.reason}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteMovement(movement.id)}
                                className="h-8 w-8 p-0"
                                title="Eliminar movimiento"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </main>
        </div>

        {/* Modales */}
        <ItemFormModal
          isOpen={showItemModal}
          onClose={() => {
            setShowItemModal(false)
            setSelectedItem(null)
          }}
          onSave={handleItemSaved}
          item={selectedItem}
          categories={categories}
          locations={locations}
          tenantId={user.tenantId || ''}
        />

        <MovementFormModal
          isOpen={showMovementModal}
          onClose={() => setShowMovementModal(false)}
          onSave={handleMovementSaved}
          items={items}
          tenantId={user.tenantId || ''}
        />

        <MovementHistoryModal
          isOpen={showHistoryModal}
          onClose={() => {
            setShowHistoryModal(false)
            setSelectedItem(null)
          }}
          item={selectedItem}
          tenantId={user.tenantId || ''}
          onDelete={loadData}
        />
      </div>
    </FeatureProvider>
  )
}
