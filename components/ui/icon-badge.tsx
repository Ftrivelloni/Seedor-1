"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export function IconBadge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-xl bg-muted",
        className
      )}
    >
      {children}
    </div>
  );
}
