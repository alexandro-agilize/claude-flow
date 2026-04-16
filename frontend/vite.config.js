import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/flows': 'http://localhost:3000',
      '/run':   'http://localhost:3000',
      '/webhook': 'http://localhost:3000',
      '/queue': 'http://localhost:3000',
    },
  },
});
