// components/empaque/empaque-page.tsx
"use client"

import { supabase } from "../../lib/supabaseClient";
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { empaqueApi, ingresoFrutaApi, palletsApi, despachoApi } from "../../lib/api"
import { authService } from "../../lib/supabaseAuth"
import { useUser } from "../auth/UserContext"
import { useAuth } from "../../hooks/use-auth"
import type { RegistroEmpaque } from "../../lib/mocks"
import { Search, Package, AlertTriangle, ArrowDown, Cog, Archive, Truck, ArrowUp } from "lucide-react"

export function EmpaquePage() {
    // Use the layout's authentication instead of a direct approach
    const { user, loading } = useAuth({
        redirectToLogin: false, // Let the parent layout handle redirects
        requireRoles: ["Admin", "Empaque"],
        useLayoutSession: true // Use parent layout's authentication
    });

    const [registros, setRegistros] = useState<RegistroEmpaque[]>([])
    const [filteredRegistros, setFilteredRegistros] = useState<RegistroEmpaque[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    // Filtro y datos para la tabla de ingreso de fruta
    const [filtroFecha, setFiltroFecha] = useState("");
    const [ingresosFruta, setIngresosFruta] = useState<any[]>([]);
    const [pallets, setPallets] = useState<any[]>([]);
    const [isLoadingPallets, setIsLoadingPallets] = useState(true);
    const [isLoadingIngresos, setIsLoadingIngresos] = useState(true);
    const [despachos, setDespachos] = useState<any[]>([]);
    const [isLoadingDespachos, setIsLoadingDespachos] = useState(true);
    const [egresosFruta, setEgresosFruta] = useState<any[]>([]);
    const [isLoadingEgresosFruta, setIsLoadingEgresosFruta] = useState(true);

    // Estado para preprocesos
    const [preprocesos, setPreprocesos] = useState<any[]>([]);
    const [isLoadingPreprocesos, setIsLoadingPreprocesos] = useState(true);

    const router = useRouter()

    useEffect(() => {
        if (user) {
            loadRegistros();
            loadIngresosFruta();
            loadPallets();
            loadDespachos();
            loadEgresosFruta();
            loadPreprocesos();
        }

        // Escuchar evento global para recargar preprocesos
        const handler = () => { loadPreprocesos(); };
        window.addEventListener('preproceso:created', handler);
        return () => {
            window.removeEventListener('preproceso:created', handler);
        };
    }, [user])
    // Cargar preprocesos desde Supabase
    const loadPreprocesos = async () => {
        if (!user?.tenantId) {
            console.error('No se encontró la sesión del usuario o el tenant ID');
            return;
        }

        try {
            setIsLoadingPreprocesos(true);
            const { data, error } = await supabase
                .from("preseleccion")
                .select("*")
                .eq("tenant_id", user.tenantId);
            if (error) {
                console.error("Error al cargar preprocesos:", error);
                setPreprocesos([]);
            } else {
                setPreprocesos(data || []);
            }
        } catch (error) {
            console.error("Error al cargar preprocesos:", error);
            setPreprocesos([]);
        } finally {
            setIsLoadingPreprocesos(false);
        }
    };

    const loadIngresosFruta = async () => {
        if (!user?.tenantId) return;
        try {
            setIsLoadingIngresos(true);
            const data = await ingresoFrutaApi.getIngresos(user.tenantId);
            setIngresosFruta(data);
        } catch (e) {
            setIngresosFruta([]);
        } finally {
            setIsLoadingIngresos(false);
        }
    };

    const loadPallets = async () => {
        if (!user?.tenantId) return;
        try {
            setIsLoadingPallets(true);
            const { data, error } = await supabase
                .from("pallets")
                .select("*")
                .eq("tenant_id", user.tenantId);
            if (error) {
                console.error("Error al cargar pallets:", error);
                setPallets([]);
            } else {
                setPallets(data || []);
            }
        } catch (error) {
            console.error("Error al cargar pallets:", error);
            setPallets([]);
        } finally {
            setIsLoadingPallets(false);
        }
    };

    const loadDespachos = async () => {
        if (!user?.tenantId) return;
        try {
            setIsLoadingDespachos(true);
            const { data, error } = await supabase
                .from("despacho")
                .select("*")
                .eq("tenant_id", user.tenantId);
            if (error) {
                console.error("Error al cargar despachos:", error);
                setDespachos([]);
            } else {
                setDespachos(data || []);
            }
        } catch (error) {
            console.error("Error al cargar despachos:", error);
            setDespachos([]);
        } finally {
            setIsLoadingDespachos(false);
        }
    };

    const loadEgresosFruta = async () => {
        if (!user?.tenantId) return;
        try {
            setIsLoadingEgresosFruta(true);
            const { data, error } = await supabase
                .from("egreso_fruta")
                .select("*")
                .eq("tenant_id", user.tenantId);
            if (error) {
                console.error("Error al cargar egresos de fruta:", error);
                setEgresosFruta([]);
            } else {
                setEgresosFruta(data || []);
            }
        } catch (error) {
            console.error("Error al cargar egresos de fruta:", error);
            setEgresosFruta([]);
        } finally {
            setIsLoadingEgresosFruta(false);
        }
    };

    useEffect(() => {
        applyFilters()
    }, [registros, searchTerm])

    const loadRegistros = async () => {
        if (!user?.tenantId) return

        try {
            setIsLoading(true)
            const data = await empaqueApi.getRegistros(user.tenantId)
            setRegistros(data)
        } catch (error) {
            console.error("Error al cargar registros:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const applyFilters = () => {
        let filtered = registros

        if (searchTerm) {
            filtered = filtered.filter(
                (registro) =>
                    registro.cultivo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    registro.notas?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    registro.fecha.includes(searchTerm),
            )
        }

        // Sort by date (most recent first)
        filtered = filtered.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

        setFilteredRegistros(filtered)
    }

    const navigateToSubpage = (subpage: string) => {
        router.push(`/empaque/${subpage}`)
    }

    // Calculate statistics
    const totalKgEntraron = registros.reduce((sum, r) => sum + r.kgEntraron, 0)
    const totalKgSalieron = registros.reduce((sum, r) => sum + r.kgSalieron, 0)
    const totalKgDescartados = registros.reduce((sum, r) => sum + r.kgDescartados, 0)
    const porcentajeDescartePromedio = totalKgEntraron > 0 ? (totalKgDescartados / totalKgEntraron) * 100 : 0

    // Show loading while user is being loaded
    if (loading || !user) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (!['Admin', 'Empaque'].includes(user.rol)) {
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
                        <h1 className="text-xl font-semibold">Gestión de Empaque</h1>
                        <p className="text-sm text-muted-foreground">Registros de procesamiento de fruta - {user?.tenant?.name || 'Tu Empresa'}</p>
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

            {/* Botones de navegación de módulos */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 my-8">
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigateToSubpage('ingreso-fruta')}>
                    <CardContent className="p-4 text-center">
                        <ArrowDown className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                        <h3 className="font-medium">Ingreso Fruta</h3>
                        <p className="text-xs text-muted-foreground">Recepción de materia prima</p>
                    </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigateToSubpage('preproceso')}>
                    <CardContent className="p-4 text-center">
                        <Cog className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                        <h3 className="font-medium">Preproceso</h3>
                        <p className="text-xs text-muted-foreground">Preparación y limpieza</p>
                    </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigateToSubpage('pallets')}>
                    <CardContent className="p-4 text-center">
                        <Archive className="h-8 w-8 mx-auto mb-2 text-green-600" />
                        <h3 className="font-medium">Pallets</h3>
                        <p className="text-xs text-muted-foreground">Gestión de pallets</p>
                    </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigateToSubpage('despacho')}>
                    <CardContent className="p-4 text-center">
                        <Truck className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                        <h3 className="font-medium">Despacho</h3>
                        <p className="text-xs text-muted-foreground">Envío a clientes</p>
                    </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigateToSubpage('egreso-fruta')}>
                    <CardContent className="p-4 text-center">
                        <ArrowUp className="h-8 w-8 mx-auto mb-2 text-red-600" />
                        <h3 className="font-medium">Egreso Fruta</h3>
                        <p className="text-xs text-muted-foreground">Salida de productos</p>
                    </CardContent>
                </Card>
            </div>

            {/* Header de resumen */}
            <h2 className="text-xl font-bold mt-10 mb-4">Resumen</h2>

            {/* EmpaqueFlow inserted here */}
            <EmpaqueFlow
                ingresosFruta={ingresosFruta}
                preprocesos={preprocesos}
                pallets={pallets}
                despachos={despachos}
                egresosFruta={egresosFruta}
            />

            {/* Resúmenes informativos de cada módulo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Ingreso de Fruta - tabla filtrable por fecha (Supabase) */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <ArrowDown className="h-5 w-5 text-blue-600" />
                            <span>Ingreso de Fruta</span>
                        </CardTitle>
                        <CardDescription>Filtrar ingresos por fecha</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-6 flex items-center gap-2">
                            <label htmlFor="filtro-fecha" className="text-sm">Fecha:</label>
                            <input
                                id="filtro-fecha"
                                type="date"
                                className="border rounded px-2 py-1 text-sm"
                                value={filtroFecha}
                                onChange={e => setFiltroFecha(e.target.value)}
                                max={new Date().toISOString().split("T")[0]}
                            />
                            {filtroFecha && (
                                <Button size="sm" variant="ghost" onClick={() => setFiltroFecha("")}>Limpiar</Button>
                            )}
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm border border-gray-200 rounded-lg bg-white">
                                <thead>
                                <tr className="bg-gray-50 text-muted-foreground">
                                    <th className="text-left px-4 py-2 border-b font-semibold">Fecha</th>
                                    <th className="text-left px-4 py-2 border-b font-semibold">Productor</th>
                                    <th className="text-left px-4 py-2 border-b font-semibold">Producto</th>
                                    <th className="text-left px-4 py-2 border-b font-semibold">Lote</th>
                                    <th className="text-right px-4 py-2 border-b font-semibold">Cantidad Bins</th>
                                    <th className="text-right px-4 py-2 border-b font-semibold">Peso Neto</th>
                                </tr>
                                </thead>
                                <tbody>
                                {isLoadingIngresos ? (
                                    <tr><td colSpan={6} className="text-center text-muted-foreground px-4 py-4">Cargando...</td></tr>
                                ) : (
                                    ingresosFruta
                                        .filter(r => !filtroFecha || (r.fecha && r.fecha.startsWith(filtroFecha)))
                                        .slice(0, 10)
                                        .map((r, idx) => (
                                            <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                                <td className="px-4 py-2 border-b">{r.fecha ? new Date(r.fecha).toLocaleDateString() : "-"}</td>
                                                <td className="px-4 py-2 border-b">{r.productor ?? "-"}</td>
                                                <td className="px-4 py-2 border-b">{r.producto ?? "-"}</td>
                                                <td className="px-4 py-2 border-b">{r.lote ?? "-"}</td>
                                                <td className="px-4 py-2 border-b text-right">{r.cant_bin ?? "-"}</td>
                                                <td className="px-4 py-2 border-b text-right">{r.peso_neto ? `${r.peso_neto} kg` : "-"}</td>
                                            </tr>
                                        ))
                                )}
                                {!isLoadingIngresos && ingresosFruta.filter(r => !filtroFecha || (r.fecha && r.fecha.startsWith(filtroFecha))).length === 0 && (
                                    <tr><td colSpan={6} className="text-center text-muted-foreground px-4 py-4">Sin registros</td></tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Preproceso */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Cog className="h-5 w-5 text-orange-600" />
                            <span>Preproceso</span>
                        </CardTitle>
                        <CardDescription>Resumen de preparación y limpieza</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoadingPreprocesos ? (
                            <div className="text-muted-foreground">Cargando...</div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <div><span className="font-medium">Total procesado:</span> {preprocesos.reduce((sum, p) => sum + (p.bin_volcados || 0), 0).toLocaleString()} bins</div>
                                <div><span className="font-medium">Última fecha:</span> {preprocesos.length > 0 ? new Date(preprocesos[0].fecha).toLocaleDateString() : '-'}</div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pallets */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Archive className="h-5 w-5 text-green-600" />
                            <span>Pallets</span>
                        </CardTitle>
                        <CardDescription>Resumen de pallets</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-2">
                            <div><span className="font-medium">Total empacado:</span> {pallets.reduce((sum, p) => sum + (p.peso || p.kilos || 0), 0).toLocaleString()} kg</div>
                            <div><span className="font-medium">Total pallets:</span> {pallets.length}</div>
                            <div><span className="font-medium">Última fecha:</span> {pallets.length > 0 ? new Date(pallets[0].created_at).toLocaleDateString() : '-'}</div>
                        </div>
                    </CardContent>
                </Card>

                {/* Despacho */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Truck className="h-5 w-5 text-purple-600" />
                            <span>Despacho</span>
                        </CardTitle>
                        <CardDescription>Resumen de envíos recientes</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-2">
                            <div><span className="font-medium">Total despachado:</span> {despachos.reduce((sum, d) => sum + (d.total_cajas || 0), 0).toLocaleString()} cajas</div>
                            <div><span className="font-medium">Total pallets:</span> {despachos.reduce((sum, d) => sum + (d.total_pallets || 0), 0)}</div>
                            <div><span className="font-medium">Última fecha:</span> {despachos.length > 0 ? new Date(despachos[0].created_at).toLocaleDateString() : '-'}</div>
                        </div>
                    </CardContent>
                </Card>

                {/* Egreso de Fruta */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <ArrowUp className="h-5 w-5 text-red-600" />
                            <span>Egreso de Fruta</span>
                        </CardTitle>
                        <CardDescription>Resumen de salidas</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-2">
                            <div><span className="font-medium">Total enviado:</span> {egresosFruta.reduce((sum, e) => sum + (e.peso_neto || 0), 0).toLocaleString()} kg</div>
                            <div><span className="font-medium">Total egresos:</span> {egresosFruta.length}</div>
                            <div><span className="font-medium">Última fecha:</span> {egresosFruta.length > 0 ? new Date(egresosFruta[0].created_at).toLocaleDateString() : '-'}</div>
                        </div>
                    </CardContent>
                </Card>
            </div>
                </div>
            </main>
        </div>
    )
}

/* -------------------------------------------------------------------------- */
/*                             EmpaqueFlow Component                           */
/* -------------------------------------------------------------------------- */
export function EmpaqueFlow(props: {
    ingresosFruta: any[];
    preprocesos: any[];
    pallets: any[];
    despachos: any[];
    egresosFruta: any[];
}) {
    const { ingresosFruta, preprocesos, pallets, despachos, egresosFruta } = props;

    const [RechartsComponents, setRechartsComponents] = useState<any | null>(null);
    useEffect(() => {
        let mounted = true;
        import("recharts")
            .then((mod) => {
                if (!mounted) return;
                setRechartsComponents({
                    ResponsiveContainer: mod.ResponsiveContainer,
                    BarChart: mod.BarChart,
                    Bar: mod.Bar,
                    XAxis: mod.XAxis,
                    YAxis: mod.YAxis,
                    Tooltip: mod.Tooltip,
                    Cell: mod.Cell,
                });
            })
            .catch(() => setRechartsComponents(null));
        return () => { mounted = false; };
    }, []);

    const sums = useMemo(() => {
        const sum = (arr: number[]) => arr.reduce((s, v) => s + (Number(v) || 0), 0);

        const kgIngresados = sum(ingresosFruta.map((r: any) => Number(r.peso_neto) || 0));
        const binsIngresados = sum(ingresosFruta.map((r: any) => Number(r.cant_bin) || 0));

        const binsPreproceso = sum(
            preprocesos.map((p: any) =>
                (Number(p.bin_pleno) || 0) + (Number(p.bin_intermedio_I) || 0) + (Number(p.bin_intermedio_II) || 0) + (Number(p.bin_incipiente) || 0)
            )
        );
        const binVolcados = sum(preprocesos.map((p: any) => Number(p.bin_volcados) || 0));
        const kgPallets = sum(pallets.map((p: any) => Number(p.kilos ?? p.peso ?? p.pesoTotal) || 0));
        const palletsDespachados = pallets.filter((p: any) => p.estado === "despachado");
        const kgDespachadoFallback = sum(palletsDespachados.map((p: any) => Number(p.kilos ?? p.peso ?? p.pesoTotal) || 0));

        const kgFromDespachos = sum(despachos.map((d: any) => Number(d.kilos ?? d.total_kilos ?? 0) || 0));
        const totalPalletsFromDespachos = despachos.reduce((s, d: any) => s + (Number(d.total_pallets || 0) || 0), 0);
        const totalCajasFromDespachos = despachos.reduce((s, d: any) => s + (Number(d.total_cajas || 0) || 0), 0);

        const kgDespacho = kgFromDespachos || kgDespachadoFallback || 0;
        const kgEgresado = sum(egresosFruta.map((e: any) => Number(e.peso_neto) || 0));

        return {
            kgIngresados,
            binsIngresados,
            binsPreproceso,
            binVolcados,
            kgPallets,
            kgDespachadoFallback,
            kgFromDespachos,
            kgDespacho,
            totalPalletsFromDespachos,
            totalCajasFromDespachos,
            kgEgresado,
            palletsCount: pallets.length,
        };
    }, [ingresosFruta, preprocesos, pallets, despachos, egresosFruta]);

    const pct = (num: number, den: number) => (den > 0 ? Math.max(0, Math.min(100, (num / den) * 100)) : 0);

    const flags = useMemo(() => {
        const f: Record<string, string | null> = { ingreso: null, preproceso: null, pallets: null, despacho: null, egreso: null };

        if (sums.binsIngresados > 0 && sums.binsPreproceso < sums.binsIngresados * 0.9) f.preproceso = "En cola";
        if (sums.kgPallets + 1 < sums.kgIngresados && sums.binsPreproceso >= Math.floor(sums.binsIngresados * 0.8)) f.pallets = "Atrasado";
        if (sums.kgDespacho + 1 < sums.kgPallets) f.despacho = "Pendiente";
        if (sums.kgEgresado + 1 < sums.kgDespacho) f.egreso = "Pendiente";

        return f;
    }, [sums]);

    const kpis = useMemo(() => {
        const pctPaletizado = pct(sums.kgPallets, sums.kgIngresados);
        const pctDespachadoVsPalet = pct(sums.kgDespacho, sums.kgPallets);
        const pctEgresadoVsIngreso = pct(sums.kgEgresado, sums.kgIngresados);
        return { pctPaletizado, pctDespachadoVsPalet, pctEgresadoVsIngreso };
    }, [sums]);

    const steps = useMemo(() => {
        const ingresoMain = sums.kgIngresados;
        return [
            {
                key: "ingreso",
                title: "Ingreso",
                icon: ArrowDown,
                mainKg: sums.kgIngresados,
                altUnits: sums.binsIngresados,
                pctAgainstIngreso: 100,
                flag: null,
            },
            {
                key: "preproceso",
                title: "Preproceso",
                icon: Cog,
                mainKg: null,
                altUnits: sums.binsPreproceso,
                binVolcados: sums.binVolcados,
                pctAgainstIngreso: pct(sums.binsPreproceso, Math.max(1, sums.binsIngresados)),
                flag: flags.preproceso,
            },
            {
                key: "pallets",
                title: "Pallets",
                icon: Archive,
                mainKg: sums.kgPallets,
                altUnits: sums.palletsCount,
                pctAgainstIngreso: pct(sums.kgPallets, ingresoMain),
                flag: flags.pallets,
            },
            {
                key: "despacho",
                title: "Despacho",
                icon: Truck,
                mainKg: sums.kgFromDespachos || sums.kgDespachadoFallback || null,
                altUnits: sums.totalPalletsFromDespachos || sums.totalCajasFromDespachos || null,
                pctAgainstIngreso: pct(sums.kgFromDespachos || sums.kgDespachadoFallback, ingresoMain),
                flag: flags.despacho,
            },
            {
                key: "egreso",
                title: "Egreso",
                icon: ArrowUp,
                mainKg: sums.kgEgresado,
                altUnits: null,
                pctAgainstIngreso: pct(sums.kgEgresado, ingresoMain),
                flag: flags.egreso,
            },
        ];
    }, [sums, flags]);

    const fmtKg = (v: number | null | undefined) => (v == null ? "-" : `${Number(v).toLocaleString()} kg`);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between gap-4 w-full">
                    <div>
                        <CardTitle className="text-base">Flujo de Empaque</CardTitle>
                        <CardDescription>Visión global: Ingreso → Preproceso → Pallets → Despacho → Egreso</CardDescription>
                    </div>

                    <div className="flex gap-4 text-sm">
                        <div className="text-xs text-muted-foreground">
                            % paletizado vs ingreso: <strong>{kpis.pctPaletizado.toFixed(0)}%</strong>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            % despachado vs paletizado: <strong>{kpis.pctDespachadoVsPalet.toFixed(0)}%</strong>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            % egresado vs ingreso: <strong>{kpis.pctEgresadoVsIngreso.toFixed(0)}%</strong>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-5 mb-4">
                    {steps.map((s) => {
                        const Icon = s.icon;
                        const pctValue = typeof s.pctAgainstIngreso === "number" ? Math.round(s.pctAgainstIngreso) : 0;
                        return (
                            <div key={s.key} className="rounded-lg border p-3 bg-muted/30">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Icon className="h-4 w-4" />
                                        <div className="text-sm font-medium">{s.title}</div>
                                    </div>
                                    <div>
                                        {s.flag ? <Badge className="text-xs">{s.flag}</Badge> : <Badge variant="outline" className="text-xs">OK</Badge>}
                                    </div>
                                </div>

                                <div className="mb-2">
                                    <div className="text-lg font-bold">{s.mainKg != null ? fmtKg(s.mainKg) : (s.altUnits != null ? `${s.altUnits} units` : "-")}</div>
                                    {s.key === "preproceso" && (s as any).binVolcados ? (
                                        <div className="text-xs text-muted-foreground">Volcados: {(s as any).binVolcados}</div>
                                    ) : null}
                                </div>

                                <div className="mb-1 text-xs text-muted-foreground flex items-center justify-between">
                                    <span title="(value / ingreso) * 100">% vs ingreso</span>
                                    <span className="font-mono">{pctValue}%</span>
                                </div>

                                <div className="h-2 w-full rounded bg-gray-200 dark:bg-muted">
                                    <div className={`h-2 rounded bg-primary transition-all`} style={{ width: `${pctValue}%` }} />
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-4">
                    {RechartsComponents ? (
                        <div className="h-40">
                            <RechartsComponents.ResponsiveContainer width="100%" height="100%">
                                <RechartsComponents.BarChart
                                    data={[
                                        { name: "Ingreso", value: sums.kgIngresados },
                                        { name: "Preproceso", value: sums.kgIngresados ? nullToZeroFromBins(sums.binsPreproceso, sums.binsIngresados, sums.kgIngresados) : 0 },
                                        { name: "Pallets", value: sums.kgPallets },
                                        { name: "Despacho", value: sums.kgDespacho },
                                        { name: "Egreso", value: sums.kgEgresado },
                                    ]}
                                >
                                    <RechartsComponents.XAxis dataKey="name" />
                                    <RechartsComponents.YAxis />
                                    <RechartsComponents.Tooltip formatter={(v: any) => (v ? `${Number(v).toLocaleString()} kg` : "N/A")} />
                                    <RechartsComponents.Bar dataKey="value" fill="#60a5fa" />
                                </RechartsComponents.BarChart>
                            </RechartsComponents.ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="mt-3 grid grid-cols-1 gap-2">
                            <div className="text-xs text-muted-foreground">Chart unavailable. Showing compact bars:</div>
                            {[
                                ["Ingreso", sums.kgIngresados],
                                ["Preproceso", sums.kgIngresados ? nullToZeroFromBins(sums.binsPreproceso, sums.binsIngresados, sums.kgIngresados) : 0],
                                ["Pallets", sums.kgPallets],
                                ["Despacho", sums.kgDespacho],
                                ["Egreso", sums.kgEgresado],
                            ].map(([name, val]: any, i: number) => {
                                const v = Number(val || 0);
                                const w = sums.kgIngresados > 0 ? Math.round((v / sums.kgIngresados) * 100) : 0;
                                return (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-24 text-sm">{name}</div>
                                        <div className="h-2 flex-1 rounded bg-gray-200">
                                            <div className="h-2 rounded bg-green-400" style={{ width: `${w}%` }} />
                                        </div>
                                        <div className="w-20 text-right text-sm font-mono">{v.toLocaleString()} kg</div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );

    function nullToZeroFromBins(binsValue: number, binsIngreso: number, kgIngreso: number) {
        if (kgIngreso > 0 && binsIngreso > 0) {
            return Math.round((binsValue / binsIngreso) * kgIngreso);
        }
        return 0;
    }
}
