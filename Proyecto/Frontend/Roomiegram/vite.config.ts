import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,        // expone en 0.0.0.0 para ser accesible desde fuera del contenedor
    allowedHosts: [
      "roomiegram.duckdns.org",
      "184.73.101.23",
      "localhost",
      "127.0.0.1",
    ],
    port: 5173,
    strictPort: true,  // falla si el puerto está ocupado en vez de cambiar silenciosamente
  },
})
