"use client";

import { useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SelectField({
  name,
  label,
  placeholder = "Seleccioná...",
  options,
}: {
  name: string;
  label: string;
  placeholder?: string;
  options: { value: string; label: string }[];
}) {
  const { setValue, watch, formState: { errors } } = useFormContext();
  const value = watch(name);
  const err = (errors as any)?.[name]?.message as string | undefined;

  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Select value={value ?? ""} onValueChange={(v) => setValue(name, v, { shouldValidate: true })}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {err && <p className="text-xs text-red-600">{err}</p>}
    </div>
  );
}
