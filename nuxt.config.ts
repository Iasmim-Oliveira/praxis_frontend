// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  // Os tokens só existem no navegador (a API não usa cookies), então não há o que renderizar no servidor.
  ssr: false,
  // 3000 é a API e 3001 é o Grafana do backend.
  devServer: { port: 4000 },
  css: ['@fontsource-variable/inter', '~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      apiBase: 'http://localhost:3000'
    }
  },
  app: {
    head: {
      title: 'Praxis Diary',
      htmlAttrs: { lang: 'pt-BR' },
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }]
    }
  }
})
