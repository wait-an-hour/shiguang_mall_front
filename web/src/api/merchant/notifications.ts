import request from '@/utils/request'
import type { Id, PageView, Timestamp } from '@/types/common'

export type MerchantNotificationType = 'AFTER_SALE_APPEAL_SUBMITTED' | 'AFTER_SALE_APPEAL_DECIDED'

export interface MerchantNotificationView {
  id: Id
  notificationType: MerchantNotificationType
  appealId: Id
  afterSaleId: Id
  title: string
  content: string
  readAt: Timestamp | null
  createdAt: Timestamp
}

export interface MerchantNotificationQuery {
  unreadOnly?: boolean
  notificationType?: MerchantNotificationType
  page?: number
  pageSize?: number
}

export function listMerchantNotifications(shopId: Id, params: MerchantNotificationQuery = {}) {
  return request.get<PageView<MerchantNotificationView>>(`/shops/${shopId}/notifications`, { params }) as unknown as Promise<PageView<MerchantNotificationView>>
}

export function markMerchantNotificationRead(shopId: Id, notificationId: Id) {
  return request.post<MerchantNotificationView>(`/shops/${shopId}/notifications/${notificationId}/read`) as unknown as Promise<MerchantNotificationView>
}
