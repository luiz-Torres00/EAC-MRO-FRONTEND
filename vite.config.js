import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    vue(),
    // Transforma o site em app instalável (PWA) no Android e no iPhone —
    // ver anotações completas em claude/eac-mro-notas.md do projeto.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon-32.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'EAC MRO — Controle de Empréstimos',
        short_name: 'EAC MRO',
        description: 'Controle de empréstimo e cessão de material entre setores (MRO).',
        start_url: '/',
        display: 'standalone',
        background_color: '#0d1119',
        theme_color: '#001a70',
        orientation: 'portrait-primary',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Nunca guarda em cache as respostas da API — o app tem que sempre
        // mostrar dados atuais (pedidos, notificações, aprovações etc.),
        // nunca uma versão antiga guardada no celular. Só o "esqueleto" do
        // app (HTML/JS/CSS/ícones) fica em cache, pra abrir instantâneo.
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/eac-mro-backend\.onrender\.com\/api\//,
            handler: 'NetworkOnly',
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
