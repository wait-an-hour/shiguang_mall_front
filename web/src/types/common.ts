export type Id = string
export type Money = string
export type Timestamp = string

export interface PageMetric {
  key: string
  label: string
  value: string
  description: string
  tone: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  routeName?: string
  query?: Record<string, string>
}
