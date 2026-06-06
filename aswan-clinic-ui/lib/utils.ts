import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeArabic(text: string) {
  if (!text) return "";
  return text
    .replace(/[أإآ]/g, "ا")      // توحيد الألف
    .replace(/ى/g, "ي")         // توحيد الياء والألف اللينة
    .replace(/ة/g, "ه")         // توحيد التاء المربوطة والهاء
    .replace(/[\u064B-\u0652]/g, ""); // إزالة التشكيل تماماً
}