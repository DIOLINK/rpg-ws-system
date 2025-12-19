import react from '@vitejs/plugin-react';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
  },
  build: {
    sourcemap: false, // Deshabilitar mapas de origen en producción
    rollupOptions: {
      input: {
        main: resolve(dirname(fileURLToPath(import.meta.url)), 'index.html'),
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(dirname(fileURLToPath(import.meta.url)), 'src'),
    },
  },
});
