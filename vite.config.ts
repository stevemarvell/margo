import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,

      pwaAssets: {
        disabled: false,
        config: true,
      },

      manifest: {
        name: 'Multi-Agent Grid World Simulation',
        short_name: 'Grid World',
        description: 'A Progressive Web App for simulating multi-agent systems in a grid environment',
        theme_color: '#3880ff',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
      },

      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
      },

      devOptions: {
        enabled: false,
        navigateFallback: 'index.html',
        suppressWarnings: true,
        type: 'module',
      },
    })
  ],
  server: {
    port: 3000,
    open: true
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ionic: ['@ionic/react', '@ionic/react-router']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@ionic/react', '@ionic/react-router']
  },
  define: {
    global: 'globalThis'
  }
});