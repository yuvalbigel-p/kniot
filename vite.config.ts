import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const base = '/kniot/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png', 'icon.svg'],
      workbox: { globPatterns: ['**/*.{js,css,html,woff2,svg,png}'], navigateFallback: `${base}index.html` },
      manifest: {
        name: 'קניות',
        short_name: 'קניות',
        lang: 'he',
        dir: 'rtl',
        display: 'standalone',
        background_color: '#FAF4E9',
        theme_color: '#FAF4E9',
        start_url: base,
        scope: base,
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  test: { environment: 'node' },
});
