export type Id = string
export type Money = string
export type Timestamp = string

export interface ApiResponse<T> {
  code: string
  message: string
  data: T
  requestId: string
  timestamp: Timestamp
}

export interface ApiErrorDetail {
  field?: string
  reason: string
}

export interface ApiErrorResponse {
  code: string
  message: string
  details?: ApiErrorDetail[]
  requestId: string
  timestamp: Timestamp
}

export interface PageMetric {
  key: string
  label: string
  value: string
  description: string
  tone: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  routeName?: string
  query?: Record<string, string>
}

export interface PageView<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}
