"use client";

import FormShell from "@/components/form/FormShell";
import { TextField } from "@/components/form/fields/Text";
import { DateField } from "@/components/form/fields/Date";
import { z } from "zod";
import { savePaso } from "../actions";
import { FormFrame, Section, FormActions } from "@/components/form/Pretty";
import { Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

const schema = z.object({
  lote: z.string().min(1, "Obligatorio"),
  transporte: z.string().min(1, "Obligatorio"),
  guia: z.string().min(1, "Obligatorio"),
  fechaSalida: z.string().min(1, "Obligatorio"),
  destino: z.string().min(1, "Obligatorio"),
});

export default function Page() {
  return (
    <div className="container mx-auto max-w-3xl py-6">
      <FormFrame
        icon={<Truck className="h-5 w-5 text-purple-600" />}
        title="Despacho"
        subtitle="Envío a clientes"
      >
        <FormShell
          schema={schema}
          defaultValues={{ lote: "", transporte: "", guia: "", fechaSalida: "", destino: "" }}
          onSubmit={(data) => savePaso("despacho", data)}
          submitLabel="Guardar despacho"
        >
          <div className="space-y-6">
            <Section title="Datos del despacho">
              <TextField name="lote" label="Lote" />
              <TextField name="transporte" label="Transporte" />
              <TextField name="guia" label="N° de guía" />
              <DateField name="fechaSalida" label="Fecha de salida" />
              <TextField name="destino" label="Destino" />
            </Section>

            <FormActions>
              <Button type="submit">Guardar despacho</Button>
            </FormActions>
          </div>
        </FormShell>
      </FormFrame>
    </div>
  );
}
