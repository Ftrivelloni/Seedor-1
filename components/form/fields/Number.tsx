"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NumberField({
  name,
  label,
  step = "1",
  min,
  max,
  placeholder = "",
}: {
  name: string;
  label: string;
  step?: string;
  min?: number;
  max?: number;
  placeholder?: string;
}) {
  const { register, formState: { errors } } = useFormContext();
  const err = (errors as any)?.[name]?.message as string | undefined;

  return (
    <div className="space-y-1">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        type="number"
        step={step}
        min={min}
        max={max}
        placeholder={placeholder}
        {...register(name, { valueAsNumber: true })}
      />
      {err && <p className="text-xs text-red-600">{err}</p>}
    </div>
  );
}
