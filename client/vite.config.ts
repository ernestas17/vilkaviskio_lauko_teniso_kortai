import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    // Proxy /api/* to the deployed backend during development.
    proxy: {
      '/api': {
        target: 'https://white-ostrich-337999.hostingersite.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
