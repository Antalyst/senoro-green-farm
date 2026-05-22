export default defineNuxtConfig({
  ssr: false,

  app: {
    head: {
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap' },
      ],
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'format-detection', content: 'telephone=no' },
      ],
    },
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    jwtSecret: process.env.NUXT_JWT_SECRET || 'senoro-dev-secret-change-in-prod',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || '',
    public: {
      supabaseUrl: process.env.SUPABASE_URL || '',
      supabaseKey: process.env.SUPABASE_KEY || '',
      apiBaseUrl: process.env.API_BASE_URL || 'https://senoro-green-farm.vercel.app',
    },
  },

  supabase: {

    redirect: false,
    redirectOptions: {
      login: '/auth/login',
      callback: '/auth/login',
      exclude: ['/*'],
    },
  },

  compatibilityDate: '2024-11-01',
  modules: ['@nuxtjs/supabase', '@nuxt/icon', '@nuxtjs/tailwindcss'],
})