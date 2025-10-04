"use client";

import FormShell from "@/components/form/FormShell";
import { TextField } from "@/components/form/fields/Text";
import { DateField } from "@/components/form/fields/Date";
import { TextAreaField } from "@/components/form/fields/TextArea";
import { z } from "zod";
import { savePaso } from "../actions";
import { FormFrame, Section, FormActions } from "@/components/form/Pretty";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

const schema = z.object({
  lote: z.string().min(1, "Obligatorio"),
  etapa: z.string().min(1, "Obligatorio"),
  fecha: z.string().min(1, "Obligatorio"),
  responsable: z.string().min(1, "Obligatorio"),
  observaciones: z.string().optional(),
});

export default function Page() {
  return (
    <div className="container mx-auto max-w-3xl py-6">
      <FormFrame
        icon={<Settings className="h-5 w-5 text-orange-600" />}
        title="Preproceso"
        subtitle="Preparación y limpieza"
      >
        <FormShell
          schema={schema}
          defaultValues={{ lote: "", etapa: "", fecha: "", responsable: "", observaciones: "" }}
          onSubmit={(data) => savePaso("preproceso", data)}
          submitLabel="Guardar preproceso"
        >
          <div className="space-y-6">
            <Section title="Datos del preproceso">
              <TextField name="lote" label="Lote" />
              <TextField name="etapa" label="Etapa" placeholder="Lavado / Selección / Desinfección..." />
              <DateField name="fecha" label="Fecha" />
              <TextField name="responsable" label="Responsable" />
            </Section>

            <Section title="Notas">
              <TextAreaField name="observaciones" label="Observaciones" />
            </Section>

            <FormActions>
              <Button type="submit">Guardar preproceso</Button>
            </FormActions>
          </div>
        </FormShell>
      </FormFrame>
    </div>
  );
}
