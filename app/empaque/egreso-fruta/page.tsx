"use client";

import FormShell from "@/components/form/FormShell";
import { TextField } from "@/components/form/fields/Text";
import { NumberField } from "@/components/form/fields/Number";
import { DateField } from "@/components/form/fields/Date";
import { z } from "zod";
import { savePaso } from "../actions";
import { FormFrame, Section, FormActions } from "@/components/form/Pretty";
import { ArrowUpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const schema = z.object({
  lote: z.string().min(1, "Obligatorio"),
  fechaEgreso: z.string().min(1, "Obligatorio"),
  kilos: z.coerce.number().nonnegative(),
  motivo: z.string().min(1, "Obligatorio"),
});

export default function Page() {
  return (
    <div className="container mx-auto max-w-3xl py-6">
      <FormFrame
        icon={<ArrowUpCircle className="h-5 w-5 text-red-500" />}
        title="Egreso de fruta"
        subtitle="Salida de productos"
      >
        <FormShell
          schema={schema}
          defaultValues={{ lote: "", fechaEgreso: "", kilos: 0, motivo: "" }}
          onSubmit={(data) => savePaso("egreso-fruta", data)}
          submitLabel="Guardar egreso"
        >
          <div className="space-y-6">
            <Section title="Datos del egreso">
              <TextField name="lote" label="Lote" />
              <DateField name="fechaEgreso" label="Fecha de egreso" />
              <NumberField name="kilos" label="Kilos" step="0.01" />
              <TextField name="motivo" label="Motivo" placeholder="venta / descarte / traslado..." />
            </Section>

            <FormActions>
              <Button type="submit">Guardar egreso</Button>
            </FormActions>
          </div>
        </FormShell>
      </FormFrame>
    </div>
  );
}
