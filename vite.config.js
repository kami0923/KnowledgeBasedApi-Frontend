import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // The API's CORS policy (Program.cs "AllowViteDev") only allows http://localhost:5173.
    // Without strictPort Vite would silently fall back to 5174, where every API call fails.
    strictPort: true
  }
})
