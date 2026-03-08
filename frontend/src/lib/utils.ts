import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * @description className を組み立てる共通関数
 * 条件付き class の結合と、Tailwind の重複クラス解消をまとめて行う
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
