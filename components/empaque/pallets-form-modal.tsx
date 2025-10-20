"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Plus, X } from "lucide-react";
import { isDemoModeClient } from "../../lib/demo/utils";
import { demoEmpaqueCreatePallet } from "../../lib/demo/store";

interface Props {
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
    tenantId: string;
}

type FormState = {
    semana: string;
    fecha: string;
    num_pallet: string;
    producto: string;
    productor: string;
    categoria: string;
    cod_envase: string;
    destino: string;
    kilos: string;
    cant_cajas: string;
    peso: string;
};

const initialState: FormState = {
    semana: "",
    fecha: "",
    num_pallet: "",
    producto: "",
    productor: "",
    categoria: "",
    cod_envase: "",
    destino: "",
    kilos: "",
    cant_cajas: "",
    peso: "",
};

export default function PalletsFormModal({ open, onClose, onCreated, tenantId }: Props) {
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
        const isInt = (v: string) => (v === "" || (!Number.isInteger(Number(v)) || Number(v) < 0) ? "Debe ser un entero ≥ 0" : "");
        const isFloat = (v: string) => (v === "" || Number(v) < 0 ? "Debe ser un número ≥ 0" : "");

        switch (name) {
            case "semana":
            case "num_pallet":
            case "cant_cajas":
                return req(value) || isInt(value);
            case "fecha":
                return req(value);
            case "producto":
            case "productor":
            case "categoria":
            case "cod_envase":
                return req(value);
            case "kilos":
            case "peso":
                return req(value) || isFloat(value);
            case "destino":
                return "";
            default:
                return "";
        }
    };

    const validateAll = () => {
        const fields = Object.keys(form) as (keyof FormState)[];
        const next: Record<string, string> = {};
        fields.forEach((f) => (next[f] = validateField(f, form[f])));
        setErrors(next);
        return Object.values(next).every((m) => !m);
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateAll()) return;

        setLoading(true);
        const toInt = (v: string) => (Number.isNaN(Number(v)) ? 0 : parseInt(v, 10));
        const toFloat = (v: string) => (Number.isNaN(Number(v)) ? 0 : Number(v));

        const payload = {
            tenant_id: tenantId,
            semana: toInt(form.semana),
            fecha: form.fecha ? new Date(form.fecha).toISOString() : null,
            num_pallet: toInt(form.num_pallet),
            producto: form.producto,
            productor: form.productor,
            categoria: form.categoria,
            cod_envase: form.cod_envase,
            destino: form.destino || null,
            kilos: toFloat(form.kilos),
            cant_cajas: toInt(form.cant_cajas),
            peso: toFloat(form.peso),
        };

        if (isDemo) {
            demoEmpaqueCreatePallet({ ...payload, tenantId });
            setLoading(false);
            onCreated();
            onClose();
            setForm(initialState);
            return;
        }

        const { error } = await supabase.from("pallets").insert([payload]);
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
                    <DialogTitle className="text-2xl">Nuevo pallet</DialogTitle>
                </DialogHeader>

                <form id="pallets-form" onSubmit={submit} className="space-y-8 px-6 pt-4 pb-28">
                    <section className="rounded-xl border border-gray-300/80 bg-muted/30 p-4">
                        <h3 className="mb-3 text-base font-semibold">Generales</h3>
                        <div className="grid gap-5 sm:grid-cols-2">
                            <div>
                                <Label className="mb-1 block text-sm font-medium">
                                    Semana <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    name="semana"
                                    type="number"
                                    min={0}
                                    inputMode="numeric"
                                    value={form.semana}
                                    onChange={(e) => setField("semana", e.target.value)}
                                    onKeyDown={blockInvalidNumberKeys}
                                    className={`${inputStrong} ${errors.semana ? inputError : ""}`}
                                    placeholder="Ej: 34"
                                />
                                {errors.semana && <p className="mt-1 text-xs text-red-600">{errors.semana}</p>}
                            </div>

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
                                <Label className="mb-1 block text-sm font-medium">
                                    N° pallet <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    name="num_pallet"
                                    type="number"
                                    min={0}
                                    inputMode="numeric"
                                    value={form.num_pallet}
                                    onChange={(e) => setField("num_pallet", e.target.value)}
                                    onKeyDown={blockInvalidNumberKeys}
                                    className={`${inputStrong} ${errors.num_pallet ? inputError : ""}`}
                                    placeholder="Ej: 1029"
                                />
                                {errors.num_pallet && <p className="mt-1 text-xs text-red-600">{errors.num_pallet}</p>}
                            </div>
                        </div>
                    </section>

                    <section className="rounded-xl border border-gray-300/80 bg-muted/30 p-4">
                        <h3 className="mb-3 text-base font-semibold">Identificación</h3>
                        <div className="grid gap-5 sm:grid-cols-2">
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
                                {errors.producto && <p className="mt-1 text-xs text-red-600">{errors.producto}</p>}
                            </div>

                            <div>
                                <Label className="mb-1 block text-sm font-medium">
                                    Productor <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    name="productor"
                                    value={form.productor}
                                    onChange={(e) => setField("productor", e.target.value)}
                                    className={`${inputStrong} ${errors.productor ? inputError : ""}`}
                                    placeholder="Ej: Finca Los Nogales"
                                />
                                {errors.productor && <p className="mt-1 text-xs text-red-600">{errors.productor}</p>}
                            </div>

                            <div>
                                <Label className="mb-1 block text-sm font-medium">
                                    Categoría <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    name="categoria"
                                    value={form.categoria}
                                    onChange={(e) => setField("categoria", e.target.value)}
                                    className={`${inputStrong} ${errors.categoria ? inputError : ""}`}
                                    placeholder="Ej: Cat. 1 / Premium"
                                />
                                {errors.categoria && <p className="mt-1 text-xs text-red-600">{errors.categoria}</p>}
                            </div>

                            <div>
                                <Label className="mb-1 block text-sm font-medium">
                                    Código de envase <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    name="cod_envase"
                                    value={form.cod_envase}
                                    onChange={(e) => setField("cod_envase", e.target.value)}
                                    className={`${inputStrong} ${errors.cod_envase ? inputError : ""}`}
                                    placeholder="Ej: ENV-45C"
                                />
                                {errors.cod_envase && <p className="mt-1 text-xs text-red-600">{errors.cod_envase}</p>}
                            </div>

                            <div className="sm:col-span-2">
                                <Label className="mb-1 block text-sm font-medium">Destino (opcional)</Label>
                                <Input name="destino" value={form.destino} onChange={(e) => setField("destino", e.target.value)} className={inputStrong} placeholder="Ej: Mercado Central / Exportación" />
                            </div>
                        </div>
                    </section>

                    <section className="rounded-xl border border-gray-300/80 bg-muted/30 p-4">
                        <h3 className="mb-3 text-base font-semibold">Medidas</h3>
                        <div className="grid gap-5 sm:grid-cols-3">
                            <div>
                                <Label className="mb-1 block text-sm font-medium">
                                    Kilos <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    name="kilos"
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    inputMode="decimal"
                                    value={form.kilos}
                                    onChange={(e) => setField("kilos", e.target.value)}
                                    onKeyDown={blockInvalidNumberKeys}
                                    className={`${inputStrong} ${errors.kilos ? inputError : ""}`}
                                    placeholder="Ej: 720"
                                />
                                {errors.kilos && <p className="mt-1 text-xs text-red-600">{errors.kilos}</p>}
                            </div>

                            <div>
                                <Label className="mb-1 block text-sm font-medium">
                                    Cant. cajas <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    name="cant_cajas"
                                    type="number"
                                    min={0}
                                    inputMode="numeric"
                                    value={form.cant_cajas}
                                    onChange={(e) => setField("cant_cajas", e.target.value)}
                                    onKeyDown={blockInvalidNumberKeys}
                                    className={`${inputStrong} ${errors.cant_cajas ? inputError : ""}`}
                                    placeholder="Ej: 48"
                                />
                                {errors.cant_cajas && <p className="mt-1 text-xs text-red-600">{errors.cant_cajas}</p>}
                            </div>

                            <div>
                                <Label className="mb-1 block text-sm font-medium">
                                    Peso pallet <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    name="peso"
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    inputMode="decimal"
                                    value={form.peso}
                                    onChange={(e) => setField("peso", e.target.value)}
                                    onKeyDown={blockInvalidNumberKeys}
                                    className={`${inputStrong} ${errors.peso ? inputError : ""}`}
                                    placeholder="Ej: 24"
                                />
                                {errors.peso && <p className="mt-1 text-xs text-red-600">{errors.peso}</p>}
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
                        <Button type="submit" form="pallets-form" className="h-10" disabled={loading}>
                            <Plus className="mr-2 h-4 w-4" />
                            {loading ? "Guardando..." : "Guardar"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
