"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "../ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { farmsApi } from "../../lib/api"
import type { Farm } from "../../lib/types"
import type { AuthUser } from "../../lib/supabaseAuth"
import { Plus, MapPin, Maximize2, Sprout, Edit, Trash2 } from "lucide-react"
import { FarmFormModal } from "./farm-form-modal"
import { toast } from "../../hooks/use-toast"

interface FarmsListProps {
  user?: AuthUser;
}

export function FarmsList({ user }: FarmsListProps) {
  const [farms, setFarms] = useState<Farm[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingFarm, setEditingFarm] = useState<Farm | undefined>()
  
  const router = useRouter()

  // Estabilizar tenantId para evitar re-renders
  const tenantId = useMemo(() => user?.tenantId, [user?.tenantId])
  
  const loadFarms = useCallback(async () => {
    if (!user) {
      return
    }

    if (!user.tenantId) {
      console.error("Usuario sin tenantId asignado:", user)
      setIsLoading(false)
      toast({
        title: "Error",
        description: "Usuario sin tenant configurado",
        variant: "destructive"
      })
      return
    }

    try {
      setIsLoading(true)
      const data = await farmsApi.getFarms(user.tenantId)
      setFarms(data)
    } catch (error: any) {
      console.error("Error al cargar campos:", error)
      setFarms([])
      toast({
        title: "Error al cargar campos",
        description: error?.message || "No se pudieron cargar los campos",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [user, tenantId])

  useEffect(() => {
    if (tenantId) {
      loadFarms()
    } else {
      setIsLoading(false)
    }
  }, [tenantId, loadFarms])

  const handleCreateFarm = async (farmData: any) => {
    if (!user) {
      console.error("No user found")
      return
    }
    
    try {
      const result = await farmsApi.createFarm(user.tenantId, user.id, farmData)
      toast({
        title: "Campo creado",
        description: "El campo se ha creado exitosamente"
      })
      await loadFarms()
      setIsModalOpen(false)
    } catch (error: any) {
      console.error("Error al crear campo:", error)
      toast({
        title: "Error",
        description: error?.message || "No se pudo crear el campo",
        variant: "destructive"
      })
    }
  }

  const handleEditFarm = async (farmData: any) => {
    if (!editingFarm) return
    
    try {
      await farmsApi.updateFarm(editingFarm.id, farmData)
      toast({
        title: "Campo actualizado",
        description: "El campo se ha actualizado exitosamente"
      })
      await loadFarms()
      setIsModalOpen(false)
      setEditingFarm(undefined)
    } catch (error) {
      console.error("Error al actualizar campo:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el campo",
        variant: "destructive"
      })
    }
  }

  const handleDeleteFarm = async (farmId: string) => {
    if (!confirm("¿Estás seguro de eliminar este campo? Esta acción no se puede deshacer.")) return
    
    try {
      await farmsApi.deleteFarm(farmId)
      toast({
        title: "Campo eliminado",
        description: "El campo se ha eliminado exitosamente"
      })
      await loadFarms()
    } catch (error) {
      console.error("Error al eliminar campo:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el campo",
        variant: "destructive"
      })
    }
  }

  const openEditModal = (farm: Farm) => {
    setEditingFarm(farm)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingFarm(undefined)
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div>
            <h1 className="text-xl font-semibold">Campo</h1>
            <p className="text-sm text-muted-foreground">
              Gestión de campos y lotes - {user?.tenant?.name || 'Tu Empresa'}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Button onClick={() => {
              setEditingFarm(undefined)
              setIsModalOpen(true)
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Campo
            </Button>
            <div className="text-right">
              <p className="text-sm font-medium">{user?.nombre || user?.email}</p>
              <p className="text-xs text-muted-foreground">{user?.rol || 'Usuario'}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : farms.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-16rem)] space-y-4">
              <Sprout className="h-16 w-16 text-muted-foreground" />
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">No hay campos registrados</h3>
                <p className="text-muted-foreground mb-4">
                  Comienza creando tu primer campo para gestionar tus lotes y cultivos
                </p>
                <Button onClick={() => setIsModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear campo
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {farms.map((farm) => (
          <Card 
            key={farm.id}
            className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            onClick={() => router.push(`/campo/${farm.id}`)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl mb-2">{farm.name}</CardTitle>
                  {farm.location && (
                    <CardDescription className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {farm.location}
                    </CardDescription>
                  )}
                </div>
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(farm)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteFarm(farm.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {farm.area_ha && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Maximize2 className="h-4 w-4" />
                      Área
                    </span>
                    <span className="font-medium">{farm.area_ha} ha</span>
                  </div>
                )}
                
                {farm.default_crop && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Sprout className="h-4 w-4" />
                      Cultivo principal
                    </span>
                    <Badge variant="outline">{farm.default_crop}</Badge>
                  </div>
                )}
                
                {farm.notes && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                    {farm.notes}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
            </div>
          )}
        </div>
      </main>

      <FarmFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={editingFarm ? handleEditFarm : handleCreateFarm}
        farm={editingFarm}
      />
    </div>
  )
}
