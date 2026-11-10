/** Hora atual, atualizada a cada 30 segundos. */
export function useNow() {
  const now = ref(new Date())
  const timer = setInterval(() => {
    now.value = new Date()
  }, 30_000)
  onScopeDispose(() => clearInterval(timer))
  return now
}
