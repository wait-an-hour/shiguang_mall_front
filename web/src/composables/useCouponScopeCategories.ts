import { ref, shallowRef } from 'vue'
import { getCategoryTree, type CategoryNode } from '@/api/product'

export function useCouponScopeCategories() {
  const categoryTree = ref<CategoryNode[]>([])
  const categoriesLoading = shallowRef(false)

  async function loadCategories() {
    if (categoriesLoading.value || categoryTree.value.length) return

    categoriesLoading.value = true
    try {
      categoryTree.value = await getCategoryTree()
    } finally {
      categoriesLoading.value = false
    }
  }

  return {
    categoryTree,
    categoriesLoading,
    loadCategories
  }
}
