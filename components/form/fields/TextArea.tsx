"use client";
import { useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function TextAreaField({ name, label, placeholder="" }:{
  name: string; label: string; placeholder?: string;
}) {
  const { register, formState:{ errors } } = useFormContext();
  const err = (errors as any)?.[name]?.message as string | undefined;
  return (
    <div className="space-y-1">
      <Label htmlFor={name}>{label}</Label>
      <Textarea id={name} placeholder={placeholder} {...register(name)} />
      {err && <p className="text-xs text-red-600">{err}</p>}
    </div>
  );
}
