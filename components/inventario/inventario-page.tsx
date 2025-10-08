"use client"

import { useState, useEffect } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Badge } from "../ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { inventarioApi } from "../../lib/api"
import { useAuth } from "../../hooks/use-auth"
import type { ItemInventario } from "../../lib/types"
import { Search, Package, AlertTriangle, Plus, Minus, Warehouse, Truck, Box } from "lucide-react"

const categoriaIcons = {
  insumos: Package,
  pallets: Box,
  cajas: Package,
  maquinaria: Truck,
  herramientas: Warehouse,
}

const categoriaLabels = {
  insumos: "Insumos",
  pallets: "Pallets",
  cajas: "Cajas",
  maquinaria: "Maquinaria",
  herramientas: "Herramientas",
}

export function InventarioPage() {
  const { user, loading: authLoading } = useAuth({ requireRoles: ['admin', 'campo', 'empaque'] })
  const [items, setItems] = useState<ItemInventario[]>([])
  const [filteredItems, setFilteredItems] = useState<ItemInventario[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategoria, setFilterCategoria] = useState("all")
  const [filterStock, setFilterStock] = useState("all")

  useEffect(() => {
    loadItems()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [items, searchTerm, filterCategoria, filterStock])

  const loadItems = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      const data = await inventarioApi.getItems(user.tenantId)
      setItems(data)
    } catch (error) {
      console.error("Error al cargar inventario:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = items

    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.ubicacion?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (filterCategoria !== "all") {
      filtered = filtered.filter((item) => item.categoria === filterCategoria)
    }

    if (filterStock === "low") {
      filtered = filtered.filter((item) => item.stock <= item.stockMinimo)
    } else if (filterStock === "normal") {
      filtered = filtered.filter((item) => item.stock > item.stockMinimo)
    }

    setFilteredItems(filtered)
  }

  const handleStockAdjustment = async (itemId: string, adjustment: number) => {
    const item = items.find((i) => i.id === itemId)
    if (!item) return

    const newStock = Math.max(0, item.stock + adjustment)

    try {
      await inventarioApi.updateStock(itemId, newStock)
      await loadItems()
    } catch (error) {
      console.error("Error al actualizar stock:", error)
    }
  }

  const totalItems = items.length
  const lowStockItems = items.filter((item) => item.stock <= item.stockMinimo)
  const categoryCounts = items.reduce(
    (acc, item) => {
      acc[item.categoria] = (acc[item.categoria] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const getStockStatus = (item: ItemInventario) => {
    if (item.stock === 0) return { label: "Sin Stock", variant: "destructive" as const, color: "text-destructive" }
    if (item.stock <= item.stockMinimo)
      return { label: "Bajo Stock", variant: "destructive" as const, color: "text-destructive" }
    return { label: "Stock Normal", variant: "outline" as const, color: "text-green-600" }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No tienes permisos para acceder a esta sección</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div>
            <h1 className="text-xl font-semibold">Gestión de Inventario</h1>
            <p className="text-sm text-muted-foreground">Control de stock e inventario - {user?.tenant?.name || 'Tu Empresa'}</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium">{user?.nombre || user?.email}</p>
              <p className="text-xs text-muted-foreground">{user?.rol || 'Usuario'}</p>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">Items registrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Bajo Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{lowStockItems.length}</div>
            <p className="text-xs text-muted-foreground">Requieren atención</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Categorías</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(categoryCounts).length}</div>
            <p className="text-xs text-muted-foreground">Tipos diferentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Stock Crítico</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{items.filter((item) => item.stock === 0).length}</div>
            <p className="text-xs text-muted-foreground">Sin stock</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Filtros</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCategoria} onValueChange={setFilterCategoria}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {Object.entries(categoriaLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStock} onValueChange={setFilterStock}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo el stock</SelectItem>
                <SelectItem value="low">Bajo stock</SelectItem>
                <SelectItem value="normal">Stock normal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {lowStockItems.length > 0 && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <span>Alerta de Stock Bajo</span>
            </CardTitle>
            <CardDescription>Los siguientes items requieren reposición urgente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {lowStockItems.slice(0, 6).map((item) => {
                const Icon = categoriaIcons[item.categoria]
                return (
                  <div key={item.id} className="flex items-center space-x-3 p-3 border rounded-lg bg-background">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.nombre}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.stock} / {item.stockMinimo} {item.unidad}
                      </p>
                    </div>
                    <Badge variant="destructive">Bajo</Badge>
                  </div>
                )
              })}
            </div>
            {lowStockItems.length > 6 && (
              <p className="text-sm text-muted-foreground mt-3">
                Y {lowStockItems.length - 6} items más con stock bajo
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Warehouse className="h-5 w-5" />
            <span>Inventario</span>
          </CardTitle>
          <CardDescription>
            {filteredItems.length} de {items.length} items
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead className="text-center">Stock Actual</TableHead>
                  <TableHead className="text-center">Stock Mínimo</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => {
                  const Icon = categoriaIcons[item.categoria]
                  const stockStatus = getStockStatus(item)

                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{item.nombre}</p>
                            <p className="text-sm text-muted-foreground">{categoriaLabels[item.categoria]}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{categoriaLabels[item.categoria]}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{item.ubicacion || "No especificada"}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <span className={`text-lg font-bold ${stockStatus.color}`}>{item.stock}</span>
                          <span className="text-xs text-muted-foreground">{item.unidad}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-sm">{item.stockMinimo}</span>
                          <span className="text-xs text-muted-foreground">{item.unidad}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStockAdjustment(item.id, -1)}
                            disabled={item.stock === 0}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleStockAdjustment(item.id, 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}

          {!isLoading && filteredItems.length === 0 && (
            <div className="text-center py-8">
              <Warehouse className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No se encontraron items de inventario</p>
              <p className="text-sm text-muted-foreground">Ajusta los filtros para ver más resultados</p>
            </div>
          )}
        </CardContent>
      </Card>
        </div>
      </main>
    </div>
  )
}
