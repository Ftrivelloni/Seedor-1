'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Tag, ArrowLeft } from 'lucide-react'
import { finanzasApiService } from '@/lib/finanzas/finanzas-service'
import { useAuth } from '@/hooks/use-auth'

export default function CategoriasPage() {
  const { user } = useAuth()
  const router = useRouter()
  const tenantId = user?.tenantId

  const [categorias, setCategorias] = useState<Array<{ id: string; name: string; kind?: string }>>([])
  const [loading, setLoading] = useState(true)
  const [nombre, setNombre] = useState('')
  const [kind, setKind] = useState<'ingreso' | 'egreso' | ''>('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (tenantId) {
      finanzasApiService.categories.listCategories(tenantId).then((cats) => {
        setCategorias(cats.map(c => ({ id: c.id, name: c.name, kind: c.kind })))
        setLoading(false)
      })
    }
  }, [tenantId])

  const handleAdd = async () => {
    setError('')
    if (!nombre.trim()) {
      setError('El nombre es obligatorio')
      return
    }
    if (!kind) {
      setError('Debe seleccionar un tipo (Ingreso o Egreso)')
      return
    }
    if (!tenantId) {
      setError('No se encontró tenantId')
      return
    }

    setAdding(true)
    try {
      const created = await finanzasApiService.categories.createCategory(tenantId, {
        name: nombre.trim(),
        kind,
      })
      setCategorias((prev) => [...prev, { id: created.id, name: created.name, kind: created.kind }])
      setNombre('')
      setKind('')
    } catch (err: any) {
      console.error('Error creating category:', err)
      setError(err.message || 'Error al agregar categoría')
    } finally {
      setAdding(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Cargando categorías...</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <Button variant="outline" size="sm" onClick={() => router.push("/finanzas")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold leading-tight">Categorías de Finanzas</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona las categorías para clasificar tus movimientos
          </p>
        </div>
      </div>

      {/* Formulario para agregar categoría */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Agregar Nueva Categoría
          </CardTitle>
          <CardDescription>
            Las categorías te ayudan a organizar y filtrar tus movimientos de caja
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Nombre de la categoría"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="flex-1"
              disabled={adding}
            />
            <Select value={kind} onValueChange={(v) => setKind(v as 'ingreso' | 'egreso')}>
              <SelectTrigger className="w-full sm:w-[180px]" disabled={adding}>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ingreso">Ingreso</SelectItem>
                <SelectItem value="egreso">Egreso</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAdd} disabled={adding || !nombre.trim() || !kind}>
              {adding ? 'Agregando...' : 'Agregar'}
            </Button>
          </div>
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de categorías existentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Categorías Existentes ({categorias.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {categorias.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No hay categorías creadas. Agrega tu primera categoría arriba.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categorias.map((cat) => (
                <Badge
                  key={cat.id}
                  variant="outline"
                  className="text-sm px-3 py-1.5"
                >
                  {cat.name}
                  {cat.kind && (
                    <span className="ml-2 text-xs opacity-60">
                      ({cat.kind === 'ingreso' ? 'Ingreso' : 'Egreso'})
                    </span>
                  )}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
