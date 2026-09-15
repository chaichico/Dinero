export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@vite-pwa/nuxt'],
  css: ['~/assets/css/main.css'],
  typescript: { strict: true, typeCheck: true },
  app: { head: { title: 'Dinero — private money ledger', meta: [{ name: 'theme-color', content: '#f4efe6' }] } },
  runtimeConfig: { public: { apiBase: process.env.API_BASE_URL ?? 'http://localhost:3001', featureScan: false, featureSplits: false } },
  pwa: {
    registerType: 'autoUpdate',
    manifest: { name: 'Dinero', short_name: 'Dinero', description: 'Private income, expense, account, and transfer ledger', theme_color: '#f4efe6', background_color: '#f4efe6', display: 'standalone', lang: 'en', icons: [] },
    workbox: { navigateFallback: '/' }
  }
})
