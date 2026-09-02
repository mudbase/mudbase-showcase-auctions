import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  const now = Date.now()
  const diffSeconds = Math.round((now - then) / 1000)

  if (diffSeconds < 5) return "just now"
  if (diffSeconds < 60) return `${diffSeconds}s`
  const diffMinutes = Math.round(diffSeconds / 60)
  if (diffMinutes < 60) return `${diffMinutes}m`
  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h`
  const diffDays = Math.round(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d`
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(iso))
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso))
}

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount)
  } catch {
    // Fall back for any currency code Intl doesn't recognise.
    return `${currency} ${amount.toFixed(2)}`
  }
}

/**
 * Countdown from now until an ISO deadline, as { ended, label }. Pure/stateless so a ticking
 * component can call it on an interval.
 */
export function timeRemaining(iso: string): { ended: boolean; label: string } {
  const ms = new Date(iso).getTime() - Date.now()
  if (ms <= 0) return { ended: true, label: "Ended" }
  const totalSeconds = Math.floor(ms / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad = (n: number): string => String(n).padStart(2, "0")
  if (days > 0) return { ended: false, label: `${days}d ${pad(hours)}h ${pad(minutes)}m` }
  return { ended: false, label: `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` }
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  const first = parts[0]?.[0] ?? ""
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : ""
  return (first + last).toUpperCase()
}
