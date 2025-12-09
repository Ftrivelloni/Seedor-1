"use client"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { Plus, X } from "lucide-react"
import type { CreateIngresoFrutaData } from "../../lib/empaque/empaque-service"

const initialState = {
    fecha: "",
    estado_liquidacion: false,
    num_ticket: "",
    num_remito: "",
    productor: "",
    finca: "",
    producto: "",
    lote: "",
    contratista: "",
    tipo_cosecha: "",
    cant_bin: "",
    tipo_bin: "",
    peso_neto: "",
    transporte: "",
    chofer: "",
    chasis: "",
    acoplado: "",
    operario: "",
}

export function IngresoFrutaFormModal({
                                          isOpen,
                                          onClose,
                                          onSubmit,
                                      }: {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: CreateIngresoFrutaData) => void
}) {
    const [form, setForm] = useState(initialState)
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState<{ [key: string]: string }>({})

    const inputBase =
        "h-11 w-full bg-white border border-gray-300/90 rounded-lg shadow-sm placeholder:text-gray-400 " +
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary/60 transition-colors"
    const inputError =
        "border-red-400 ring-1 ring-red-300 focus-visible:ring-red-400 focus-visible:border-red-400"

    const validateField = (name: string, value: string | boolean) => {
        switch (name) {
            case "fecha":
                if (!value) return "La fecha es obligatoria"
                if (typeof value === "string" && !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "Formato de fecha inválido"
                return ""
            case "productor":
            case "producto":
            case "tipo_bin":
                if (!value || (typeof value === "string" && value.trim() === "")) return "Este campo es obligatorio"
                return ""
            case "cant_bin":
                if (!value || isNaN(Number(value)) || Number(value) <= 0 || !Number.isInteger(Number(value)))
                    return "Debe ser un número entero positivo"
                return ""
            case "peso_neto":
                if (!value || isNaN(Number(value)) || Number(value) <= 0) return "Debe ser un número positivo"
                return ""
            case "num_ticket":
            case "num_remito":
            case "lote":
                if (value && (isNaN(Number(value)) || Number(value) <= 0 || !Number.isInteger(Number(value))))
                    return "Debe ser un número entero positivo"
                return ""
            default:
                return ""
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target
        const v = type === "checkbox" ? checked : value
        setForm((prev) => ({ ...prev, [name]: v }))
        setErrors((prev) => ({ ...prev, [name]: validateField(name, v) }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const fields = ["fecha", "productor", "producto", "tipo_bin", "cant_bin", "peso_neto", "num_ticket", "num_remito", "lote"]
        const next: Record<string, string> = {}
        fields.forEach((f) => (next[f] = validateField(f, form[f as keyof typeof form])))
        setErrors(next)
        if (Object.values(next).some(Boolean)) return

        setLoading(true)
        const normInt = (val: string): number | undefined =>
            val === "" ? undefined : parseInt(val, 10)
        const normFloat = (val: string): number | undefined =>
            val === "" ? undefined : Number(val)

        // Convert snake_case form to camelCase API format
        const data: CreateIngresoFrutaData = {
            fecha: form.fecha,
            estadoLiquidacion: form.estado_liquidacion,
            numTicket: normInt(form.num_ticket),
            numRemito: normInt(form.num_remito),
            productor: form.productor,
            finca: form.finca || undefined,
            producto: form.producto,
            lote: form.lote || undefined,
            contratista: form.contratista || undefined,
            tipoCosecha: form.tipo_cosecha || undefined,
            cantBin: normInt(form.cant_bin) ?? 0,
            tipoBin: form.tipo_bin,
            pesoNeto: normFloat(form.peso_neto) ?? 0,
            transporte: form.transporte || undefined,
            chofer: form.chofer || undefined,
            chasis: form.chasis || undefined,
            acoplado: form.acoplado || undefined,
            operario: form.operario || undefined,
        }

        await onSubmit(data)
        setLoading(false)
        setForm(initialState)
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-h-[85vh] max-w-3xl overflow-auto p-0">
                <DialogHeader className="px-6 pt-6">
                    <DialogTitle className="text-2xl">Nuevo Ingreso de Fruta</DialogTitle>
                </DialogHeader>

                <form id="ingreso-fruta-form" onSubmit={handleSubmit} className="space-y-8 px-6 pt-4 pb-28">
                    <fieldset className="rounded-xl border border-gray-300/80 bg-muted/30 p-4">
                        <legend className="px-2 text-base font-semibold">Datos generales</legend>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm font-medium">
                                    Fecha <span className="text-red-500">*</span>
                                </label>
                                <Input type="date" name="fecha" value={form.fecha} onChange={handleChange} className={`${inputBase} ${errors.fecha ? inputError : ""}`} />
                                {errors.fecha && <span className="text-xs text-red-600">{errors.fecha}</span>}
                            </div>

                            <div className="mt-7 flex items-center gap-2 md:mt-7">
                                <input type="checkbox" name="estado_liquidacion" checked={form.estado_liquidacion} onChange={handleChange} className="size-4 accent-primary" />
                                <span className="text-sm">Liquidación</span>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium">N° de ticket</label>
                                <Input name="num_ticket" value={form.num_ticket} onChange={handleChange} type="number" min={1} step={1} onKeyDown={(e) => ["e", "E", "+", "-", "."].includes(e.key) && e.preventDefault()} className={`${inputBase} ${errors.num_ticket ? inputError : ""}`} />
                                {errors.num_ticket && <span className="text-xs text-red-600">{errors.num_ticket}</span>}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium">N° de remito</label>
                                <Input name="num_remito" value={form.num_remito} onChange={handleChange} type="number" min={1} step={1} onKeyDown={(e) => ["e", "E", "+", "-", "."].includes(e.key) && e.preventDefault()} className={`${inputBase} ${errors.num_remito ? inputError : ""}`} />
                                {errors.num_remito && <span className="text-xs text-red-600">{errors.num_remito}</span>}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium">
                                    Productor <span className="text-red-500">*</span>
                                </label>
                                <Input name="productor" value={form.productor} onChange={handleChange} className={`${inputBase} ${errors.productor ? inputError : ""}`} />
                                {errors.productor && <span className="text-xs text-red-600">{errors.productor}</span>}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium">Finca</label>
                                <Input name="finca" value={form.finca} onChange={handleChange} className={inputBase} />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium">
                                    Producto <span className="text-red-500">*</span>
                                </label>
                                <Input name="producto" value={form.producto} onChange={handleChange} className={`${inputBase} ${errors.producto ? inputError : ""}`} />
                                {errors.producto && <span className="text-xs text-red-600">{errors.producto}</span>}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium">Lote</label>
                                <Input name="lote" value={form.lote} onChange={handleChange} type="number" min={1} step={1} onKeyDown={(e) => ["e", "E", "+", "-", "."].includes(e.key) && e.preventDefault()} className={`${inputBase} ${errors.lote ? inputError : ""}`} />
                                {errors.lote && <span className="text-xs text-red-600">{errors.lote}</span>}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium">Contratista</label>
                                <Input name="contratista" value={form.contratista} onChange={handleChange} className={inputBase} />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium">Tipo de cosecha</label>
                                <Input name="tipo_cosecha" value={form.tipo_cosecha} onChange={handleChange} className={inputBase} />
                            </div>
                        </div>
                    </fieldset>

                    <fieldset className="rounded-xl border border-gray-300/80 bg-muted/30 p-4">
                        <legend className="px-2 text-base font-semibold">Transporte</legend>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm font-medium">Transporte</label>
                                <Input name="transporte" value={form.transporte} onChange={handleChange} className={inputBase} />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">Chofer</label>
                                <Input name="chofer" value={form.chofer} onChange={handleChange} className={inputBase} />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">Chasis</label>
                                <Input name="chasis" value={form.chasis} onChange={handleChange} className={inputBase} />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">Acoplado</label>
                                <Input name="acoplado" value={form.acoplado} onChange={handleChange} className={inputBase} />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">Operario</label>
                                <Input name="operario" value={form.operario} onChange={handleChange} className={inputBase} />
                            </div>
                        </div>
                    </fieldset>

                    <fieldset className="rounded-xl border border-gray-300/80 bg-muted/30 p-4">
                        <legend className="px-2 text-base font-semibold">Bins y peso</legend>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm font-medium">
                                    Cantidad de bins <span className="text-red-500">*</span>
                                </label>
                                <Input name="cant_bin" value={form.cant_bin} onChange={handleChange} type="number" onKeyDown={(e) => ["e", "E", "+", "-", "."].includes(e.key) && e.preventDefault()} className={`${inputBase} ${errors.cant_bin ? inputError : ""}`} />
                                {errors.cant_bin && <span className="text-xs text-red-600">{errors.cant_bin}</span>}
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">
                                    Tipo bin <span className="text-red-500">*</span>
                                </label>
                                <Input name="tipo_bin" value={form.tipo_bin} onChange={handleChange} className={`${inputBase} ${errors.tipo_bin ? inputError : ""}`} />
                                {errors.tipo_bin && <span className="text-xs text-red-600">{errors.tipo_bin}</span>}
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">
                                    Peso neto (kg) <span className="text-red-500">*</span>
                                </label>
                                <Input name="peso_neto" value={form.peso_neto} onChange={handleChange} type="number" onKeyDown={(e) => ["e", "E", "+", "-", "."].includes(e.key) && e.preventDefault()} className={`${inputBase} ${errors.peso_neto ? inputError : ""}`} />
                                {errors.peso_neto && <span className="text-xs text-red-600">{errors.peso_neto}</span>}
                            </div>
                        </div>
                    </fieldset>
                </form>

                <div className="sticky bottom-0 z-50 w-full border-t bg-background px-6 py-3 shadow-[0_-6px_12px_-6px_rgba(0,0,0,0.08)]">
                    <div className="flex items-center justify-end gap-2">
                        <Button type="button" variant="outline" onClick={onClose} className="h-10">
                            <X className="mr-2 h-4 w-4" />
                            Cancelar
                        </Button>
                        <Button type="submit" form="ingreso-fruta-form" className="h-10" disabled={loading}>
                            <Plus className="mr-2 h-4 w-4" />
                            {loading ? "Guardando..." : "Guardar"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
