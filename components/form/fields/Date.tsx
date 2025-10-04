"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DateField({ name, label }: { name: string; label: string }) {
  const { register, formState: { errors } } = useFormContext();
  const err = (errors as any)?.[name]?.message as string | undefined;

  return (
    <div className="space-y-1">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} type="date" {...register(name)} />
      {err && <p className="text-xs text-red-600">{err}</p>}
    </div>
  );
}
