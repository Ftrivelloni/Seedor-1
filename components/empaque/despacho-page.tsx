// components/empaque/despacho-page.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabaseClient"
import DespachoFormModal from "./despacho-form-modal"
import { exportToExcel as exportDataToExcel } from "../../lib/utils/excel-export"
import { useAuth } from "../../hooks/use-auth"

import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"

import {
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    Download,
    Search,
    Truck,
    Package,
} from "lucide-react"

export function DespachoPage() {
    const [despachos, setDespachos] = useState<any[]>([])
    const [filtered, setFiltered] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const [searchTerm, setSearchTerm] = useState("")
    const [estadoFilter, setEstadoFilter] = useState<string>("all")

    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    const [modalOpen, setModalOpen] = useState(false)
    const router = useRouter()
    
    const { user } = useAuth({});

    useEffect(() => {
        if (user?.tenantId) {
            loadDespachos();
        }
    }, [user?.tenantId]);

    const loadDespachos = async () => {
        if (!user?.tenantId) {
            console.error('No se encontró ID del tenant');
            return;
        }
        
        setIsLoading(true)
        const { data, error } = await supabase
            .from("despacho")
            .select("*")
            .eq("tenant_id", user.tenantId)
        setIsLoading(false)
        setDespachos(error ? [] : (data || []))
    }

    useEffect(() => {
        let list = [...despachos]

        if (searchTerm) {
            const q = searchTerm.toLowerCase()
            list = list.filter((d) =>
                [d.num_remito, d.cliente, d.transporte, d.destino]
                    .map((x) => (x ?? "").toString().toLowerCase())
                    .some((v) => v.includes(q))
            )
        }

        if (estadoFilter !== "all" && list.length > 0 && "estado" in list[0]) {
            list = list.filter((d) => d.estado === estadoFilter)
        }

        list.sort(
            (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        )

        setFiltered(list)
        setPage(1)
    }, [despachos, searchTerm, estadoFilter])

    const totalPallets = filtered.reduce((sum, d) => sum + (d.total_pallets || 0), 0)
    const totalCajas = filtered.reduce((sum, d) => sum + (d.total_cajas || 0), 0)

    const exportToExcel = () => {
        const headers = {
            fecha: "Fecha",
            num_remito: "Guía",
            cliente: "Cliente",
            destino: "Destino",
            transporte: "Transporte",
            chofer: "Chofer",
            total_pallets: "Total Pallets",
            total_cajas: "Total Cajas"
        }

        exportDataToExcel({
            data: filtered,
            filename: "despachos",
            sheetName: "Despachos",
            headers
        })
    }

    const totalRows = filtered.length
    const totalPages = Math.max(1, Math.ceil(totalRows / pageSize))
    const start = (page - 1) * pageSize
    const end = start + pageSize
    const pageRows = filtered.slice(start, end)

    const goPrev = () => setPage((p) => Math.max(1, p - 1))
    const goNext = () => setPage((p) => Math.min(totalPages, p + 1))

    if (!user || isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }
    
    if (!user) {
        return null; 
    }

    return (
        <div className="mx-auto w-full max-w-4xl md:max-w-5xl px-3 md:px-6 py-6 space-y-6">
            <div className="flex flex-col gap-2 mb-6">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={() => router.push("/empaque")}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold leading-tight">Despachos</h1>
                        <p className="text-sm text-muted-foreground mt-1">Control de envíos y entregas a clientes</p>
                    </div>
                </div>
                <div className="flex flex-1 items-center justify-end gap-2 mt-2">
                    <div className="relative hidden sm:block">
                        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por guía, cliente, etc..."
                            className="w-72 pl-9 border border-gray-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" onClick={exportToExcel} disabled={filtered.length === 0}>
                        <Download className="mr-2 h-4 w-4" />
                        Exportar Excel
                    </Button>
                    <Button onClick={() => setModalOpen(true)}>
                        Nuevo despacho
                    </Button>
                    <DespachoFormModal
                        open={modalOpen}
                        onClose={() => setModalOpen(false)}
                        onCreated={loadDespachos}
                        tenantId={user?.tenantId || ''}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-medium">
                            <Package className="h-4 w-4" />
                            Despachos filtrados
                        </CardTitle>
                        <CardDescription>{despachos.length} totales</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{filtered.length}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Pallets</CardTitle>
                        <CardDescription>en los resultados</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalPallets}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Cajas</CardTitle>
                        <CardDescription>en los resultados</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalCajas}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        Buscar y filtrar
                    </CardTitle>
                    <CardDescription className="sm:hidden">
                        Usá el buscador para filtrar por guía, cliente, transporte o destino.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative sm:hidden">
                            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar…"
                                className="w-full pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {despachos.length > 0 && "estado" in despachos[0] && (
                            <Select value={estadoFilter} onValueChange={(v) => setEstadoFilter(v)}>
                                <SelectTrigger className="w-full sm:w-56">
                                    <SelectValue placeholder="Estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los estados</SelectItem>
                                    <SelectItem value="preparando">Preparando</SelectItem>
                                    <SelectItem value="en_transito">En tránsito</SelectItem>
                                    <SelectItem value="entregado">Entregado</SelectItem>
                                    <SelectItem value="devuelto">Devuelto</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="gap-2">
                    <CardTitle className="flex items-center gap-2">
                        <Truck className="h-5 w-5" />
                        Registros de despachos
                    </CardTitle>
                    <CardDescription>
                        {filtered.length} de {despachos.length} registros
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                    {isLoading ? (
                        <div className="flex h-32 items-center justify-center">
                            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto rounded-lg border">
                                <Table className="min-w-[960px] text-sm">
                                    <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur">
                                        <TableRow>
                                            <TableHead className="sticky left-0 z-20 bg-background text-center">Fecha</TableHead>
                                            <TableHead className="text-center">Guía</TableHead>
                                            <TableHead className="text-center">Cliente</TableHead>
                                            <TableHead className="text-center">Destino</TableHead>
                                            <TableHead className="text-center">Transporte</TableHead>
                                            <TableHead className="text-center">Chofer</TableHead>
                                            <TableHead className="text-center">Total pallets</TableHead>
                                            <TableHead className="text-center">Total cajas</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pageRows.map((d) => (
                                            <TableRow key={d.id} className="hover:bg-muted/50">
                                                <TableCell className="sticky left-0 z-10 bg-background whitespace-nowrap py-2 text-center align-middle">
                                                    {d.fecha ? new Date(d.fecha).toLocaleDateString() : ""}
                                                </TableCell>
                                                <TableCell className="py-2 text-center align-middle">{d.num_remito}</TableCell>
                                                <TableCell className="py-2 text-center align-middle">{d.cliente}</TableCell>
                                                <TableCell className="py-2 text-center align-middle">{d.destino}</TableCell>
                                                <TableCell className="py-2 text-center align-middle">{d.transporte}</TableCell>
                                                <TableCell className="py-2 text-center align-middle">{d.chofer}</TableCell>
                                                <TableCell className="py-2 text-center align-middle">{d.total_pallets}</TableCell>
                                                <TableCell className="py-2 text-center align-middle">{d.total_cajas}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

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
                            <Truck className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                            <p className="text-muted-foreground">No se encontraron despachos</p>
                            <p className="text-sm text-muted-foreground">Creá el primero para comenzar</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
