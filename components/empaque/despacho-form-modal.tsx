// components/empaque/despacho-form-modal.tsx
"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Plus, X } from "lucide-react";

interface Props {
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
    tenantId: string;
}

type FormState = {
    fecha: string;
    num_remito: string;
    cliente: string;
    DTV: string;
    codigo_cierre: string;
    termografo: string;
    DTC: string;
    destino: string;
    transporte: string;
    total_pallets: string;
    total_cajas: string;
    cuit: string;
    chasis: string;
    acoplado: string;
    chofer: string;
    dni: string;
    celular: string;
    operario: string;
};

const initialState: FormState = {
    fecha: "",
    num_remito: "",
    cliente: "",
    DTV: "",
    codigo_cierre: "",
    termografo: "",
    DTC: "",
    destino: "",
    transporte: "",
    total_pallets: "",
    total_cajas: "",
    cuit: "",
    chasis: "",
    acoplado: "",
    chofer: "",
    dni: "",
    celular: "",
    operario: "",
};

export default function DespachoFormModal({
                                              open,
                                              onClose,
                                              onCreated,
                                              tenantId,
                                          }: Props) {
    const [form, setForm] = useState<FormState>(initialState);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const inputStrong =
        "h-11 w-full bg-white border border-gray-300/90 rounded-lg shadow-sm placeholder:text-gray-400 " +
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary/60 transition-colors";
    const inputError =
        "border-red-400 ring-1 ring-red-300 focus-visible:ring-red-400 focus-visible:border-red-400";

    const setField = (name: keyof FormState, value: string) => {
        setForm((prev) => ({ ...prev, [name]: value }));
        const msg = validateField(name, value);
        setErrors((prev) => ({ ...prev, [name]: msg }));
    };

    const blockInvalidNumberKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
    };

    const validateField = (name: keyof FormState, value: string): string => {
        const req = (v: string) => (!v || v.trim() === "" ? "Campo obligatorio" : "");
        const isInt = (v: string) =>
            v === "" || !Number.isInteger(Number(v)) || Number(v) < 0
                ? "Debe ser un entero ≥ 0"
                : "";
        switch (name) {
            case "fecha":
            case "cliente":
            case "destino":
                return req(value);
            case "num_remito":
            case "codigo_cierre":
            case "total_pallets":
            case "total_cajas":
            case "dni":
                return value === "" ? "" : isInt(value);
            default:
                return "";
        }
    };

    const validateAll = () => {
        const fields = Object.keys(form) as (keyof FormState)[];
        const next: Record<string, string> = {};
        fields.forEach((f) => (next[f] = validateField(f, form[f])));
        next.fecha ||= validateField("fecha", form.fecha);
        next.cliente ||= validateField("cliente", form.cliente);
        next.destino ||= validateField("destino", form.destino);
        setErrors(next);
        return Object.values(next).every((m) => !m);
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateAll()) return;
        setLoading(true);

        const toInt = (v: string) => (v === "" ? null : parseInt(v, 10));
        const payload = {
            tenant_id: tenantId,
            fecha: form.fecha ? new Date(form.fecha).toISOString() : null,
            num_remito: toInt(form.num_remito),
            cliente: form.cliente || null,
            DTV: form.DTV || null,
            codigo_cierre: toInt(form.codigo_cierre),
            termografo: form.termografo || null,
            DTC: form.DTC || null,
            destino: form.destino || null,
            transporte: form.transporte || null,
            total_pallets: toInt(form.total_pallets),
            total_cajas: toInt(form.total_cajas),
            cuit: form.cuit || null,
            chasis: form.chasis || null,
            acoplado: form.acoplado || null,
            chofer: form.chofer || null,
            dni: toInt(form.dni),
            celular: form.celular || null,
            operario: form.operario || null,
        };

        const { error } = await supabase.from("despacho").insert([payload]);
        setLoading(false);

        if (error) {
            alert("Error al guardar: " + error.message);
            return;
        }
        onCreated();
        onClose();
        setForm(initialState);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-h-[85vh] w-full max-w-3xl overflow-auto p-0">
                <DialogHeader className="px-6 pt-6">
                    <DialogTitle className="text-2xl">Nuevo despacho</DialogTitle>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-8 px-6 pb-28 pt-4">
                    <section className="rounded-xl border border-gray-300/80 bg-muted/30 p-4">
                        <h3 className="mb-3 text-base font-semibold">Datos del envío</h3>
                        <div className="grid gap-5 sm:grid-cols-2">
                            <div>
                                <Label className="mb-1 block text-sm font-medium">
                                    Fecha <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    name="fecha"
                                    type="date"
                                    value={form.fecha}
                                    onChange={(e) => setField("fecha", e.target.value)}
                                    className={`${inputStrong} ${errors.fecha ? inputError : ""}`}
                                />
                                {errors.fecha && (
                                    <p className="mt-1 text-xs text-red-600">{errors.fecha}</p>
                                )}
                            </div>

                            <div>
                                <Label className="mb-1 block text-sm font-medium">N° remito</Label>
                                <Input
                                    name="num_remito"
                                    type="number"
                                    inputMode="numeric"
                                    onKeyDown={blockInvalidNumberKeys}
                                    value={form.num_remito}
                                    onChange={(e) => setField("num_remito", e.target.value)}
                                    className={`${inputStrong} ${errors.num_remito ? inputError : ""}`}
                                    placeholder="Ej: 12450"
                                />
                                {errors.num_remito && (
                                    <p className="mt-1 text-xs text-red-600">{errors.num_remito}</p>
                                )}
                            </div>

                            <div className="sm:col-span-2">
                                <Label className="mb-1 block text-sm font-medium">
                                    Cliente <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    name="cliente"
                                    value={form.cliente}
                                    onChange={(e) => setField("cliente", e.target.value)}
                                    className={`${inputStrong} ${errors.cliente ? inputError : ""}`}
                                    placeholder="Ej: FrutExport SA"
                                />
                                {errors.cliente && (
                                    <p className="mt-1 text-xs text-red-600">{errors.cliente}</p>
                                )}
                            </div>

                            <div>
                                <Label className="mb-1 block text-sm font-medium">Destino <span className="text-red-500">*</span></Label>
                                <Input
                                    name="destino"
                                    value={form.destino}
                                    onChange={(e) => setField("destino", e.target.value)}
                                    className={`${inputStrong} ${errors.destino ? inputError : ""}`}
                                    placeholder="Ej: Mercado Central / Exportación"
                                />
                                {errors.destino && (
                                    <p className="mt-1 text-xs text-red-600">{errors.destino}</p>
                                )}
                            </div>

                            <div>
                                <Label className="mb-1 block text-sm font-medium">DTV</Label>
                                <Input
                                    name="DTV"
                                    value={form.DTV}
                                    onChange={(e) => setField("DTV", e.target.value)}
                                    className={inputStrong}
                                    placeholder="Documento de Tránsito Vegetal"
                                />
                            </div>

                            <div>
                                <Label className="mb-1 block text-sm font-medium">DTC</Label>
                                <Input
                                    name="DTC"
                                    value={form.DTC}
                                    onChange={(e) => setField("DTC", e.target.value)}
                                    className={inputStrong}
                                    placeholder="Documento de Tránsito (opcional)"
                                />
                            </div>

                            <div>
                                <Label className="mb-1 block text-sm font-medium">Termógrafo</Label>
                                <Input
                                    name="termografo"
                                    value={form.termografo}
                                    onChange={(e) => setField("termografo", e.target.value)}
                                    className={inputStrong}
                                    placeholder="Código o número"
                                />
                            </div>

                            <div>
                                <Label className="mb-1 block text-sm font-medium">Código de cierre</Label>
                                <Input
                                    name="codigo_cierre"
                                    type="number"
                                    inputMode="numeric"
                                    onKeyDown={blockInvalidNumberKeys}
                                    value={form.codigo_cierre}
                                    onChange={(e) => setField("codigo_cierre", e.target.value)}
                                    className={`${inputStrong} ${errors.codigo_cierre ? inputError : ""}`}
                                    placeholder="Ej: 778912"
                                />
                                {errors.codigo_cierre && (
                                    <p className="mt-1 text-xs text-red-600">{errors.codigo_cierre}</p>
                                )}
                            </div>
                        </div>
                    </section>

                    <section className="rounded-xl border border-gray-300/80 bg-muted/30 p-4">
                        <h3 className="mb-3 text-base font-semibold">Transporte y chofer</h3>
                        <div className="grid gap-5 sm:grid-cols-2">
                            <div>
                                <Label className="mb-1 block text-sm font-medium">Transporte</Label>
                                <Input
                                    name="transporte"
                                    value={form.transporte}
                                    onChange={(e) => setField("transporte", e.target.value)}
                                    className={inputStrong}
                                    placeholder="Empresa transportista"
                                />
                            </div>
                            <div>
                                <Label className="mb-1 block text-sm font-medium">Chofer</Label>
                                <Input
                                    name="chofer"
                                    value={form.chofer}
                                    onChange={(e) => setField("chofer", e.target.value)}
                                    className={inputStrong}
                                />
                            </div>

                            <div>
                                <Label className="mb-1 block text-sm font-medium">CUIT</Label>
                                <Input
                                    name="cuit"
                                    value={form.cuit}
                                    onChange={(e) => setField("cuit", e.target.value)}
                                    className={inputStrong}
                                    placeholder="Ej: 30-12345678-9"
                                />
                            </div>

                            <div>
                                <Label className="mb-1 block text-sm font-medium">DNI chofer</Label>
                                <Input
                                    name="dni"
                                    type="number"
                                    inputMode="numeric"
                                    onKeyDown={blockInvalidNumberKeys}
                                    value={form.dni}
                                    onChange={(e) => setField("dni", e.target.value)}
                                    className={`${inputStrong} ${errors.dni ? inputError : ""}`}
                                />
                                {errors.dni && (
                                    <p className="mt-1 text-xs text-red-600">{errors.dni}</p>
                                )}
                            </div>

                            <div>
                                <Label className="mb-1 block text-sm font-medium">Celular</Label>
                                <Input
                                    name="celular"
                                    value={form.celular}
                                    onChange={(e) => setField("celular", e.target.value)}
                                    className={inputStrong}
                                    placeholder="+54 9 ..."
                                />
                            </div>

                            <div>
                                <Label className="mb-1 block text-sm font-medium">Chasis</Label>
                                <Input
                                    name="chasis"
                                    value={form.chasis}
                                    onChange={(e) => setField("chasis", e.target.value)}
                                    className={inputStrong}
                                />
                            </div>

                            <div>
                                <Label className="mb-1 block text-sm font-medium">Acoplado</Label>
                                <Input
                                    name="acoplado"
                                    value={form.acoplado}
                                    onChange={(e) => setField("acoplado", e.target.value)}
                                    className={inputStrong}
                                />
                            </div>
                        </div>
                    </section>

                    <section className="rounded-xl border border-gray-300/80 bg-muted/30 p-4">
                        <h3 className="mb-3 text-base font-semibold">Totales y control</h3>
                        <div className="grid gap-5 sm:grid-cols-3">
                            <div>
                                <Label className="mb-1 block text-sm font-medium">Total pallets</Label>
                                <Input
                                    name="total_pallets"
                                    type="number"
                                    inputMode="numeric"
                                    onKeyDown={blockInvalidNumberKeys}
                                    value={form.total_pallets}
                                    onChange={(e) => setField("total_pallets", e.target.value)}
                                    className={`${inputStrong} ${errors.total_pallets ? inputError : ""}`}
                                    placeholder="Ej: 24"
                                />
                                {errors.total_pallets && (
                                    <p className="mt-1 text-xs text-red-600">{errors.total_pallets}</p>
                                )}
                            </div>

                            <div>
                                <Label className="mb-1 block text-sm font-medium">Total cajas</Label>
                                <Input
                                    name="total_cajas"
                                    type="number"
                                    inputMode="numeric"
                                    onKeyDown={blockInvalidNumberKeys}
                                    value={form.total_cajas}
                                    onChange={(e) => setField("total_cajas", e.target.value)}
                                    className={`${inputStrong} ${errors.total_cajas ? inputError : ""}`}
                                    placeholder="Ej: 1440"
                                />
                                {errors.total_cajas && (
                                    <p className="mt-1 text-xs text-red-600">{errors.total_cajas}</p>
                                )}
                            </div>

                            <div>
                                <Label className="mb-1 block text-sm font-medium">Operario</Label>
                                <Input
                                    name="operario"
                                    value={form.operario}
                                    onChange={(e) => setField("operario", e.target.value)}
                                    className={inputStrong}
                                />
                            </div>
                        </div>
                    </section>
                </form>

                <div className="sticky bottom-0 z-50 w-full border-t bg-background px-6 py-3 shadow-[0_-6px_12px_-6px_rgba(0,0,0,0.08)]">
                    <div className="flex items-center justify-end gap-2">
                        <Button type="button" variant="outline" onClick={onClose} className="h-10">
                            <X className="mr-2 h-4 w-4" />
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            form="__form-id-not-needed__"
                            // no usamos id; el botón submit dentro del form ya lo maneja.
                            // Este botón es decorativo si querés moverlo aquí; alternativa: usar <button form="formId">
                            className="h-10"
                            onClick={() => {
                                // disparamos submit del form manualmente
                                const formEl = document.querySelector("form");
                                formEl?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
                            }}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Guardar
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
