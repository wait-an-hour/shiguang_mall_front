import { readonly, shallowRef } from 'vue'
import type { Id } from '@/types/common'

export interface CouponScopeProductOption {
  id: Id
  productNo: string
  productName: string
}

export interface CouponScopeSkuOption {
  id: Id
  skuNo: string
  skuName: string
  productId: Id
  productName: string
}

export interface CouponScopeProductDetail extends CouponScopeProductOption {
  skus: CouponScopeSkuOption[]
}

interface CouponScopeProductSource {
  listProducts: (keyword: string, pageSize: number) => Promise<CouponScopeProductOption[]>
  getProductDetail: (productId: Id) => Promise<CouponScopeProductDetail>
}

function mergeOptions<T extends { id: Id }>(current: T[], next: T[]) {
  const options = new Map(current.map((item) => [item.id, item]))
  next.forEach((item) => options.set(item.id, item))
  return [...options.values()]
}

export function useCouponScopeProducts(source: CouponScopeProductSource) {
  const productOptions = shallowRef<CouponScopeProductOption[]>([])
  const skuOptions = shallowRef<CouponScopeSkuOption[]>([])
  const productsLoading = shallowRef(false)
  const skusLoading = shallowRef(false)
  let productRequestVersion = 0
  let skuRequestVersion = 0

  function addProductOptions(options: CouponScopeProductOption[]) {
    productOptions.value = mergeOptions(productOptions.value, options)
  }

  function addSkuOptions(options: CouponScopeSkuOption[]) {
    skuOptions.value = mergeOptions(skuOptions.value, options)
  }

  async function searchProducts(keyword = '') {
    const requestVersion = ++productRequestVersion
    productsLoading.value = true
    try {
      const options = await source.listProducts(keyword.trim(), 50)
      if (requestVersion === productRequestVersion) addProductOptions(options)
    } finally {
      if (requestVersion === productRequestVersion) productsLoading.value = false
    }
  }

  async function searchSkus(keyword = '') {
    const requestVersion = ++skuRequestVersion
    skusLoading.value = true
    try {
      const products = await source.listProducts(keyword.trim(), 20)
      const details = await Promise.all(products.map((product) => source.getProductDetail(product.id)))
      if (requestVersion !== skuRequestVersion) return

      addProductOptions(products)
      addSkuOptions(details.flatMap((detail) => detail.skus))
    } finally {
      if (requestVersion === skuRequestVersion) skusLoading.value = false
    }
  }

  return {
    productOptions: readonly(productOptions),
    skuOptions: readonly(skuOptions),
    productsLoading: readonly(productsLoading),
    skusLoading: readonly(skusLoading),
    addProductOptions,
    addSkuOptions,
    searchProducts,
    searchSkus
  }
}
