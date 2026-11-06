export default defineNuxtRouteMiddleware((to) => {
  const { user } = useAuth()

  if (to.meta.public) {
    return user.value ? navigateTo('/') : undefined
  }
  if (!user.value) {
    return navigateTo({ path: '/login', query: to.fullPath === '/' ? {} : { redirect: to.fullPath } })
  }
  if (to.meta.role && to.meta.role !== user.value.role) {
    useToast().error('Você não tem permissão para acessar esta página.')
    return navigateTo('/')
  }
})
