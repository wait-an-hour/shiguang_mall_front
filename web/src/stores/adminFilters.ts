import { reactive, watch } from 'vue'
import { defineStore } from 'pinia'
import type { ListQuery } from '@/types/admin'

const STORAGE_KEY = 'shiguang-admin-list-filters'
type FilterMap = Record<string, ListQuery>

function readFilters(): FilterMap {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as FilterMap
  } catch {
    return {}
  }
}

export const useAdminFiltersStore = defineStore('adminFilters', () => {
  const filters = reactive<FilterMap>(readFilters())

  watch(filters, () => {
    // 列表筛选条件属于跨页面体验状态，落 localStorage 可保证刷新后仍能回到同一检索上下文。
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters))
  }, { deep: true })

  function getFilter(key: string): ListQuery {
    return { page: 1, pageSize: 10, ...(filters[key] ?? {}) }
  }

  function setFilter(key: string, value: ListQuery) {
    filters[key] = { ...value }
  }

  return { filters, getFilter, setFilter }
})
