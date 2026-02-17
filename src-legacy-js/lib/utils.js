import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 複数のクラス名を結合し、Tailwind CSSのクラス競合を解消するユーティリティ
 * @param {...(string|undefined|null|false)} inputs
 * @returns {string}
 */
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
