/** Carrega dados ao criar e descarta respostas que chegarem fora de ordem. */
export function useResource<T>(fetcher: () => Promise<T>) {
  const data = shallowRef<T>()
  const error = shallowRef<ApiError | null>(null)
  const pending = ref(true)
  let lastRun = 0

  async function refresh() {
    const run = ++lastRun
    pending.value = true
    try {
      const result = await fetcher()
      if (run !== lastRun) return
      data.value = result
      error.value = null
    } catch (cause) {
      if (run === lastRun) error.value = toApiError(cause)
    } finally {
      if (run === lastRun) pending.value = false
    }
  }

  refresh()
  return { data, error, pending, refresh }
}

export function toApiError(cause: unknown) {
  return cause instanceof ApiError ? cause : new ApiError(0, 'Ocorreu um erro inesperado. Tente novamente.', '')
}
