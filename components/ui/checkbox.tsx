"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { CheckIcon } from "lucide-react"

import { cn } from "../../lib/utils"

const checkboxStyles = `
  [data-state=checked] {
    background-color: #f87163 !important;
    border-color: #f87163 !important;
  }
`;

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: checkboxStyles }} />
      <CheckboxPrimitive.Root
        data-slot="checkbox"
        className={cn(
          "peer border-input dark:bg-input/30 data-[state=checked]:text-white dark:data-[state=checked]:text-white focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        style={{
          ['--checked-bg' as string]: '#f87163',
          ['--checked-border' as string]: '#f87163'
        } as React.CSSProperties}
        data-checked={props.checked ? 'true' : 'false'}
        {...props}
      >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current transition-none"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
    </>
  )
}

export { Checkbox }
