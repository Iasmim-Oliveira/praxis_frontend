// O access token fica só em memória: antes da primeira rota, recupera a sessão pelo refresh token.
export default defineNuxtPlugin(async () => {
  await useAuth().restoreSession()
})
