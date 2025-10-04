"use client";

import FormShell from "@/components/form/FormShell";
import { TextField } from "@/components/form/fields/Text";
import { NumberField } from "@/components/form/fields/Number";
import { DateField } from "@/components/form/fields/Date";
import { TextAreaField } from "@/components/form/fields/TextArea";
import { z } from "zod";
import { savePaso } from "../actions";
import { FormFrame, Section, FormActions } from "@/components/form/Pretty";
import { ArrowDownCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const schema = z.object({
  lote: z.string().min(1, "Obligatorio"),
  proveedor: z.string().min(1, "Obligatorio"),
  fechaIngreso: z.string().min(1, "Obligatorio"),
  kilos: z.coerce.number().nonnegative("Debe ser ≥ 0"),
  observaciones: z.string().optional(),
});

export default function Page() {
  return (
    <div className="container mx-auto max-w-3xl py-6">
      <FormFrame
        icon={<ArrowDownCircle className="h-5 w-5" />}
        title="Ingreso de fruta"
        subtitle="Recepción de materia prima"
      >
        <FormShell
          schema={schema}
          defaultValues={{ lote: "", proveedor: "", fechaIngreso: "", kilos: 0, observaciones: "" }}
          onSubmit={(data) => savePaso("ingreso-fruta", data)}
          submitLabel="Guardar ingreso"
        >
          <div className="space-y-6">
            <Section title="Datos principales">
              <TextField name="lote" label="Lote" placeholder="L-000123" />
              <TextField name="proveedor" label="Proveedor" />
              <DateField name="fechaIngreso" label="Fecha de ingreso" />
              <NumberField name="kilos" label="Kilos" step="0.01" />
            </Section>

            <Section title="Notas" desc="Información adicional del ingreso">
              <TextAreaField name="observaciones" label="Observaciones" />
            </Section>

            <FormActions>
              <Button type="submit">Guardar ingreso</Button>
            </FormActions>
          </div>
        </FormShell>
      </FormFrame>
    </div>
  );
}
