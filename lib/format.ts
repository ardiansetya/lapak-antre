const one = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 })

export const formatMinutes = (n: number | null) => (n == null ? "-" : `${one.format(n)} mnt`)
export const formatPercent = (n: number | null) => (n == null ? "-" : `${one.format(n * 100)}%`)
export const formatNumber = (n: number) => one.format(n)
