import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Forwards /api to Flask (python -m backend.app), no CORS needed
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
})
