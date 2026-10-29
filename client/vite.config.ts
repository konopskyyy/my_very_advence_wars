import { defineConfig } from 'vitest/config';

export default defineConfig({
  server: {
    // host: true — bez tego Vite nie wyjdzie poza kontener i mapping portu nie zadziała.
    host: true,
    port: 5173,
    strictPort: true,
  },
  optimizeDeps: {
    include: ['phaser'],
  },
  build: {
    outDir: 'dist',
    target: 'es2022',
    // Phaser traktuje każde `data:` URL jak base64, a Vite 8 wstawia małe
    // pliki jako zakodowany procentowo data URI — wtedy ładowanie SVG pada.
    assetsInlineLimit: 0,
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
