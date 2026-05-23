import type { Options, SeriesOptionsType } from 'highcharts'

export const FARM_CHART_COLORS = {
  deep: '#2F5D3A',
  leaf: '#4E8B57',
  yellow: '#D9C84B',
  light: '#EEF5EE',
  dark: '#1A3521',
} as const

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
  const FARM = FARM_CHART_COLORS

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
      align: 'left',
      verticalAlign: 'top',
      itemStyle: { color: FARM.dark, fontWeight: '500', fontSize: '11px' },
      itemHoverStyle: { color: FARM.deep },
      symbolRadius: 0,
    },
    tooltip: {
      backgroundColor: '#FFFFFF',
      borderColor: FARM.light,
      borderRadius: 0,
      style: { color: FARM.dark, fontSize: '12px' },
      shadow: false,
    },
    plotOptions: {
      series: {
        animation: { duration: 600 },
        lineWidth: 2,
        marker: { enabled: false, radius: 3, symbol: 'circle' },
      },
      column: {
        borderWidth: 0,
        borderRadius: 0,
        pointPadding: 0.12,
        groupPadding: 0.18,
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
            [0, `${s.color ?? FARM.leaf}4D`],
            [1, `${s.color ?? FARM.leaf}00`],
          ],
        },
        lineColor: s.color ?? FARM.leaf,
      })) as SeriesOptionsType[],
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
      })) as SeriesOptionsType[],
    }
  }

  function sellerDualAxisOptions(
    categories: string[],
    revenue: number[],
    orderCount: number[],
    opts?: Partial<Options>,
  ): Options {
    return {
      ...baseChart,
      ...opts,
      chart: {
        ...baseChart.chart,
        height: 300,
        ...(opts?.chart ?? {}),
      },
      xAxis: { ...baseChart.xAxis, categories },
      yAxis: [
        {
          gridLineColor: FARM.light,
          gridLineWidth: 1,
          title: { text: undefined },
          labels: {
            style: { color: FARM.dark, fontSize: '10px', opacity: 0.65 },
            formatter() {
              const v = Number(this.value)
              if (v >= 1000) return `₱${(v / 1000).toFixed(0)}k`
              return `₱${v}`
            },
          },
        },
        {
          opposite: true,
          gridLineWidth: 0,
          title: { text: undefined },
          labels: {
            style: { color: FARM.dark, fontSize: '10px', opacity: 0.65 },
          },
          allowDecimals: false,
        },
      ],
      tooltip: {
        ...baseChart.tooltip,
        shared: true,
      },
      series: [
        {
          type: 'areaspline',
          name: 'Monthly revenue',
          data: revenue,
          yAxis: 0,
          color: FARM.leaf,
          fillColor: {
            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
            stops: [
              [0, `${FARM.leaf}4D`],
              [1, `${FARM.leaf}00`],
            ],
          },
          lineColor: FARM.leaf,
          tooltip: {
            pointFormatter() {
              return `<span style="color:${FARM.leaf}">●</span> Revenue: <b>₱${Number(this.y).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b><br/>`
            },
          },
        },
        {
          type: 'column',
          name: 'Monthly orders',
          data: orderCount,
          yAxis: 1,
          color: FARM.deep,
          tooltip: {
            pointFormatter() {
              return `<span style="color:${FARM.deep}">●</span> Orders: <b>${this.y}</b><br/>`
            },
          },
        },
      ] as SeriesOptionsType[],
    }
  }

  function platformGrowthOptions(
    categories: string[],
    orderVolume: number[],
    fulfilledVolume: number[],
    opts?: Partial<Options>,
  ): Options {
    return lineChartOptions(
      categories,
      [
        { name: 'Platform orders', data: orderVolume, color: FARM.deep },
        { name: 'Fulfilled deliveries', data: fulfilledVolume, color: FARM.leaf },
      ],
      {
        chart: { height: 300 },
        ...opts,
      },
    )
  }

  function roleDonutOptions(
    slices: { name: string; y: number; color: string }[],
    opts?: Partial<Options>,
  ): Options {
    return {
      ...baseChart,
      ...opts,
      chart: {
        ...baseChart.chart,
        type: 'pie',
        height: 300,
        ...(opts?.chart ?? {}),
      },
      xAxis: { visible: false },
      yAxis: { visible: false },
      legend: {
        ...baseChart.legend,
        align: 'center',
        verticalAlign: 'bottom',
      },
      plotOptions: {
        pie: {
          innerSize: '62%',
          borderWidth: 0,
          borderColor: '#FFFFFF',
          dataLabels: {
            enabled: true,
            distance: 14,
            style: {
              color: FARM.dark,
              fontSize: '10px',
              fontWeight: '500',
              textOutline: 'none',
            },
            format: '{point.name}<br/><b>{point.percentage:.1f}%</b>',
          },
          showInLegend: true,
        },
      },
      tooltip: {
        ...baseChart.tooltip,
        pointFormat: '<b>{point.y}</b> accounts ({point.percentage:.1f}%)',
      },
      series: [
        {
          type: 'pie',
          name: 'Users',
          data: slices.map(s => ({
            name: s.name,
            y: s.y,
            color: s.color,
          })),
        },
      ] as SeriesOptionsType[],
    }
  }

  return {
    FARM,
    baseChart,
    areaChartOptions,
    lineChartOptions,
    sellerDualAxisOptions,
    platformGrowthOptions,
    roleDonutOptions,
    aggregateByMonth,
  }
}
