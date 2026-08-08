import request from '@/utils/request'
import type { Id } from '@/types/common'

export type AssetPurpose = 'AVATAR' | 'SHOP_LOGO' | 'BRAND_LOGO' | 'PRODUCT_COVER' | 'PRODUCT_GALLERY' | 'SKU_IMAGE' | 'RICH_TEXT_IMAGE' | 'AFTER_SALE_EVIDENCE' | 'APPEAL_EVIDENCE'

export interface AssetUploadView {
  id: Id
  assetNo: string
  purpose: AssetPurpose
  bucket: string
  objectKey: string
  originalFilename: string
  contentType: string
  sizeBytes: number
  sha256: string
  url: string
  createdAt: string
}

export async function uploadImage(file: File, purpose: AssetPurpose, shopId?: Id) {
  const body = new FormData()
  body.append('file', file)
  body.append('purpose', purpose)
  if (shopId) body.append('shopId', shopId)
  return request.post<AssetUploadView>('/assets/images', body, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }) as unknown as Promise<AssetUploadView>
}
