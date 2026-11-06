export interface Toast {
  id: number
  kind: 'success' | 'error'
  message: string
  detail?: string
}

const toasts = ref<Toast[]>([])
let nextId = 0

function push(kind: Toast['kind'], message: string, detail?: string) {
  const id = ++nextId
  toasts.value.push({ id, kind, message, detail })
  setTimeout(() => dismiss(id), kind === 'error' ? 7000 : 4000)
}

function dismiss(id: number) {
  toasts.value = toasts.value.filter(toast => toast.id !== id)
}

export function useToast() {
  return {
    toasts,
    dismiss,
    success: (message: string) => push('success', message),
    error: (message: string) => push('error', message),
    apiError(cause: unknown) {
      const error = toApiError(cause)
      push('error', error.message, errorCode(error))
    }
  }
}

/** Código para o usuário reportar erros inesperados. */
export function errorCode(error: ApiError) {
  return error.status >= 500 && error.requestId ? `Código do erro: ${error.requestId}` : undefined
}
