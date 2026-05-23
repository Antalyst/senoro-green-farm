import type { Options } from 'highcharts'

const FARM = {
  deep: '#2F5D3A',
  leaf: '#4E8B57',
  yellow: '#D9C84B',
  light: '#EEF5EE',
  dark: '#1A3521',
}

/** Aggregate numeric values by YYYY-MM from ISO date strings */
export function aggregateByMonth<T extends { created_at: string }>(
  rows: T[],
  valueFn: (row: T) => number,
  monthCount = 6,
): { categories: string[]; data: number[] } {
  const now = new Date()
  const keys: string[] = []
  for (let i = monthCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  const sums = new Map(keys.map(k => [k, 0]))
  for (const row of rows) {
    if (!row.created_at) continue
    const d = new Date(row.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (sums.has(key)) sums.set(key, (sums.get(key) ?? 0) + valueFn(row))
  }
  const labels = keys.map((k) => {
    const [, m] = k.split('-')
    const date = new Date(Number(k.split('-')[0]), Number(m) - 1, 1)
    return date.toLocaleDateString('en-US', { month: 'short' })
  })
  return { categories: labels, data: keys.map(k => sums.get(k) ?? 0) }
}

export function useFarmChartTheme() {
  const baseChart: Partial<Options> = {
    chart: {
      backgroundColor: 'transparent',
      style: { fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' },
      spacing: [12, 8, 16, 8],
    },
    credits: { enabled: false },
    title: { text: undefined },
    xAxis: {
      lineColor: FARM.light,
      tickColor: FARM.light,
      labels: {
        style: { color: FARM.dark, fontSize: '10px', fontWeight: '500' },
      },
      gridLineWidth: 0,
    },
    yAxis: {
      gridLineColor: FARM.light,
      gridLineWidth: 1,
      title: { text: undefined },
      labels: {
        style: { color: FARM.dark, fontSize: '10px', opacity: 0.65 },
      },
    },
    legend: {
      itemStyle: { color: FARM.dark, fontWeight: '500', fontSize: '11px' },
      itemHoverStyle: { color: FARM.deep },
    },
    tooltip: {
      backgroundColor: '#ffffff',
      borderColor: FARM.light,
      borderRadius: 0,
      style: { color: FARM.dark, fontSize: '12px' },
      shadow: false,
    },
    plotOptions: {
      series: {
        animation: { duration: 600 },
        lineWidth: 2,
        marker: { enabled: false, radius: 3 },
      },
    },
  }

  function areaChartOptions(
    categories: string[],
    series: { name: string; data: number[]; color?: string }[],
    opts?: Partial<Options>,
  ): Options {
    return {
      ...baseChart,
      ...opts,
      chart: { ...baseChart.chart, type: 'areaspline', ...(opts?.chart ?? {}) },
      xAxis: { ...baseChart.xAxis, categories },
      series: series.map(s => ({
        type: 'areaspline',
        name: s.name,
        data: s.data,
        color: s.color ?? FARM.leaf,
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, `${s.color ?? FARM.leaf}33`],
            [1, `${s.color ?? FARM.leaf}00`],
          ],
        },
        lineColor: s.color ?? FARM.leaf,
      })),
    }
  }

  function lineChartOptions(
    categories: string[],
    series: { name: string; data: number[]; color?: string }[],
    opts?: Partial<Options>,
  ): Options {
    return {
      ...baseChart,
      ...opts,
      chart: { ...baseChart.chart, type: 'spline', ...(opts?.chart ?? {}) },
      xAxis: { ...baseChart.xAxis, categories },
      series: series.map(s => ({
        type: 'spline',
        name: s.name,
        data: s.data,
        color: s.color ?? FARM.deep,
      })),
    }
  }

  return { FARM, baseChart, areaChartOptions, lineChartOptions, aggregateByMonth }
}
