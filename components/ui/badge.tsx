import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border border-gold-500/30 bg-gold-100/60 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-forest-900", className)}>
      {children}
    </span>
  );
}
