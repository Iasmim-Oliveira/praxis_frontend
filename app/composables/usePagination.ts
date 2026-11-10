import type { Ref } from 'vue'

/** Paginação no cliente: a API retorna as listas completas. */
export function usePagination<T>(items: Ref<T[]>, pageSize = 10) {
  const page = ref(1)
  const pageItems = computed(() => items.value.slice((page.value - 1) * pageSize, page.value * pageSize))

  watch(() => items.value.length, (length) => {
    page.value = Math.min(page.value, Math.max(Math.ceil(length / pageSize), 1))
  })

  return { page, pageItems, pageSize }
}
