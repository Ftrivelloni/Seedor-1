// components/empaque/egreso-fruta-page.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { exportToExcel as exportDataToExcel } from "../../lib/utils/excel-export"
import { useAuth } from "../../hooks/use-auth"

import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"

import { ArrowLeft, ArrowUp, ChevronLeft, ChevronRight, Download, Plus, Search } from "lucide-react"
import EgresoFrutaFormModal from "./egreso-fruta-form-modal"
import { isDemoModeClient } from "../../lib/demo/utils"
import { demoEmpaqueEgresos } from "../../lib/demo/store"
import { supabase } from "../../lib/supabaseClient"

export function EgresoFrutaPage() {
    const { user } = useAuth({});
    
    const [egresos, setEgresos] = useState<any[]>([])
    const [filtered, setFiltered] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const [searchTerm, setSearchTerm] = useState("")
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    const [modalOpen, setModalOpen] = useState(false)
    const router = useRouter()
    const isDemo = isDemoModeClient()

    useEffect(() => {
        if (user?.tenantId) {
            loadEgresos();
        }
    }, [user?.tenantId, isDemo])

    const loadEgresos = async () => {
        if (!user?.tenantId) {
            console.error('No tenant ID found for user');
            return;
        }
        
        setIsLoading(true)
        if (isDemo) {
            const data = demoEmpaqueEgresos(user.tenantId)
            setEgresos(data)
            setIsLoading(false)
            return
        }
        const { data, error } = await supabase
            .from("egreso_fruta")
            .select("*")
            .eq("tenant_id", user.tenantId)
        setIsLoading(false)
        setEgresos(error ? [] : (data || []))
    }

    useEffect(() => {
        let list = [...egresos]

        if (searchTerm) {
            const q = searchTerm.toLowerCase()
            list = list.filter((e) =>
                [
                    e.producto,
                    e.cliente,
                    e.chofer,
                    e.transporte,
                    e.finca,
                    e.chasis,
                    e.acoplado,
                    e.num_remito?.toString(),
                ]
                    .map((x) => (x ?? "").toLowerCase())
                    .some((v) => v.includes(q))
            )
        }

        list.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
        setFiltered(list)
        setPage(1)
    }, [egresos, searchTerm])

    const exportToExcel = () => {
        const headers = {
            fecha: "Fecha",
            producto: "Producto",
            peso_neto: "Peso Neto",
            cliente: "Cliente",
            finca: "Finca",
            num_remito: "Remito",
            chofer: "Chofer",
            transporte: "Transporte",
            chasis: "Chasis",
            acoplado: "Acoplado"
        }

        exportDataToExcel({
            data: filtered,
            filename: "egreso-fruta",
            sheetName: "Egreso Fruta",
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
                        <h1 className="text-2xl font-bold leading-tight">Egreso de Fruta</h1>
                        <p className="text-sm text-muted-foreground mt-1">Gestión de salidas de productos</p>
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
                        Nuevo egreso
                    </Button>
                    <EgresoFrutaFormModal
                        open={modalOpen}
                        onClose={() => setModalOpen(false)}
                        onCreated={loadEgresos}
                        tenantId={user.tenantId}
                    />
                </div>
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
                        placeholder="Buscar por producto, cliente, chofer, remito…"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="gap-2">
                    <CardTitle className="flex items-center gap-2">
                        <ArrowUp className="h-5 w-5" />
                        Registros de egreso
                    </CardTitle>
                    <CardDescription>
                        {filtered.length} de {egresos.length} registros
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
                                <Table className="min-w-[960px] text-sm">
                                    <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur">
                                        <TableRow>
                                            <TableHead className="sticky left-0 z-20 bg-background text-center">Fecha</TableHead>
                                            <TableHead className="text-center">Producto</TableHead>
                                            <TableHead className="text-center">Peso neto</TableHead>
                                            <TableHead className="text-center">Cliente</TableHead>
                                            <TableHead className="text-center">Finca</TableHead>
                                            <TableHead className="text-center">Remito</TableHead>
                                            <TableHead className="text-center">Chofer</TableHead>
                                            <TableHead className="text-center">Transporte</TableHead>
                                            <TableHead className="text-center">Chasis</TableHead>
                                            <TableHead className="text-center">Acoplado</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pageRows.map((e) => (
                                            <TableRow key={e.id} className="hover:bg-muted/50">
                                                <TableCell className="sticky left-0 z-10 bg-background whitespace-nowrap py-2 text-center align-middle">
                                                    {e.fecha ? new Date(e.fecha).toLocaleDateString() : ""}
                                                </TableCell>
                                                <TableCell className="py-2 text-center align-middle">{e.producto}</TableCell>
                                                <TableCell className="py-2 text-center align-middle">{e.peso_neto}</TableCell>
                                                <TableCell className="py-2 text-center align-middle">{e.cliente}</TableCell>
                                                <TableCell className="py-2 text-center align-middle">{e.finca}</TableCell>
                                                <TableCell className="py-2 text-center align-middle">{e.num_remito}</TableCell>
                                                <TableCell className="py-2 text-center align-middle">{e.chofer}</TableCell>
                                                <TableCell className="py-2 text-center align-middle">{e.transporte}</TableCell>
                                                <TableCell className="py-2 text-center align-middle">{e.chasis}</TableCell>
                                                <TableCell className="py-2 text-center align-middle">{e.acoplado}</TableCell>
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
                            <ArrowUp className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                            <p className="text-muted-foreground">No se encontraron registros de egreso</p>
                            <p className="text-sm text-muted-foreground">Crea el primero para comenzar</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
