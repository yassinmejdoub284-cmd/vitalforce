import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTnd(value: number) {
  return new Intl.NumberFormat("fr-TN", {
    style: "currency",
    numberingSystem: "latn",
    currency: "TND",
    minimumFractionDigits: 3
  }).format(value);
}

export function formatOfferPrice(value: number) {
  return `${Number.isInteger(value) ? value : value.toFixed(3)} DT`;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
