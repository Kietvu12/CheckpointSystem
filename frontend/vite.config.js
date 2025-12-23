import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindConfig from './tailwind.config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindConfig],
  css: {
    postcss: './postcss.config.js',
  },
  allowedHosts: [
    "annmarie-unfitted-raylan.ngrok-free.dev"
  ],
  base: '/quanlydiem/'
})
