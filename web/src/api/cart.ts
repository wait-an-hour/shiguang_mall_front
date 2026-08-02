import request from '@/utils/request'
import type { Id, Money, Timestamp } from '@/types/common'
import type { AddressView } from '@/api/address'

export interface CartItemView {
  id: Id
  skuId: Id
  spuId: Id
  productName: string
  skuName: string
  spec: Record<string, string>
  imageUrl: string | null
  quantity: number
  selected: boolean
  currentSalePrice: Money
  availableQuantity: number
  valid: boolean
  invalidReason: string | null
  updatedAt: Timestamp
}

export interface CartShopGroupView {
  shop: { id: Id; shopNo: string; shopName: string; logoUrl: string | null; status: string }
  items: CartItemView[]
}

export interface CartView {
  shops: CartShopGroupView[]
  selectedItemCount: number
  selectedQuantity: number
  selectedAmount: Money
}

export interface CheckoutItemView {
  cartItemId: Id
  skuId: Id
  productName: string
  skuName: string
  unitPrice: Money
  quantity: number
  originalAmount: Money
  freightAmount: Money
  payableAmount: Money
  valid: boolean
  invalidReason: string | null
}

export interface CheckoutShopGroupView {
  shop: CartShopGroupView['shop']
  items: CheckoutItemView[]
  itemAmount: Money
  freightAmount: Money
  payableAmount: Money
  buyerRemark?: string | null
}

export interface CheckoutPreviewView {
  address: AddressView | null
  shops: CheckoutShopGroupView[]
  itemAmount: Money
  freightAmount: Money
  payableAmount: Money
  submittable: boolean
  invalidItems: Array<{ cartItemId: Id; skuId: Id; reason: string; message: string }>
}

export interface UpdateCartItemRequest {
  quantity?: number
  selected?: boolean
}

export interface CheckoutPreviewRequest {
  cartItemIds?: Id[]
  addressId?: Id
  shopRemarks?: Record<Id, string>
}

export function getCart() {
  return request.get<CartView>('/cart') as unknown as Promise<CartView>
}

export function addCartItem(data: { skuId: Id; quantity: number }) {
  return request.post<CartItemView>('/cart/items', data) as unknown as Promise<CartItemView>
}

export function updateCartItem(cartItemId: Id, data: UpdateCartItemRequest) {
  return request.patch<CartItemView>(`/cart/items/${cartItemId}`, data) as unknown as Promise<CartItemView>
}

export async function deleteCartItem(cartItemId: Id) {
  await request.delete(`/cart/items/${cartItemId}`)
}

export function updateCartSelection(data: { cartItemIds: Id[]; selected: boolean }) {
  return request.put<CartView>('/cart/selection', data) as unknown as Promise<CartView>
}

export function previewCheckout(data: CheckoutPreviewRequest) {
  return request.post<CheckoutPreviewView>('/trades/preview', data) as unknown as Promise<CheckoutPreviewView>
}
