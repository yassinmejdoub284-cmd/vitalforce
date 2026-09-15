import Link from "next/link";
import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "dark";

const variants: Record<Variant, string> = {
  primary: "bg-gold-300 text-forest-950 shadow-green hover:bg-gold-500",
  secondary: "border border-forest-700/20 bg-white text-forest-900 hover:bg-forest-50",
  ghost: "text-forest-900 hover:bg-forest-50",
  dark: "bg-forest-950 text-gold-100 hover:bg-forest-900"
};

type Props = {
  variant?: Variant;
  className?: string;
  children: ReactNode;
};

export function Button({ variant = "primary", className, ...props }: Props & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export function ButtonLink({
  variant = "primary",
  className,
  ...props
}: Props & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return (
    <Link
      className={cn(
        "focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
