// components/empaque/pallets-page.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabaseClient"
import PalletsFormModal from "./pallets-form-modal"
import { authService } from "../../lib/supabaseAuth"
import type { Pallet } from "../../lib/types"

import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Badge } from "../ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"

import {
    Plus,
    Search,
    Download,
    Archive,
    MapPin,
    Thermometer,
    Calendar,
    Package,
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    Boxes
} from "lucide-react"

// === util badges ===
function EstadoBadge({ estado }: { estado: Pallet["estado"] }) {
    switch (estado) {
        case "armado":
            return (
                <Badge variant="secondary">
                    <Package className="mr-1 h-3 w-3" />
                    Armado
                </Badge>
            )
        case "en_camara":
            return (
                <Badge variant="default" className="bg-blue-500">
                    <Thermometer className="mr-1 h-3 w-3" />
                    En Cámara
                </Badge>
            )
        case "listo_despacho":
            return (
                <Badge variant="default" className="bg-green-500">
                    <Archive className="mr-1 h-3 w-3" />
                    Listo Despacho
                </Badge>
            )
        case "despachado":
            return (
                <Badge variant="outline">
                    <Download className="mr-1 h-3 w-3" />
                    Despachado
                </Badge>
            )
        default:
            return <Badge variant="outline">{estado}</Badge>
    }
}

export function PalletsPage() {
    const [pallets, setPallets] = useState<Pallet[]>([])
    const [filtered, setFiltered] = useState<Pallet[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const [searchTerm, setSearchTerm] = useState("")
    const [estadoFilter, setEstadoFilter] = useState<string>("all")
    const [ubicacionFilter, setUbicacionFilter] = useState<string>("all")

    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    const [modalOpen, setModalOpen] = useState(false)
    const [user, setUser] = useState<any>(null)
    const router = useRouter()

    // ===== auth =====
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

    // ===== data =====
    useEffect(() => {
        if (!user?.tenantId) return
            ;(async () => {
            setIsLoading(true)
            const { data, error } = await supabase
                .from("pallets")
                .select("*")
                .eq("tenant_id", user.tenantId)
            setIsLoading(false)
            if (error) {
                console.error("Error al cargar pallets:", error)
                setPallets([])
            } else {
                setPallets(data || [])
            }
        })()
    }, [user])

    // ===== filters/search/sort =====
    useEffect(() => {
        let list = [...pallets]

        if (searchTerm) {
            const q = searchTerm.toLowerCase()
            list = list.filter((p) =>
                [
                    p.codigo,
                    p.tipoFruta,
                    p.loteOrigen,
                    p.destino ?? "",
                    p.ubicacion ?? "",
                    String(p.cantidadCajas ?? ""),
                    String(p.pesoTotal ?? ""),
                ]
                    .map((x) => (x ?? "").toLowerCase())
                    .some((v) => v.includes(q))
            )
        }

        if (estadoFilter !== "all") {
            list = list.filter((p) => p.estado === estadoFilter)
        }

        if (ubicacionFilter !== "all") {
            list = list.filter((p) => (p.ubicacion ?? "").toLowerCase() === ubicacionFilter.toLowerCase())
        }

        list.sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime())

        setFiltered(list)
        setPage(1)
    }, [pallets, searchTerm, estadoFilter, ubicacionFilter])

    // ===== ubicaciones únicas =====
    const ubicaciones = useMemo(
        () =>
            Array.from(new Set(pallets.map((p) => p.ubicacion).filter(Boolean))).sort() as string[],
        [pallets]
    )

    // ===== KPIs =====
    const stats = useMemo(() => {
        const totalCajas = filtered.reduce((s, p) => s + (p.cantidadCajas || 0), 0)
        const totalPeso = filtered.reduce((s, p) => s + (p.pesoTotal || 0), 0)
        const enCamara = filtered.filter((p) => p.estado === "en_camara").length
        const listoDespacho = filtered.filter((p) => p.estado === "listo_despacho").length
        return { totalCajas, totalPeso, enCamara, listoDespacho }
    }, [filtered])

    // ===== CSV =====
    const exportToCSV = () => {
        const headers = [
            "Código",
            "Fecha",
            "Tipo Fruta",
            "Cajas",
            "Peso Total (kg)",
            "Lote Origen",
            "Ubicación",
            "Estado",
            "Destino",
            "Temperatura (°C)",
            "Vencimiento",
        ]
        const rows = filtered.map((p) => [
            p.codigo,
            p.fechaCreacion,
            `"${p.tipoFruta}"`,
            p.cantidadCajas ?? "",
            p.pesoTotal ?? "",
            p.loteOrigen ?? "",
            `"${p.ubicacion ?? ""}"`,
            p.estado ?? "",
            `"${p.destino ?? ""}"`,
            p.temperaturaAlmacen ?? "",
            p.fechaVencimiento ?? "",
        ])
        const csv = [headers, ...rows].map((r) => r.join(",")).join("\n")
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `pallets-${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    // ===== pagination =====
    const totalRows = filtered.length
    const totalPages = Math.max(1, Math.ceil(totalRows / pageSize))
    const start = (page - 1) * pageSize
    const end = start + pageSize
    const pageRows = filtered.slice(start, end)

    const goPrev = () => setPage((p) => Math.max(1, p - 1))
    const goNext = () => setPage((p) => Math.min(totalPages, p + 1))

    if (!user) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
            </div>
        )
    }
    if (!["Admin", "Empaque"].includes(user.rol)) {
        return (
            <div className="flex h-64 items-center justify-center">
                <p className="text-muted-foreground">No tienes permisos para acceder a esta sección</p>
            </div>
        )
    }

    return (
        <div className="mx-auto w-full max-w-4xl md:max-w-5xl px-3 md:px-6 py-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={() => router.push("/empaque")}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold leading-tight">Gestión de Pallets</h1>
                        <p className="text-sm text-muted-foreground">Control de pallets y almacenamiento</p>
                    </div>
                </div>

                <div className="flex flex-1 items-center justify-end gap-2">
                    <div className="relative hidden sm:block">
                        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por código, fruta, lote, destino…"
                            className="w-72 pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <Button variant="outline" onClick={exportToCSV} disabled={filtered.length === 0}>
                        <Download className="mr-2 h-4 w-4" />
                        Exportar CSV
                    </Button>

                    <Button onClick={() => setModalOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo pallet
                    </Button>

                    <PalletsFormModal
                        open={modalOpen}
                        onClose={() => setModalOpen(false)}
                        onCreated={() => {
                            // recargar lista
                            if (!user?.tenantId) return
                                ;(async () => {
                                const { data, error } = await supabase
                                    .from("pallets")
                                    .select("*")
                                    .eq("tenant_id", user.tenantId)
                                if (!error) setPallets(data || [])
                            })()
                        }}
                        tenantId={user.tenantId}
                    />
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-medium">
                            <Boxes className="h-4 w-4" />
                            Pallets en resultados
                        </CardTitle>
                        <CardDescription>{filtered.length} visibles</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{filtered.length}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-medium">
                            <Package className="h-4 w-4" />
                            Cajas (total)
                        </CardTitle>
                        <CardDescription>en resultados</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.totalCajas.toLocaleString()}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-medium">
                            <Thermometer className="h-4 w-4" />
                            En cámara
                        </CardTitle>
                        <CardDescription>pallets</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{stats.enCamara}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-medium">
                            <Archive className="h-4 w-4" />
                            Listos despacho
                        </CardTitle>
                        <CardDescription>pallets</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.listoDespacho}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filtros (mobile) */}
            <Card className="sm:hidden">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        Buscar y filtrar
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Input
                        placeholder="Buscar por código, fruta, lote, destino…"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los estados</SelectItem>
                            <SelectItem value="armado">Armado</SelectItem>
                            <SelectItem value="en_camara">En Cámara</SelectItem>
                            <SelectItem value="listo_despacho">Listo Despacho</SelectItem>
                            <SelectItem value="despachado">Despachado</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={ubicacionFilter} onValueChange={setUbicacionFilter}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Ubicación" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas las ubicaciones</SelectItem>
                            {ubicaciones.map((u) => (
                                <SelectItem key={u} value={u}>
                                    {u}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {/* Barra de filtros (desktop) */}
            <Card className="hidden sm:block">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        Buscar y filtrar
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-3 md:flex-row md:items-center">
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por código, fruta, lote o destino…"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                            <SelectTrigger className="w-full md:w-48">
                                <SelectValue placeholder="Estado" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los estados</SelectItem>
                                <SelectItem value="armado">Armado</SelectItem>
                                <SelectItem value="en_camara">En Cámara</SelectItem>
                                <SelectItem value="listo_despacho">Listo Despacho</SelectItem>
                                <SelectItem value="despachado">Despachado</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={ubicacionFilter} onValueChange={setUbicacionFilter}>
                            <SelectTrigger className="w-full md:w-48">
                                <SelectValue placeholder="Ubicación" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas las ubicaciones</SelectItem>
                                {ubicaciones.map((u) => (
                                    <SelectItem key={u} value={u}>
                                        {u}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Tabla */}
            <Card>
                <CardHeader className="gap-2">
                    <CardTitle className="flex items-center gap-2">
                        <Archive className="h-5 w-5" />
                        Pallets
                    </CardTitle>
                    <CardDescription>
                        {filtered.length} de {pallets.length} pallets
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                    {isLoading ? (
                        <div className="flex h-32 items-center justify-center">
                            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto rounded-lg border">
                                <Table className="min-w-[1100px] text-sm">
                                    <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur">
                                        <TableRow>
                                            <TableHead className="sticky left-0 z-20 bg-background text-center">Código</TableHead>
                                            <TableHead className="text-center">Fecha</TableHead>
                                            <TableHead className="text-center">Tipo Fruta</TableHead>
                                            <TableHead className="text-center">Cajas</TableHead>
                                            <TableHead className="text-center">Peso total (kg)</TableHead>
                                            <TableHead className="text-center">Lote Origen</TableHead>
                                            <TableHead className="text-center">Ubicación</TableHead>
                                            <TableHead className="text-center">Estado</TableHead>
                                            <TableHead className="text-center">Destino</TableHead>
                                            <TableHead className="text-center">Temp.</TableHead>
                                            <TableHead className="text-center">Vencimiento</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pageRows.map((p) => {
                                            const diasVenc =
                                                p.fechaVencimiento != null
                                                    ? Math.ceil(
                                                        (new Date(p.fechaVencimiento).getTime() - new Date().getTime()) /
                                                        (1000 * 60 * 60 * 24)
                                                    )
                                                    : null
                                            const nearDue = diasVenc !== null && diasVenc <= 3

                                            return (
                                                <TableRow key={p.id} className="hover:bg-muted/50">
                                                    <TableCell className="sticky left-0 z-10 bg-background py-2 text-center align-middle font-mono">
                                                        {p.codigo}
                                                    </TableCell>
                                                    <TableCell className="py-2 text-center align-middle">
                                                        {p.fechaCreacion ? new Date(p.fechaCreacion).toLocaleDateString() : "-"}
                                                    </TableCell>
                                                    <TableCell className="py-2 text-center align-middle">{p.tipoFruta}</TableCell>
                                                    <TableCell className="py-2 text-center align-middle">
                                                        {p.cantidadCajas?.toLocaleString() ?? 0}
                                                    </TableCell>
                                                    <TableCell className="py-2 text-center align-middle">
                                                        {p.pesoTotal?.toLocaleString() ?? 0}
                                                    </TableCell>
                                                    <TableCell className="py-2 text-center align-middle font-mono text-xs">
                                                        {p.loteOrigen}
                                                    </TableCell>
                                                    <TableCell className="py-2 text-center align-middle">
                                                        <div className="inline-flex items-center gap-1">
                                                            <MapPin className="h-3 w-3 text-muted-foreground" />
                                                            <span className="text-sm">{p.ubicacion}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-2 text-center align-middle">
                                                        <EstadoBadge estado={p.estado} />
                                                    </TableCell>
                                                    <TableCell className="py-2 text-center align-middle">
                                                        {p.destino || <span className="text-muted-foreground">Sin asignar</span>}
                                                    </TableCell>
                                                    <TableCell className="py-2 text-center align-middle">
                                                        {p.temperaturaAlmacen != null ? (
                                                            <div className="inline-flex items-center gap-1">
                                                                <Thermometer className="h-3 w-3 text-blue-500" />
                                                                <span className="text-xs">{p.temperaturaAlmacen}°C</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">N/A</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="py-2 text-center align-middle">
                                                        {p.fechaVencimiento ? (
                                                            <div className={`inline-flex items-center gap-1 ${nearDue ? "text-destructive" : ""}`}>
                                                                <Calendar className="h-3 w-3" />
                                                                <span className="text-xs">
                                  {new Date(p.fechaVencimiento).toLocaleDateString()}{" "}
                                                                    {diasVenc !== null && (
                                                                        <span className="ml-1">({diasVenc > 0 ? `${diasVenc}d` : "Vencido"})</span>
                                                                    )}
                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">N/A</span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* paginación */}
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

                    {!isLoading && filtered.length === 0 && (
                        <div className="py-8 text-center">
                            <Archive className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                            <p className="text-muted-foreground">No se encontraron pallets</p>
                            <p className="text-sm text-muted-foreground">Crea el primero para comenzar</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
