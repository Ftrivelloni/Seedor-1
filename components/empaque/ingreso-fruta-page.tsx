// components/empaque/ingreso-fruta-page.tsx
"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { exportToExcel as exportDataToExcel } from "../../lib/utils/excel-export"
import { useAuth } from "../../hooks/use-auth"

import { IngresoFrutaFormModal } from "./ingreso-fruta-form-modal"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { ArrowLeft, ChevronLeft, ChevronRight, Download, Package, Scale, Search, Plus } from "lucide-react"

export function IngresoFrutaPage() {
    const { user: currentUser } = useAuth({});
    

    const [registros, setRegistros] = useState<any[]>([])
    const [filtered, setFiltered] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    

    const [searchTerm, setSearchTerm] = useState("")
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    const [modalOpen, setModalOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const router = useRouter()

    // Estabilizar tenantId
    const tenantId = useMemo(() => currentUser?.tenantId, [currentUser?.tenantId])

    const loadRegistros = useCallback(async () => {
        if (!tenantId) {
            console.error('No tenantId found para ingreso de fruta');
            setIsLoading(false);
            return;
        }
        
        try {
            setIsLoading(true)
            const { ingresoFrutaApi } = await import("../../lib/api")
            const data = await ingresoFrutaApi.getIngresos(tenantId)
            setRegistros(data || [])
        } catch (error: any) {
            console.error("Error al cargar registros de ingreso de fruta:", error)
            setRegistros([])
        } finally {
            setIsLoading(false)
        }
    }, [tenantId])

    useEffect(() => {
        if (tenantId) {
            loadRegistros();
        } else {
            setIsLoading(false);
        }
    }, [tenantId, loadRegistros])

    useEffect(() => {
        let list = [...registros]
        if (searchTerm) {
            const q = searchTerm.toLowerCase()
            list = list.filter((r) =>
                [
                    r.productor,
                    r.producto,
                    r.finca,
                    r.transporte,
                    r.chofer,
                    r.tipo_bin,
                    r.contratista,
                    r.tipo_cosecha,
                    r.operario,
                    r.num_ticket?.toString(),
                    r.num_remito?.toString(),
                    r.lote?.toString(),
                ]
                    .map((x) => (x ?? "").toLowerCase())
                    .some((v) => v.includes(q))
            )
        }
        list.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
        setFiltered(list)
        setPage(1)
    }, [registros, searchTerm])

    const totalBins = useMemo(
        () => filtered.reduce((sum, r) => sum + (Number(r.cant_bin) || 0), 0),
        [filtered]
    )
    const totalPeso = useMemo(
        () => filtered.reduce((sum, r) => sum + (Number(r.peso_neto) || 0), 0),
        [filtered]
    )

    const exportToExcel = () => {
        const headers = {
            fecha: "Fecha",
            num_ticket: "Ticket",
            num_remito: "Remito",
            productor: "Productor",
            finca: "Finca",
            producto: "Producto",
            lote: "Lote",
            contratista: "Contratista",
            tipo_cosecha: "Tipo cosecha",
            estado_liquidacion: "Liquidación",
            transporte: "Transporte",
            chofer: "Chofer",
            chasis: "Chasis",
            acoplado: "Acoplado",
            operario: "Operario",
            cant_bin: "Cant. bins",
            tipo_bin: "Tipo bin",
            peso_neto: "Peso neto (kg)"
        }

        const dataWithTransformations = filtered.map(r => ({
            ...r,
            estado_liquidacion: r.estado_liquidacion ? "Sí" : "No"
        }))

        exportDataToExcel({
            data: dataWithTransformations,
            filename: "ingreso-fruta",
            sheetName: "Ingreso Fruta",
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

    const pageRowsWithKey = useMemo(() => {
        return pageRows.map((r, i) => {
            const base =
                r?.id ??
                r?.num_ticket ??
                r?.num_remito ??
                (r?.fecha ? new Date(r.fecha).getTime() : "s/fecha")
            const __key = String(base) + "-" + (start + i)
            return { ...r, __key }
        })
    }, [pageRows, start])

    if (!currentUser || isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
                <div className="ml-3 text-sm text-muted-foreground">
                    {!currentUser ? 'Cargando usuario...' : 'Cargando registros...'}
                </div>
            </div>
        )
    }

    return (
        <div className="mx-auto w-full max-w-4xl px-3 md:px-6 py-6 space-y-6">
            <div className="flex flex-col gap-2 mb-6">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={() => router.push("/empaque")}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold leading-tight">Ingreso de Fruta</h1>
                        <p className="text-sm text-muted-foreground mt-1">Recepción de materia prima</p>
                    </div>
                </div>
                <div className="flex flex-1 items-center justify-end gap-2 mt-2">
                    <div className="relative hidden sm:block">
                        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por productor, producto, transporte, lote…"
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
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo ingreso
                    </Button>
                    <IngresoFrutaFormModal
                        isOpen={modalOpen}
                        onClose={() => setModalOpen(false)}
                        onSubmit={async (data) => {
                            if (!currentUser?.tenantId) {
                                alert("No se pudo obtener el ID del tenant. Contacte a soporte.")
                                return
                            }
                            setSaving(true)
                            try {
                                const { ingresoFrutaApi } = await import("../../lib/api")
                                await ingresoFrutaApi.createIngreso({ ...data, tenant_id: currentUser.tenantId })
                                const nuevos = await ingresoFrutaApi.getIngresos(currentUser.tenantId)
                                setRegistros(nuevos)
                                setModalOpen(false)
                            } catch (e: any) {
                                alert("Error al guardar el ingreso: " + (e?.message || JSON.stringify(e)))
                                console.error(e)
                            } finally {
                                setSaving(false)
                            }
                        }}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-medium">
                            <Package className="h-4 w-4" />
                            Bins en resultados
                        </CardTitle>
                        <CardDescription>{filtered.length} registros</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalBins}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-medium">
                            <Scale className="h-4 w-4" />
                            Peso neto total (kg)
                        </CardTitle>
                        <CardDescription>en los resultados</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalPeso}</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="sm:hidden">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        Buscar
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Input
                        placeholder="Buscar por productor, producto, transporte, lote…"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </CardContent>
            </Card>

            <div className="space-y-6">
                <Card>
                    <CardHeader className="gap-1">
                        <CardTitle>Datos generales</CardTitle>
                        <CardDescription>Fecha, ticket, remito y productor</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto rounded-lg border">
                            <table className="min-w-[960px] w-full text-sm">
                                <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur">
                                <tr>
                                    <th className="sticky left-0 z-20 bg-background px-3 py-2 text-center font-medium">Fecha</th>
                                    <th className="px-3 py-2 text-center font-medium">Ticket</th>
                                    <th className="px-3 py-2 text-center font-medium">Remito</th>
                                    <th className="px-3 py-2 text-center font-medium">Productor</th>
                                    <th className="px-3 py-2 text-center font-medium">Finca</th>
                                    <th className="px-3 py-2 text-center font-medium">Producto</th>
                                    <th className="px-3 py-2 text-center font-medium">Lote</th>
                                    <th className="px-3 py-2 text-center font-medium">Contratista</th>
                                    <th className="px-3 py-2 text-center font-medium">Tipo cosecha</th>
                                    <th className="px-3 py-2 text-center font-medium">Liquidación</th>
                                </tr>
                                </thead>
                                <tbody>
                                {isLoading ? (
                                    <tr><td colSpan={10} className="px-3 py-6 text-center text-muted-foreground">Cargando…</td></tr>
                                ) : pageRowsWithKey.length === 0 ? (
                                    <tr><td colSpan={10} className="px-3 py-6 text-center text-muted-foreground">Sin registros</td></tr>
                                ) : (
                                    pageRowsWithKey.map((r) => (
                                        <tr key={`gen-${r.__key}`} className="hover:bg-muted/50">
                                            <td className="sticky left-0 z-10 bg-background px-3 py-2 text-center align-middle">
                                                {r.fecha ? new Date(r.fecha).toLocaleDateString() : ""}
                                            </td>
                                            <td className="px-3 py-2 text-center align-middle">{r.num_ticket ?? "-"}</td>
                                            <td className="px-3 py-2 text-center align-middle">{r.num_remito ?? "-"}</td>
                                            <td className="px-3 py-2 text-center align-middle">{r.productor ?? "-"}</td>
                                            <td className="px-3 py-2 text-center align-middle">{r.finca ?? "-"}</td>
                                            <td className="px-3 py-2 text-center align-middle">{r.producto ?? "-"}</td>
                                            <td className="px-3 py-2 text-center align-middle">{r.lote ?? "-"}</td>
                                            <td className="px-3 py-2 text-center align-middle">{r.contratista ?? "-"}</td>
                                            <td className="px-3 py-2 text-center align-middle">{r.tipo_cosecha ?? "-"}</td>
                                            <td className="px-3 py-2 text-center align-middle">{r.estado_liquidacion ? "Sí" : "No"}</td>
                                        </tr>
                                    ))
                                )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="gap-1">
                        <CardTitle>Transporte</CardTitle>
                        <CardDescription>Transportista, chofer y unidad</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto rounded-lg border">
                            <table className="min-w-[720px] w-full text-sm">
                                <thead className="bg-background/95 backdrop-blur">
                                <tr>
                                    <th className="px-3 py-2 text-center font-medium">Transporte</th>
                                    <th className="px-3 py-2 text-center font-medium">Chofer</th>
                                    <th className="px-3 py-2 text-center font-medium">Chasis</th>
                                    <th className="px-3 py-2 text-center font-medium">Acoplado</th>
                                    <th className="px-3 py-2 text-center font-medium">Operario</th>
                                </tr>
                                </thead>
                                <tbody>
                                {isLoading ? (
                                    <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">Cargando…</td></tr>
                                ) : pageRowsWithKey.length === 0 ? (
                                    <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">Sin registros</td></tr>
                                ) : (
                                    pageRowsWithKey.map((r) => (
                                        <tr key={`tr-${r.__key}`} className="hover:bg-muted/50">
                                            <td className="px-3 py-2 text-center align-middle">{r.transporte ?? "-"}</td>
                                            <td className="px-3 py-2 text-center align-middle">{r.chofer ?? "-"}</td>
                                            <td className="px-3 py-2 text-center align-middle">{r.chasis ?? "-"}</td>
                                            <td className="px-3 py-2 text-center align-middle">{r.acoplado ?? "-"}</td>
                                            <td className="px-3 py-2 text-center align-middle">{r.operario ?? "-"}</td>
                                        </tr>
                                    ))
                                )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="gap-1">
                        <CardTitle>Bins y peso</CardTitle>
                        <CardDescription>Cantidad de bins, tipo y peso neto</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto rounded-lg border">
                            <table className="min-w-[560px] w-full text-sm">
                                <thead className="bg-background/95 backdrop-blur">
                                <tr>
                                    <th className="px-3 py-2 text-center font-medium">Cant. bins</th>
                                    <th className="px-3 py-2 text-center font-medium">Tipo bin</th>
                                    <th className="px-3 py-2 text-center font-medium">Peso neto (kg)</th>
                                </tr>
                                </thead>
                                <tbody>
                                {isLoading ? (
                                    <tr><td colSpan={3} className="px-3 py-6 text-center text-muted-foreground">Cargando…</td></tr>
                                ) : pageRowsWithKey.length === 0 ? (
                                    <tr><td colSpan={3} className="px-3 py-6 text-center text-muted-foreground">Sin registros</td></tr>
                                ) : (
                                    pageRowsWithKey.map((r) => (
                                        <tr key={`bp-${r.__key}`} className="hover:bg-muted/50">
                                            <td className="px-3 py-2 text-center align-middle">{r.cant_bin ?? "-"}</td>
                                            <td className="px-3 py-2 text-center align-middle">{r.tipo_bin ?? "-"}</td>
                                            <td className="px-3 py-2 text-center align-middle">{r.peso_neto ?? "-"}</td>
                                        </tr>
                                    ))
                                )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
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
        </div>
    )
}
