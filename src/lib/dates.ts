const DAY = 86_400_000

export function toISODate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function fromISODate(value: string) {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, month - 1, day)
}

export function addDays(days: number, base = new Date()) {
  const date = new Date(base.getFullYear(), base.getMonth(), base.getDate())
  date.setDate(date.getDate() + days)
  return toISODate(date)
}

export function formatDate(
  value: string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
  },
) {
  if (!value) {
    return "No deadline"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "No deadline"
  }

  return date.toLocaleDateString("en-US", options)
}

export function isOverdue(value: string) {
  return (
    fromISODate(value).getTime() <
    new Date(new Date().setHours(0, 0, 0, 0)).getTime()
  )
}

export function daysFromToday(value: string) {
  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((fromISODate(value).getTime() - start.getTime()) / DAY)
}

export function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

export function monthGrid(year: number, month: number) {
  const first = new Date(year, month, 1)
  const start = new Date(year, month, 1 - first.getDay())
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return {
      date,
      iso: toISODate(date),
      currentMonth: date.getMonth() === month,
    }
  })
}
