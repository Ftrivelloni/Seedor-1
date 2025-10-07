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
    semana: string;
    fecha: string;
    duracion: string;
    bin_volcados: string;
    ritmo_maquina: string;
    duracion_proceso: string;
    bin_pleno: string;
    bin_intermedio_I: string;
    bin_intermedio_II: string;
    bin_incipiente: string;
    cant_personal: string;
};

const initialState: FormState = {
    semana: "",
    fecha: "",
    duracion: "",
    bin_volcados: "",
    ritmo_maquina: "",
    duracion_proceso: "",
    bin_pleno: "",
    bin_intermedio_I: "",
    bin_intermedio_II: "",
    bin_incipiente: "",
    cant_personal: "",
};

export default function PreprocesoFormModal({ open, onClose, onCreated, tenantId }: Props) {
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
        setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    };

    const validateField = (name: keyof FormState, value: string): string => {
        const req = (v: string) => (!v || v.trim() === "" ? "Campo obligatorio" : "");
        const isInt = (v: string) => (v === "" || (!Number.isInteger(Number(v)) || Number(v) < 0) ? "Debe ser un entero ≥ 0" : "");
        const isFloat = (v: string) => (v === "" || Number(v) < 0 ? "Debe ser un número ≥ 0" : "");

        switch (name) {
            case "semana":
                return req(value) || isInt(value);
            case "fecha":
                return req(value);
            case "duracion":
            case "ritmo_maquina":
            case "duracion_proceso":
                return req(value) || isFloat(value);
            case "bin_volcados":
            case "bin_pleno":
            case "bin_intermedio_I":
            case "bin_intermedio_II":
            case "bin_incipiente":
            case "cant_personal":
                return req(value) || isInt(value);
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

    const blockInvalidNumberKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateAll()) return;

        setLoading(true);
        const toInt = (v: string) => (Number.isNaN(Number(v)) ? 0 : parseInt(v, 10));
        const toFloat = (v: string) => (Number.isNaN(Number(v)) ? 0 : Number(v));

        const payload = {
            semana: toInt(form.semana),
            fecha: form.fecha ? new Date(form.fecha).toISOString() : null,
            duracion: toFloat(form.duracion),
            bin_volcados: toInt(form.bin_volcados),
            ritmo_maquina: toFloat(form.ritmo_maquina),
            duracion_proceso: toFloat(form.duracion_proceso),
            bin_pleno: toInt(form.bin_pleno),
            bin_intermedio_I: toInt(form.bin_intermedio_I),
            bin_intermedio_II: toInt(form.bin_intermedio_II),
            bin_incipiente: toInt(form.bin_incipiente),
            cant_personal: toInt(form.cant_personal),
            tenant_id: tenantId,
        };

        const { error } = await supabase.from("preseleccion").insert([payload]);
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
                    <DialogTitle className="text-2xl">Nuevo preproceso</DialogTitle>
                </DialogHeader>

                <form id="preproceso-form" onSubmit={submit} className="space-y-8 px-6 pt-4 pb-28">
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
                                    inputMode="numeric"
                                    min={0}
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
                                    Duración (h) <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    name="duracion"
                                    type="number"
                                    step="0.01"
                                    inputMode="decimal"
                                    min={0}
                                    value={form.duracion}
                                    onChange={(e) => setField("duracion", e.target.value)}
                                    onKeyDown={blockInvalidNumberKeys}
                                    className={`${inputStrong} ${errors.duracion ? inputError : ""}`}
                                    placeholder="Ej: 3.5"
                                />
                                {errors.duracion && <p className="mt-1 text-xs text-red-600">{errors.duracion}</p>}
                            </div>

                            <div>
                                <Label className="mb-1 block text-sm font-medium">
                                    Ritmo de máquina (bin/h) <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    name="ritmo_maquina"
                                    type="number"
                                    step="0.01"
                                    inputMode="decimal"
                                    min={0}
                                    value={form.ritmo_maquina}
                                    onChange={(e) => setField("ritmo_maquina", e.target.value)}
                                    onKeyDown={blockInvalidNumberKeys}
                                    className={`${inputStrong} ${errors.ritmo_maquina ? inputError : ""}`}
                                    placeholder="Ej: 12.4"
                                />
                                {errors.ritmo_maquina && <p className="mt-1 text-xs text-red-600">{errors.ritmo_maquina}</p>}
                            </div>
                        </div>
                    </section>

                    <section className="rounded-xl border border-gray-300/80 bg-muted/30 p-4">
                        <h3 className="mb-3 text-base font-semibold">Proceso</h3>
                        <div className="grid gap-5 sm:grid-cols-2">
                            <div>
                                <Label className="mb-1 block text-sm font-medium">
                                    Bins volcados <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    name="bin_volcados"
                                    type="number"
                                    inputMode="numeric"
                                    min={0}
                                    value={form.bin_volcados}
                                    onChange={(e) => setField("bin_volcados", e.target.value)}
                                    onKeyDown={blockInvalidNumberKeys}
                                    className={`${inputStrong} ${errors.bin_volcados ? inputError : ""}`}
                                    placeholder="Ej: 25"
                                />
                                {errors.bin_volcados && <p className="mt-1 text-xs text-red-600">{errors.bin_volcados}</p>}
                            </div>

                            <div>
                                <Label className="mb-1 block text-sm font-medium">
                                    Duración del proceso (h) <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    name="duracion_proceso"
                                    type="number"
                                    step="0.01"
                                    inputMode="decimal"
                                    min={0}
                                    value={form.duracion_proceso}
                                    onChange={(e) => setField("duracion_proceso", e.target.value)}
                                    onKeyDown={blockInvalidNumberKeys}
                                    className={`${inputStrong} ${errors.duracion_proceso ? inputError : ""}`}
                                    placeholder="Ej: 2"
                                />
                                {errors.duracion_proceso && <p className="mt-1 text-xs text-red-600">{errors.duracion_proceso}</p>}
                            </div>
                        </div>
                    </section>

                    <section className="rounded-xl border border-gray-300/80 bg-muted/30 p-4">
                        <h3 className="mb-3 text-base font-semibold">Bins</h3>
                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {[
                                ["bin_pleno", "Pleno"],
                                ["bin_intermedio_I", "Intermedio I"],
                                ["bin_intermedio_II", "Intermedio II"],
                                ["bin_incipiente", "Incipiente"],
                                ["cant_personal", "Cantidad de personal"],
                            ].map(([name, label]) => (
                                <div key={name}>
                                    <Label className="mb-1 block text-sm font-medium">
                                        {label} <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        name={name}
                                        type="number"
                                        inputMode="numeric"
                                        min={0}
                                        value={(form as any)[name]}
                                        onChange={(e) => setField(name as keyof FormState, e.target.value)}
                                        onKeyDown={blockInvalidNumberKeys}
                                        className={`${inputStrong} ${errors[name as keyof FormState] ? inputError : ""}`}
                                    />
                                    {errors[name as keyof FormState] && (
                                        <p className="mt-1 text-xs text-red-600">{errors[name as keyof FormState]}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                </form>

                <div className="sticky bottom-0 z-50 w-full border-t bg-background px-6 py-3 shadow-[0_-6px_12px_-6px_rgba(0,0,0,0.08)]">
                    <div className="flex items-center justify-end gap-2">
                        <Button type="button" variant="outline" onClick={onClose} className="h-10">
                            <X className="mr-2 h-4 w-4" />
                            Cancelar
                        </Button>
                        <Button type="submit" form="preproceso-form" className="h-10" disabled={loading}>
                            <Plus className="mr-2 h-4 w-4" />
                            {loading ? "Guardando..." : "Guardar"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
