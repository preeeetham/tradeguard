import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { SessionInfo } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// IST offset in minutes = +330
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000

export function getNowIST(): Date {
  const now = new Date()
  return new Date(now.getTime() + IST_OFFSET_MS - now.getTimezoneOffset() * 60000)
}

export function formatTimeIST(date?: Date): string {
  const d = date || new Date()
  return d.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

export function formatDateIST(date?: Date): string {
  const d = date || new Date()
  return d.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Trading sessions in IST:
 * Asian:    05:30 – 08:30 IST
 * London:   13:30 – 16:30 IST  (8am–11am GMT)
 * New York: 18:30 – 21:00 IST  (1pm–3:30pm GMT)
 */
export function getCurrentSessionIST(): SessionInfo {
  const now = new Date()
  const istHour = parseInt(
    now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', hour12: false })
  )
  const istMin = parseInt(
    now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', minute: '2-digit', hour12: false })
  )
  const totalMins = istHour * 60 + istMin

  const sessions: SessionInfo[] = [
    {
      name: 'Asian',
      istStart: '05:30',
      istEnd: '08:30',
      isActive: totalMins >= 330 && totalMins < 510,
      isPrimary: false,
    },
    {
      name: 'London',
      istStart: '13:30',
      istEnd: '16:30',
      isActive: totalMins >= 810 && totalMins < 990,
      isPrimary: true,
    },
    {
      name: 'New York',
      istStart: '18:30',
      istEnd: '21:00',
      isActive: totalMins >= 1110 && totalMins < 1260,
      isPrimary: true,
    },
  ]

  const active = sessions.find((s) => s.isActive)
  if (active) return active

  return {
    name: 'Off-Hours',
    istStart: '',
    istEnd: '',
    isActive: false,
    isPrimary: false,
  }
}

export function isPreMarketWindowIST(): boolean {
  const now = new Date()
  const istHour = parseInt(
    now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', hour12: false })
  )
  const istMin = parseInt(
    now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', minute: '2-digit', hour12: false })
  )
  const totalMins = istHour * 60 + istMin
  // 13:00 IST = 780 mins
  return totalMins >= 775 && totalMins <= 785
}

export function calcPips(entry: number, stop: number, instrument: string): number {
  const diff = Math.abs(entry - stop)
  // Gold (XAU/USD) — pip = 0.01 (1 cent)
  if (instrument === 'XAU/USD') {
    return Math.round(diff * 100) / 100
  }
  // JPY pairs — pip = 0.01
  if (instrument.includes('JPY')) {
    return Math.round(diff * 100) / 100
  }
  // Standard forex pairs — pip = 0.0001
  return Math.round(diff * 10000) / 100
}

export function calcPositionSize(
  accountSize: number,
  riskPct: number,
  entry: number,
  stop: number,
  instrument: string
): { positionSize: number; riskAmount: number; stopPips: number } {
  const riskAmount = (accountSize * riskPct) / 100
  const stopPips = calcPips(entry, stop, instrument)

  let pipValue = 1
  if (instrument === 'XAU/USD') {
    // For Gold, 1 lot = 100 oz, pip = $0.01 → pip value per lot = $1
    pipValue = 1
  } else if (instrument.includes('JPY')) {
    pipValue = 1000
  } else {
    // Standard forex — 1 lot = 100,000 units, pip = $10
    pipValue = 10
  }

  const positionSize = stopPips > 0 ? riskAmount / (stopPips * pipValue) : 0

  return {
    positionSize: Math.round(positionSize * 100) / 100,
    riskAmount: Math.round(riskAmount * 100) / 100,
    stopPips,
  }
}

export function calcTargets(
  entry: number,
  stop: number,
  direction: 'Long' | 'Short'
): { t1: number; t2: number } {
  const risk = Math.abs(entry - stop)
  const isLong = direction === 'Long'
  return {
    t1: isLong ? entry + risk * 3 : entry - risk * 3,
    t2: isLong ? entry + risk * 5 : entry - risk * 5,
  }
}

export function calcRR(entry: number, stop: number, exit: number, direction: 'Long' | 'Short'): number {
  const risk = Math.abs(entry - stop)
  const reward = direction === 'Long' ? exit - entry : entry - exit
  return risk > 0 ? Math.round((reward / risk) * 100) / 100 : 0
}

export function formatCurrency(val: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(val)
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  })
}
