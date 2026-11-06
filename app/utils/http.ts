export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public requestId: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  query?: Record<string, string | undefined>
  token?: string | null
}

const GENERIC_MESSAGE = 'Ocorreu um erro inesperado. Tente novamente em instantes.'

function resolveMessage(status: number, payload: { message?: string | string[] } | null) {
  if (status === 429) return 'Muitas tentativas em pouco tempo. Aguarde um minuto e tente novamente.'
  if (status >= 500) return GENERIC_MESSAGE
  const message = payload?.message
  if (Array.isArray(message)) return message.join('; ')
  return message || GENERIC_MESSAGE
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, token } = options

  const url = new URL(path, useRuntimeConfig().public.apiBase)
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, value)
  }

  // O header X-Request-Id da resposta não é legível via CORS. Gerando o id aqui,
  // o código mostrado nos erros continua batendo com os logs do backend.
  const requestId = crypto.randomUUID()
  const headers: Record<string, string> = { 'X-Request-Id': requestId }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    })
  } catch {
    throw new ApiError(0, 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.', requestId)
  }

  const text = await response.text()
  let payload = null
  try {
    payload = text ? JSON.parse(text) : null
  } catch {
    // Corpo fora do formato JSON: o tratamento por status abaixo resolve.
  }

  if (!response.ok) {
    throw new ApiError(response.status, resolveMessage(response.status, payload), requestId)
  }
  return payload as T
}
