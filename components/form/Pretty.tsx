"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export function FormFrame({
  icon,
  title,
  subtitle,
  children,
  className,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("shadow-sm border border-border/60", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          {icon ? (
            <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
              {icon}
            </div>
          ) : null}
          <div>
            <CardTitle className="text-xl">{title}</CardTitle>
            {subtitle ? (
              <CardDescription className="mt-1">{subtitle}</CardDescription>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function Section({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-medium">{title}</h3>
        {desc ? <p className="text-xs text-muted-foreground">{desc}</p> : null}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
    </div>
  );
}

export function FormActions({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 mt-6 flex items-center justify-end gap-2 border-t bg-background/80 p-3 backdrop-blur md:rounded-b-md">
      {children}
    </div>
  );
}
