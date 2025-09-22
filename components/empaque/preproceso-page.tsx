// components/empaque/preproceso-page.tsx
"use client"
import PreprocesoFormModal from "./preproceso-form-modal";
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "../ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { authService } from "../../lib/supabaseAuth"
import { supabase } from "../../lib/supabaseClient"
import { Plus, Download, ArrowLeft, Cog, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { exportToExcel as exportDataToExcel } from "../../lib/utils/excel-export"

export function PreprocesoPage() {
    const [registros, setRegistros] = useState<any[]>([])
    const [filteredRegistros, setFilteredRegistros] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [modalOpen, setModalOpen] = useState(false)
    const [user, setUser] = useState<any>(null)

    // paginación
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    const router = useRouter()

    useEffect(() => {
        const loadUser = async () => {
            const sessionUser = await authService.checkSession()
            if (!sessionUser) {
                router.push("/login")
                return
            }
            setUser(sessionUser)
        }
        loadUser()
    }, [router])

    useEffect(() => {
        if (user) loadRegistros()
    }, [user])

    useEffect(() => {
        let filtered = registros
        if (searchTerm) {
            filtered = filtered.filter(
                (r) =>
                    r.semana?.toString().includes(searchTerm) ||
                    r.fecha?.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }
        filtered = filtered.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
        setFilteredRegistros(filtered)
        setPage(1) // reset página al filtrar
    }, [registros, searchTerm])

    const loadRegistros = async () => {
        if (!user?.tenantId) return
        setIsLoading(true)
        const { data, error } = await supabase
            .from("preseleccion")
            .select("*")
            .eq("tenant_id", user.tenantId)
        setIsLoading(false)
        setRegistros(error ? [] : (data || []))
    }

    const exportToExcel = () => {
        const headers = {
            fecha: "Fecha",
            semana: "Semana", 
            duracion: "Duración",
            bin_volcados: "Bin Volcados",
            ritmo_maquina: "Ritmo Máquina",
            duracion_proceso: "Duración Proceso",
            bin_pleno: "Bin Pleno",
            bin_intermedio_I: "Bin Intermedio I",
            bin_intermedio_II: "Bin Intermedio II",
            bin_incipiente: "Bin Incipiente",
            cant_personal: "Cant. Personal"
        }

        exportDataToExcel({
            data: filteredRegistros,
            filename: "preproceso",
            sheetName: "Preproceso",
            headers
        })
    }

    // datos paginados
    const totalRows = filteredRegistros.length
    const totalPages = Math.max(1, Math.ceil(totalRows / pageSize))
    const start = (page - 1) * pageSize
    const end = start + pageSize
    const pageRows = filteredRegistros.slice(start, end)

    const goPrev = () => setPage(p => Math.max(1, p - 1))
    const goNext = () => setPage(p => Math.min(totalPages, p + 1))

    if (!user || !["Admin", "Empaque"].includes(user.rol)) {
        return (
            <div className="flex h-64 items-center justify-center">
                <p className="text-muted-foreground">No tienes permisos para acceder a esta sección</p>
            </div>
        )
    }

    return (
        <div className="mx-auto w-full max-w-4xl md:max-w-5xl px-3 md:px-6 py-6 space-y-6">
            {/* Header compacto */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={() => router.push('/empaque')}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold leading-tight">Preproceso</h1>
                        <p className="text-sm text-muted-foreground">Gestión de preparación y limpieza de fruta</p>
                    </div>
                </div>

                <div className="flex flex-1 items-center justify-end gap-2">
                    <div className="relative hidden sm:block">
                        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por semana o fecha…"
                            className="pl-9 w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" onClick={exportToExcel} disabled={filteredRegistros.length === 0}>
                        <Download className="mr-2 h-4 w-4" />
                        Exportar Excel
                    </Button>
                    <Button onClick={() => setModalOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo Preproceso
                    </Button>
                    <PreprocesoFormModal
                        open={modalOpen}
                        onClose={() => setModalOpen(false)}
                        onCreated={loadRegistros}
                        tenantId={user.tenantId}
                    />
                </div>
            </div>

            {/* Tabla principal */}
            <Card>
                <CardHeader className="gap-2">
                    <CardTitle className="flex items-center gap-2">
                        <Cog className="h-5 w-5" />
                        Registros de Preproceso
                    </CardTitle>
                    <CardDescription>
                        {filteredRegistros.length} de {registros.length} registros
                    </CardDescription>

                    {/* Buscador en mobile */}
                    <div className="sm:hidden">
                        <Input
                            placeholder="Buscar por semana o fecha…"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>

                <CardContent className="space-y-3">
                    {isLoading ? (
                        <div className="flex h-32 items-center justify-center">
                            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto rounded-lg border">
                                <Table className="min-w-[960px] text-sm">
                                    <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur">
                                        <TableRow>
                                            <TableHead className="sticky left-0 z-20 bg-background text-center">Fecha</TableHead>
                                            <TableHead className="text-center">Semana</TableHead>
                                            <TableHead className="text-center">Duración</TableHead>
                                            <TableHead className="text-center">Bin Volcados</TableHead>
                                            <TableHead className="text-center">Ritmo Máquina</TableHead>
                                            <TableHead className="text-center">Duración Proceso</TableHead>
                                            <TableHead className="text-center">Bin Pleno</TableHead>
                                            <TableHead className="text-center">Bin Intermedio I</TableHead>
                                            <TableHead className="text-center">Bin Intermedio II</TableHead>
                                            <TableHead className="text-center">Bin Incipiente</TableHead>
                                            <TableHead className="text-center">Cant. Personal</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pageRows.map((r) => (
                                            <TableRow key={r.id} className="hover:bg-muted/50">
                                                <TableCell className="sticky left-0 z-10 bg-background whitespace-nowrap py-2 text-center align-middle">
                                                    {r.fecha?.slice(0,10)}
                                                </TableCell>
                                                <TableCell className="py-2 text-center align-middle">{r.semana}</TableCell>
                                                <TableCell className="py-2 text-center align-middle">{r.duracion}</TableCell>
                                                <TableCell className="py-2 text-center align-middle">{r.bin_volcados}</TableCell>
                                                <TableCell className="py-2 text-center align-middle">{r.ritmo_maquina}</TableCell>
                                                <TableCell className="py-2 text-center align-middle">{r.duracion_proceso}</TableCell>
                                                <TableCell className="py-2 text-center align-middle">{r.bin_pleno}</TableCell>
                                                <TableCell className="py-2 text-center align-middle">{r.bin_intermedio_I}</TableCell>
                                                <TableCell className="py-2 text-center align-middle">{r.bin_intermedio_II}</TableCell>
                                                <TableCell className="py-2 text-center align-middle">{r.bin_incipiente}</TableCell>
                                                <TableCell className="py-2 text-center align-middle">{r.cant_personal}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Controles de paginación */}
                            <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                                <div className="text-sm text-muted-foreground">
                                    Mostrando <strong>{Math.min(end, totalRows)}</strong> de <strong>{totalRows}</strong> — página {page} de {totalPages}
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1">
                                        <span className="text-sm text-muted-foreground">Filas por página</span>
                                        <Select
                                            value={String(pageSize)}
                                            onValueChange={(v) => {
                                                const ps = Number(v)
                                                setPageSize(ps)
                                                setPage(1)
                                            }}
                                        >
                                            <SelectTrigger className="h-8 w-[90px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="10">10</SelectItem>
                                                <SelectItem value="25">25</SelectItem>
                                                <SelectItem value="50">50</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <Button variant="outline" size="sm" onClick={goPrev} disabled={page === 1}>
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={goNext} disabled={page === totalPages}>
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
