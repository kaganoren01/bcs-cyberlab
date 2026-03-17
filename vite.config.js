import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('recharts'))     return 'vendor-charts';
          if (id.includes('react-markdown') || id.includes('remark-gfm')) return 'vendor-markdown';
          if (id.includes('lucide-react')) return 'vendor-icons';
          if (id.includes('node_modules')) return 'vendor';
        },
      },
    },
  },
})
