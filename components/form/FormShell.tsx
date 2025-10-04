"use client";

import { useForm, FormProvider } from "react-hook-form";
import { z, ZodTypeAny } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { useTransition, useState } from "react";

type Props<T extends ZodTypeAny> = {
  schema: T;
  defaultValues: z.infer<T>;
  onSubmit: (data: z.infer<T>) => Promise<{ ok: boolean; message?: string }>;
  children: React.ReactNode;
  submitLabel?: string;
};

export default function FormShell<T extends ZodTypeAny>({
  schema,
  defaultValues,
  onSubmit,
  children,
  submitLabel = "Guardar",
}: Props<T>) {
  const methods = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onSubmit",
  });
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  return (
    <FormProvider {...methods}>
      <form
        className="space-y-4"
        onSubmit={methods.handleSubmit((data) => {
          setError(null);
          setSuccess(null);
          start(async () => {
            try {
              const res = await onSubmit(data);
              if (res.ok) setSuccess(res.message ?? "Guardado con éxito.");
              else setError(res.message ?? "Error al guardar.");
            } catch (e: any) {
              setError(e?.message ?? "Error inesperado.");
            }
          });
        })}
      >
        <div className="grid gap-4">{children}</div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-700">{success}</p>}

        <Button type="submit" disabled={pending} className="min-w-32">
          {pending ? "Guardando..." : submitLabel}
        </Button>
      </form>
    </FormProvider>
  );
}
