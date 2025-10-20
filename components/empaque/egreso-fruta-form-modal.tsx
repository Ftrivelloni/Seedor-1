// components/empaque/egreso-fruta-form-modal.tsx
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Plus, X } from "lucide-react";
import { isDemoModeClient } from "../../lib/demo/utils";
import { demoEmpaqueCreateEgreso } from "../../lib/demo/store";
import { supabase } from "../../lib/supabaseClient";

interface Props {
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
    tenantId: string;
}

type FormState = {
    num_remito: string;
    fecha: string;
    cliente: string;
    finca: string;
    producto: string;
    DTV: string;
    tara: string;
    peso_neto: string;
    transporte: string;
    chasis: string;
    acoplado: string;
    chofer: string;
};

const initialState: FormState = {
    num_remito: "",
    fecha: "",
    cliente: "",
    finca: "",
    producto: "",
    DTV: "",
    tara: "",
    peso_neto: "",
    transporte: "",
    chasis: "",
    acoplado: "",
    chofer: "",
};

export default function EgresoFrutaFormModal({
                                                 open,
                                                 onClose,
                                                 onCreated,
                                                 tenantId,
                                             }: Props) {
    const [form, setForm] = useState<FormState>(initialState);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const isDemo = isDemoModeClient();

    const inputStrong =
        "h-11 w-full bg-white border border-gray-300/90 rounded-lg shadow-sm placeholder:text-gray-400 " +
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary/60 transition-colors";
    const inputError =
        "border-red-400 ring-1 ring-red-300 focus-visible:ring-red-400 focus-visible:border-red-400";

    const setField = (name: keyof FormState, value: string) => {
        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
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
        const isFloat = (v: string) =>
            v === "" || Number(v) < 0 ? "Debe ser un número ≥ 0" : "";

        switch (name) {
            case "fecha":
            case "cliente":
            case "producto":
            case "peso_neto":
                return req(value) || (name === "peso_neto" ? isFloat(value) : "");
            case "num_remito":
            case "tara":
                return value === "" ? "" : isFloat(value);
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
        next.producto ||= validateField("producto", form.producto);
        next.peso_neto ||= validateField("peso_neto", form.peso_neto);

        setErrors(next);
        return Object.values(next).every((m) => !m);
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateAll()) return;

        setLoading(true);

        const toNumber = (v: string) => (v === "" ? null : Number(v));
        const payload = {
            tenant_id: tenantId,
            num_remito: toNumber(form.num_remito),
            fecha: form.fecha ? new Date(form.fecha).toISOString() : null,
            cliente: form.cliente || null,
            finca: form.finca || null,
            producto: form.producto || null,
            DTV: form.DTV || null,
            tara: toNumber(form.tara),
            peso_neto: toNumber(form.peso_neto),
            transporte: form.transporte || null,
            chasis: form.chasis || null,
            acoplado: form.acoplado || null,
            chofer: form.chofer || null,
        };

        if (isDemo) {
            demoEmpaqueCreateEgreso({ ...payload, tenantId });
            setLoading(false);
            onCreated();
            onClose();
            setForm(initialState);
            return;
        }

        const { error } = await supabase.from("egreso_fruta").insert([payload]);
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
                    <DialogTitle className="text-2xl">Nuevo egreso de fruta</DialogTitle>
                </DialogHeader>

                <form id="egreso-form" onSubmit={submit} className="space-y-8 px-6 pt-4 pb-28">
                    <section className="rounded-xl border border-gray-300/80 bg-muted/30 p-4">
                        <h3 className="mb-3 text-base font-semibold">Datos del egreso</h3>
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
                                {errors.fecha && <p className="mt-1 text-xs text-red-600">{errors.fecha}</p>}
                            </div>

                            <div>
                                <Label className="mb-1 block text-sm font-medium">N° remito</Label>
                                <Input
                                    name="num_remito"
                                    type="number"
                                    inputMode="decimal"
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
                                <Label className="mb-1 block text-sm font-medium">Finca</Label>
                                <Input
                                    name="finca"
                                    value={form.finca}
                                    onChange={(e) => setField("finca", e.target.value)}
                                    className={inputStrong}
                                    placeholder="Ej: Finca Los Nogales"
                                />
                            </div>

                            <div>
                                <Label className="mb-1 block text-sm font-medium">
                                    Producto <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    name="producto"
                                    value={form.producto}
                                    onChange={(e) => setField("producto", e.target.value)}
                                    className={`${inputStrong} ${errors.producto ? inputError : ""}`}
                                    placeholder="Ej: Naranja Valencia"
                                />
                                {errors.producto && (
                                    <p className="mt-1 text-xs text-red-600">{errors.producto}</p>
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
                                <Label className="mb-1 block text-sm font-medium">Tara</Label>
                                <Input
                                    name="tara"
                                    type="number"
                                    inputMode="decimal"
                                    onKeyDown={blockInvalidNumberKeys}
                                    value={form.tara}
                                    onChange={(e) => setField("tara", e.target.value)}
                                    className={`${inputStrong} ${errors.tara ? inputError : ""}`}
                                    placeholder="Ej: 120"
                                />
                                {errors.tara && <p className="mt-1 text-xs text-red-600">{errors.tara}</p>}
                            </div>

                            <div>
                                <Label className="mb-1 block text-sm font-medium">
                                    Peso neto (kg) <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    name="peso_neto"
                                    type="number"
                                    inputMode="decimal"
                                    onKeyDown={blockInvalidNumberKeys}
                                    value={form.peso_neto}
                                    onChange={(e) => setField("peso_neto", e.target.value)}
                                    className={`${inputStrong} ${errors.peso_neto ? inputError : ""}`}
                                    placeholder="Ej: 720"
                                />
                                {errors.peso_neto && (
                                    <p className="mt-1 text-xs text-red-600">{errors.peso_neto}</p>
                                )}
                            </div>
                        </div>
                    </section>

                    <section className="rounded-xl border border-gray-300/80 bg-muted/30 p-4">
                        <h3 className="mb-3 text-base font-semibold">Transporte</h3>
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
                </form>

                <div className="sticky bottom-0 z-50 w-full border-t bg-background px-6 py-3 shadow-[0_-6px_12px_-6px_rgba(0,0,0,0.08)]">
                    <div className="flex items-center justify-end gap-2">
                        <Button type="button" variant="outline" onClick={onClose} className="h-10">
                            <X className="mr-2 h-4 w-4" />
                            Cancelar
                        </Button>
                        <Button type="submit" form="egreso-form" className="h-10" disabled={loading}>
                            <Plus className="mr-2 h-4 w-4" />
                            {loading ? "Guardando..." : "Guardar"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
