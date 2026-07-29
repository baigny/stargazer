import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    root: 'web',         // index.html lives at web/index.html
    publicDir: 'public', // static assets served from web/public/ → /
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'web/src'),
      },
    },
    server: {
      port: 8080,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'http://localhost:8181',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  };
});
