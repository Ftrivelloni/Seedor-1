"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "../ui/button"
import { Card } from "../ui/card"
import { Badge } from "../ui/badge"
import { Plus, ArrowLeft, Grid3x3, List, Pencil, Trash2 } from "lucide-react"
import { farmsApi, lotsApi } from "../../lib/api"
import type { Farm, Lot } from "../../lib/types"
import type { AuthUser } from "../../lib/supabaseAuth"
import { LotFormModal, type LotFormData } from "./lot-form-modal"
import { toast } from "../../hooks/use-toast"

interface FarmDetailPageProps {
  farmId: string
  user?: AuthUser
}

export function FarmDetailPage({ farmId, user }: FarmDetailPageProps) {
  const router = useRouter()
  const [farm, setFarm] = useState<Farm | null>(null)
  const [lots, setLots] = useState<Lot[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedLot, setSelectedLot] = useState<Lot | undefined>(undefined)

  useEffect(() => {
    loadData()
  }, [farmId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [farmData, lotsData] = await Promise.all([
        farmsApi.getFarmById(farmId),
        lotsApi.getLotsByFarm(farmId)
      ])
      setFarm(farmData)
      setLots(lotsData)
    } catch (error) {
      console.error("Error loading farm data:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar la información del campo",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateLot = async (data: LotFormData) => {
    try {
      await lotsApi.createLot(user?.tenantId || "", {
        ...data,
        farm_id: farmId
      })
      toast({
        title: "Éxito",
        description: "Lote creado correctamente"
      })
      loadData()
    } catch (error: any) {
      console.error("Error creating lot:", error)
      const errorMessage = error?.message || error?.error_description || "No se pudo crear el lote";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }

  const handleEditLot = async (data: LotFormData) => {
    if (!selectedLot) return

    try {
      await lotsApi.updateLot(selectedLot.id, data)
      toast({
        title: "Éxito",
        description: "Lote actualizado correctamente"
      })
      loadData()
    } catch (error) {
      console.error("Error updating lot:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el lote",
        variant: "destructive"
      })
    }
  }

  const handleDeleteLot = async (lotId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este lote?")) return

    try {
      await lotsApi.deleteLot(lotId)
      toast({
        title: "Éxito",
        description: "Lote eliminado correctamente"
      })
      loadData()
    } catch (error) {
      console.error("Error deleting lot:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el lote",
        variant: "destructive"
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "activo":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "inactivo":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
      case "preparacion":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col">
        <header className="border-b bg-card">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push("/campo")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold">Cargando...</h1>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto flex items-center justify-center h-64">
            <p className="text-muted-foreground">Cargando información del campo...</p>
          </div>
        </main>
      </div>
    )
  }

  if (!farm) {
    return (
      <div className="flex-1 flex flex-col">
        <header className="border-b bg-card">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push("/campo")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold">Campo no encontrado</h1>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto flex items-center justify-center h-64">
            <p className="text-muted-foreground">El campo solicitado no existe</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/campo")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">{farm.name}</h1>
              <p className="text-sm text-muted-foreground">
                {farm.location && `${farm.location} • `}
                {farm.area_ha && `${farm.area_ha} ha`}
                {farm.default_crop && ` • ${farm.default_crop}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex border rounded-lg">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-r-none"
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={() => {
              setSelectedLot(undefined)
              setIsModalOpen(true)
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Cargar lote
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-auto bg-muted/30">
        <div className="max-w-7xl mx-auto">
          {lots.length === 0 ? (
            <Card className="p-12 text-center">
              <h3 className="text-lg font-semibold mb-2">No hay lotes cargados</h3>
              <p className="text-muted-foreground mb-6">
                Comienza creando tu primer lote en este campo
              </p>
              <Button onClick={() => {
                setSelectedLot(undefined)
                setIsModalOpen(true)
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Cargar lote
              </Button>
            </Card>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {lots.map((lot) => (
                <Card
                  key={lot.id}
                  className="p-6 hover:shadow-lg transition-shadow cursor-pointer group relative"
                >
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedLot(lot)
                        setIsModalOpen(true)
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteLot(lot.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg">{lot.code}</h3>
                      <p className="text-sm text-muted-foreground capitalize">{lot.crop}</p>
                    </div>
                    {lot.variety && (
                      <p className="text-sm text-muted-foreground">
                        Variedad: {lot.variety}
                      </p>
                    )}
                    {lot.area_ha && (
                      <p className="text-sm text-muted-foreground">
                        Área: {lot.area_ha} ha
                      </p>
                    )}
                    {lot.plant_date && (
                      <p className="text-sm text-muted-foreground">
                        Plantado: {new Date(lot.plant_date).toLocaleDateString()}
                      </p>
                    )}
                    <Badge className={getStatusColor(lot.status)}>
                      {lot.status}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {lots.map((lot) => (
                <Card key={lot.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 grid grid-cols-5 gap-4">
                      <div>
                        <p className="text-sm font-medium">{lot.code}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground capitalize">{lot.crop}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{lot.variety || "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {lot.area_ha ? `${lot.area_ha} ha` : "-"}
                        </p>
                      </div>
                      <div>
                        <Badge className={getStatusColor(lot.status)}>
                          {lot.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1 ml-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setSelectedLot(lot)
                          setIsModalOpen(true)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteLot(lot.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <LotFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedLot(undefined)
        }}
        onSubmit={selectedLot ? handleEditLot : handleCreateLot}
        farmId={farmId}
        lot={selectedLot}
      />
    </div>
  )
}
