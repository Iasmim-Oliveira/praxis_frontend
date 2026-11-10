import type { RequestOptions } from '~/utils/http'

/** Requisição autenticada: em 401, renova a sessão e repete uma única vez. */
export async function api<T>(path: string, options: Omit<RequestOptions, 'token'> = {}): Promise<T> {
  const { accessToken, refreshSession } = useAuth()
  try {
    return await request<T>(path, { ...options, token: accessToken.value })
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error
    if (!(await refreshSession())) {
      // Sem token é sessão encerrada; com token, o refresh só falhou por rede.
      if (!accessToken.value) {
        await navigateTo({ path: '/login', query: { redirect: useRouter().currentRoute.value.fullPath } })
      }
      throw error
    }
    return request<T>(path, { ...options, token: accessToken.value })
  }
}
