import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrencyInput(value: string) {
  const numberValue = value.replace(/\D/g, "");
  if (!numberValue) return "";
  return new Intl.NumberFormat("en-US").format(parseInt(numberValue));
}

export function parseCurrencyInput(value: string) {
  return value.replace(/,/g, "");
}
