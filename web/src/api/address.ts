import request from '@/utils/request'
import type { Id, Timestamp } from '@/types/common'

export interface AddressView {
  id: Id
  recipientName: string
  recipientPhone: string
  provinceName: string
  cityName: string
  districtName: string
  detailAddress: string
  isDefault: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface AddressUpsertRequest {
  recipientName: string
  recipientPhone: string
  provinceName: string
  cityName: string
  districtName: string
  detailAddress: string
  isDefault: boolean
}

export async function getAddressList() {
  return await request.get<AddressView[]>('/addresses') as unknown as AddressView[]
}

export async function createAddress(data: AddressUpsertRequest) {
  return await request.post<AddressView>('/addresses', data) as unknown as AddressView
}

export async function updateAddress(addressId: Id, data: AddressUpsertRequest) {
  return await request.put<AddressView>(`/addresses/${addressId}`, data) as unknown as AddressView
}

export async function deleteAddress(addressId: Id) {
  await request.delete(`/addresses/${addressId}`)
}

export async function setDefaultAddress(addressId: Id) {
  return await request.post<AddressView>(`/addresses/${addressId}/default`) as unknown as AddressView
}
