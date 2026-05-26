import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'AYO MAIN BOLA - Tournament Manager',
        short_name: 'AYO MAIN BOLA',
        description: 'Realtime Tournament and League Management App',
        theme_color: '#121212',
        background_color: '#121212',
        display: 'standalone', // 👈 Bikin aplikasi full-screen tanpa bar browser
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'favicon.png', // 👈 Pastikan file logo baru lu ada di folder public
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'favicon.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})