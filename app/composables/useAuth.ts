import type { JwtPayload, TokenPair, User } from '~/types/api'

const REFRESH_TOKEN_KEY = 'praxis.refreshToken'

// Estado de módulo: o app só roda no navegador (ssr: false).
const accessToken = shallowRef<string | null>(null)
const userName = ref<string | null>(null)
let pendingRefresh: Promise<boolean> | null = null

function decodeToken(token: string): JwtPayload | null {
  try {
    const segment = token.split('.')[1]!.replace(/-/g, '+').replace(/_/g, '/')
    const bytes = Uint8Array.from(atob(segment), char => char.charCodeAt(0))
    return JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    return null
  }
}

const user = computed(() => (accessToken.value ? decodeToken(accessToken.value) : null))
const isAdmin = computed(() => user.value?.role === 'ADMIN')
const displayName = computed(() => userName.value ?? user.value?.email ?? '')

function storeTokens(tokens: TokenPair) {
  accessToken.value = tokens.accessToken
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
}

function clearSession() {
  accessToken.value = null
  userName.value = null
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

// O nome não vem no token e GET /users é só para ADMIN.
async function loadUserName() {
  if (!isAdmin.value) return
  try {
    const users = await request<User[]>('/users', { token: accessToken.value })
    userName.value = users.find(item => item.id === user.value?.sub)?.name ?? null
  } catch {
    userName.value = null
  }
}

async function runRefresh() {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
  if (!refreshToken) return false
  try {
    storeTokens(await request<TokenPair>('/auth/refresh', { method: 'POST', body: { refreshToken } }))
    return true
  } catch (error) {
    if (error instanceof ApiError && (error.status === 400 || error.status === 401)) clearSession()
    return false
  }
}

/** Renova os tokens. Chamadas simultâneas aguardam o mesmo refresh. */
function refreshSession() {
  pendingRefresh ??= runRefresh().finally(() => {
    pendingRefresh = null
  })
  return pendingRefresh
}

async function restoreSession() {
  if (await refreshSession()) await loadUserName()
}

async function login(credentials: { email: string, password: string }) {
  storeTokens(await request<TokenPair>('/auth/login', { method: 'POST', body: credentials }))
  await loadUserName()
}

async function register(account: { name: string, email: string, password: string }) {
  storeTokens(await request<TokenPair>('/auth/register', { method: 'POST', body: account }))
  await loadUserName()
}

export function useAuth() {
  return {
    accessToken: readonly(accessToken),
    user,
    isAdmin,
    displayName,
    login,
    register,
    logout: clearSession,
    refreshSession,
    restoreSession,
    loadUserName
  }
}
