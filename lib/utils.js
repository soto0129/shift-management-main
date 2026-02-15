// lib/utils.js
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Tailwind CSSのクラスを結合するユーティリティ関数
 * shadcn/uiコンポーネントで使用される
 * 
 * clsx: 条件付きクラス名を扱いやすくする
 * twMerge: Tailwindのクラスの競合を解決
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
