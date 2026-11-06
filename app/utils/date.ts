import type { Appointment } from '~/types/api'

const LOCALE = 'pt-BR'

export const BUSINESS_START_HOUR = 8
export const BUSINESS_END_HOUR = 18
export const CANCEL_NOTICE_MINUTES = 60

export const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())
export const endOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
export const addDays = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
export const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1)
export const endOfMonth = (date: Date) => endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0))
export const addMonths = (date: Date, months: number) => new Date(date.getFullYear(), date.getMonth() + months, 1)

/** A semana começa na segunda-feira. */
export function startOfWeek(date: Date) {
  return addDays(date, -((date.getDay() + 6) % 7))
}

export const endOfWeek = (date: Date) => endOfDay(addDays(startOfWeek(date), 6))

export const isSameDay = (a: Date, b: Date) => startOfDay(a).getTime() === startOfDay(b).getTime()

export function eachDay(from: Date, to: Date) {
  const days: Date[] = []
  for (let day = startOfDay(from); day <= to; day = addDays(day, 1)) days.push(day)
  return days
}

/** Data local no formato YYYY-MM-DD. */
export function toDateParam(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function parseDateParam(value: unknown) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split('-').map(Number) as [number, number, number]
  const date = new Date(year, month - 1, day)
  return date.getMonth() === month - 1 ? date : null
}

export function formatTime(value: string | Date) {
  return new Date(value).toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' })
}

export const formatTimeRange = (start: string, end: string) => `${formatTime(start)} – ${formatTime(end)}`

export function formatDate(value: string | Date, options: Intl.DateTimeFormatOptions) {
  return new Date(value).toLocaleDateString(LOCALE, options).replace(/\.$/, '')
}

export const formatLongDate = (value: string | Date) =>
  formatDate(value, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

export const formatMonthYear = (value: Date) => formatDate(value, { month: 'long', year: 'numeric' })

export function formatWeekday(value: Date) {
  return formatDate(value, { weekday: 'short' }).replace('.', '')
}

export function formatRelative(value: string) {
  const seconds = (new Date(value).getTime() - Date.now()) / 1000
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['day', 86_400],
    ['hour', 3600],
    ['minute', 60]
  ]
  const formatter = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' })
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return formatter.format(Math.round(seconds / size), unit)
  }
  return 'agora mesmo'
}

/** Minutos ocupados dentro do período. */
export function bookedMinutes(appointments: Appointment[], from: Date, to: Date) {
  return appointments.reduce((total, { startsAt, endsAt, status }) => {
    if (status !== 'SCHEDULED') return total
    const start = Math.max(new Date(startsAt).getTime(), from.getTime())
    const end = Math.min(new Date(endsAt).getTime(), to.getTime())
    return total + Math.max(end - start, 0) / 60_000
  }, 0)
}

export const businessHoursPerDay = BUSINESS_END_HOUR - BUSINESS_START_HOUR

export function canCancel(appointment: Appointment, now = new Date()) {
  if (appointment.status !== 'SCHEDULED') return false
  const minutesLeft = (new Date(appointment.startsAt).getTime() - now.getTime()) / 60_000
  return minutesLeft >= CANCEL_NOTICE_MINUTES
}
