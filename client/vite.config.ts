import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    base: command === 'build' ? './' : '/',
    server: {
      // host: true — bez tego Vite nie wyjdzie poza kontener i mapping portu nie zadziała.
      host: true,
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': {
          target: env.API_PROXY_TARGET ?? 'http://nginx',
          changeOrigin: true,
        },
      },
    },
    optimizeDeps: {
      include: ['phaser'],
    },
    build: {
      outDir: '../server/public/game',
      emptyOutDir: true,
      target: 'es2022',
      // Phaser traktuje każde `data:` URL jak base64, a Vite 8 wstawia małe
      // pliki jako zakodowany procentowo data URI — wtedy ładowanie SVG pada.
      assetsInlineLimit: 0,
    },
    test: {
      include: ['tests/**/*.test.ts'],
    },
  };
});
