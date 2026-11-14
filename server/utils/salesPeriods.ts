// Sales report periods for the seller dashboard: Day, Week, Month, Year.
// Dates are grouped in Philippine time (UTC+8, no daylight saving), not the server's time zone.

export type SalesPeriod = 'day' | 'week' | 'month' | 'year'

export const SALES_PERIODS: SalesPeriod[] = ['day', 'week', 'month', 'year']

/** How many bars each chart shows. */
const BUCKET_COUNT: Record<SalesPeriod, number> = { day: 7, week: 8, month: 12, year: 5 }

const PH_OFFSET_MS = 8 * 60 * 60 * 1000
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/** A Date whose UTC fields show the Philippine calendar date and time. */
function phClock(date: Date) {
  return new Date(date.getTime() + PH_OFFSET_MS)
}

const pad = (n: number) => String(n).padStart(2, '0')
const dayKey = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`

/** Monday of the week that contains d (weeks start on Monday). */
function weekStart(d: Date) {
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const weekday = (start.getUTCDay() + 6) % 7 // Monday = 0
  start.setUTCDate(start.getUTCDate() - weekday)
  return start
}

/** The bucket key a Philippine clock date falls in. */
function keyFor(period: SalesPeriod, d: Date) {
  if (period === 'day') return dayKey(d)
  if (period === 'week') return dayKey(weekStart(d))
  if (period === 'month') return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`
  return String(d.getUTCFullYear())
}

interface Bucket {
  key: string
  /** Short label under the bar, e.g. "Nov 14", "Nov", "2026". */
  label: string
  /** Full label for the table and tooltip, e.g. "Fri, Nov 14, 2026" or "Nov 10 – Nov 16, 2026". */
  full_label: string
}

/** The last N buckets for a period, oldest first; the last one is today / this week / this month / this year. */
export function periodBuckets(period: SalesPeriod, now = new Date()): Bucket[] {
  const today = phClock(now)
  const count = BUCKET_COUNT[period]
  const buckets: Bucket[] = []

  for (let i = count - 1; i >= 0; i--) {
    if (period === 'day') {
      const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i))
      buckets.push({
        key: dayKey(d),
        label: `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`,
        full_label: d.toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
      })
    }
    else if (period === 'week') {
      const start = weekStart(today)
      start.setUTCDate(start.getUTCDate() - i * 7)
      const end = new Date(start)
      end.setUTCDate(end.getUTCDate() + 6)
      buckets.push({
        key: dayKey(start),
        label: `${MONTHS[start.getUTCMonth()]} ${start.getUTCDate()}`,
        full_label: `${MONTHS[start.getUTCMonth()]} ${start.getUTCDate()} – ${MONTHS[end.getUTCMonth()]} ${end.getUTCDate()}, ${end.getUTCFullYear()}`,
      })
    }
    else if (period === 'month') {
      const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - i, 1))
      buckets.push({
        key: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`,
        label: MONTHS[d.getUTCMonth()]!,
        full_label: `${MONTHS_LONG[d.getUTCMonth()]} ${d.getUTCFullYear()}`,
      })
    }
    else {
      const year = String(today.getUTCFullYear() - i)
      buckets.push({ key: year, label: year, full_label: year })
    }
  }
  return buckets
}

export interface SaleLine {
  order_id: string | null
  created_at: string
  amount: number
}

export interface PeriodReport {
  categories: string[]
  full_labels: string[]
  revenue: number[]
  orders: number[]
  /** Today / this week / this month / this year. */
  current: { revenue: number; orders: number }
  /** Yesterday / last week / last month / last year. */
  previous: { revenue: number; orders: number }
  /** Sum over every bar in the chart. */
  total: { revenue: number; orders: number }
}

const roundMoney = (n: number) => Math.round(n * 100) / 100

/** Revenue and order counts for every period. An order counts once per bucket, however many items it has. */
export function buildSalesReports(lines: SaleLine[], now = new Date()): Record<SalesPeriod, PeriodReport> {
  const reports = {} as Record<SalesPeriod, PeriodReport>

  for (const period of SALES_PERIODS) {
    const buckets = periodBuckets(period, now)
    const index = new Map(buckets.map((b, i) => [b.key, i]))
    const revenue = buckets.map(() => 0)
    const orderSets = buckets.map(() => new Set<string>())

    for (const line of lines) {
      const at = new Date(line.created_at)
      if (Number.isNaN(at.getTime())) continue
      const i = index.get(keyFor(period, phClock(at)))
      if (i === undefined) continue
      revenue[i]! += line.amount
      if (line.order_id) orderSets[i]!.add(line.order_id)
    }

    const orders = orderSets.map(s => s.size)
    const last = buckets.length - 1
    reports[period] = {
      categories: buckets.map(b => b.label),
      full_labels: buckets.map(b => b.full_label),
      revenue: revenue.map(roundMoney),
      orders,
      current: { revenue: roundMoney(revenue[last] ?? 0), orders: orders[last] ?? 0 },
      previous: { revenue: roundMoney(revenue[last - 1] ?? 0), orders: orders[last - 1] ?? 0 },
      total: {
        revenue: roundMoney(revenue.reduce((a, b) => a + b, 0)),
        orders: new Set(orderSets.flatMap(s => [...s])).size,
      },
    }
  }
  return reports
}
