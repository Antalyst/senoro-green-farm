export function getLastMonthKeys(monthCount = 6): string[] {
  const now = new Date()
  const keys: string[] = []
  for (let i = monthCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return keys
}

export function monthKeyFromIso(iso: string): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function formatMonthLabels(keys: string[]): string[] {
  return keys.map((k) => {
    const [y, m] = k.split('-')
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-US', { month: 'short' })
  })
}

export function emptyMonthlySeries(monthCount = 6) {
  const keys = getLastMonthKeys(monthCount)
  return {
    keys,
    categories: formatMonthLabels(keys),
    revenue: keys.map(() => 0),
    orderCount: keys.map(() => 0),
    orderVolume: keys.map(() => 0),
    fulfilledVolume: keys.map(() => 0),
  }
}
