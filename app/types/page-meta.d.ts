import type { Role } from './api'

declare module '#app' {
  interface PageMeta {
    /** Rota acessível sem login (login e cadastro). */
    public?: boolean
    /** Papel exigido para abrir a rota. */
    role?: Role
  }
}

export {}
