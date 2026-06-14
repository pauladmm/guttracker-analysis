import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // El servidor sigue escuchando solo en localhost (sin exponer a la red,
    // así no hace falta abrir el firewall). El acceso desde el móvil se hace
    // vía túnel de Cloudflare (npm run dev:mobile), que conecta de salida.
    // Permitimos los dominios *.trycloudflare.com para que Vite no bloquee
    // las peticiones que llegan a través del túnel.
    allowedHosts: ['.trycloudflare.com'],
  },
})
