"use client";

import FormShell from "@/components/form/FormShell";
import { TextField } from "@/components/form/fields/Text";
import { NumberField } from "@/components/form/fields/Number";
import { z } from "zod";
import { savePaso } from "../actions";
import { FormFrame, Section, FormActions } from "@/components/form/Pretty";
import { Boxes } from "lucide-react";
import { Button } from "@/components/ui/button";

const schema = z.object({
  lote: z.string().min(1, "Obligatorio"),
  tipo: z.string().min(1, "Obligatorio"),
  cajasPorPallet: z.coerce.number().int().positive(),
  pallets: z.coerce.number().int().nonnegative(),
});

export default function Page() {
  return (
    <div className="container mx-auto max-w-3xl py-6">
      <FormFrame
        icon={<Boxes className="h-5 w-5 text-emerald-600" />}
        title="Pallets"
        subtitle="Gestión de pallets"
      >
        <FormShell
          schema={schema}
          defaultValues={{ lote: "", tipo: "", cajasPorPallet: 1, pallets: 0 }}
          onSubmit={(data) => savePaso("pallets", data)}
          submitLabel="Guardar pallets"
        >
          <div className="space-y-6">
            <Section title="Datos de pallets">
              <TextField name="lote" label="Lote" />
              <TextField name="tipo" label="Tipo de pallet" placeholder="Madera / Plástico..." />
              <NumberField name="cajasPorPallet" label="Cajas por pallet" />
              <NumberField name="pallets" label="Cantidad de pallets" />
            </Section>

            <FormActions>
              <Button type="submit">Guardar pallets</Button>
            </FormActions>
          </div>
        </FormShell>
      </FormFrame>
    </div>
  );
}
