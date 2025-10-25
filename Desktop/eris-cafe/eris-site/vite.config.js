import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'set-coop-header',
      configureServer: (server) => {
        // THIS LINE WILL PRINT TO YOUR TERMINAL
        console.log("✅ VITE CONFIG PLUGIN LOADED!"); 

        server.middlewares.use((req, res, next) => {
          res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
          next();
        });
      },
    },
  ],
})