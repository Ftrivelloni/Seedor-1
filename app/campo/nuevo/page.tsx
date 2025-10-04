"use client";

import FormShell from "@/components/form/FormShell";
import { TextField } from "@/components/form/fields/Text";
import { NumberField } from "@/components/form/fields/Number";
import { z } from "zod";
import { saveCampo } from "./save";
import { FormFrame, Section, FormActions } from "@/components/form/Pretty";
import { Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";

const schema = z.object({
  nombre: z.string().min(1, "Obligatorio"),
  ubicacion: z.string().min(1, "Obligatorio"),
  hectareas: z.coerce.number().positive("Debe ser > 0"),
});

export default function Page() {
  return (
    <div className="container mx-auto max-w-3xl py-6">
      <FormFrame
        icon={<Leaf className="h-5 w-5 text-green-600" />}
        title="Nueva parcela"
        subtitle="Alta de lote/campo"
      >
        <FormShell
          schema={schema}
          defaultValues={{ nombre: "", ubicacion: "", hectareas: 0 }}
          onSubmit={(data) => saveCampo(data)}
          submitLabel="Crear"
        >
          <div className="space-y-6">
            <Section title="Datos de la parcela">
              <TextField name="nombre" label="Nombre" />
              <TextField name="ubicacion" label="Ubicación" />
              <NumberField name="hectareas" label="Hectáreas" step="0.01" />
            </Section>

            <FormActions>
              <Button type="submit">Crear parcela</Button>
            </FormActions>
          </div>
        </FormShell>
      </FormFrame>
    </div>
  );
}
