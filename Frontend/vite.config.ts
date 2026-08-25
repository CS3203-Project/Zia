import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react() ,tailwindcss(),],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.NODE_ENV === 'production' 
          ? 'https://zia-tgsix.ondigitalocean.app' 
          : 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;

          if (id.includes('/leaflet/') || id.includes('/react-leaflet/')) {
            return 'maps';
          }
          if (id.includes('/recharts/') || id.includes('/chart.js/') || id.includes('/react-chartjs-2/')) {
            return 'charts';
          }
          if (id.includes('/jspdf/')) {
            return 'pdf';
          }
          if (id.includes('/framer-motion/')) {
            return 'motion';
          }
          if (id.includes('/qrcode/') || id.includes('/react-qr-code/')) {
            return 'qrcode';
          }
          if (id.includes('/socket.io-client/') || id.includes('/engine.io-client/') || id.includes('/socket.io-parser/')) {
            return 'socket';
          }
          if (id.includes('/ogl/')) {
            return 'ogl';
          }

          return undefined;
        }
      }
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: false,
    allowedHosts: [
      'zia-tgsix.ondigitalocean.app',
      '.ondigitalocean.app', // Allow all DigitalOcean app platform hosts
      'localhost',
      '127.0.0.1',
      '16.16.252.221'
    ]
  }
})
