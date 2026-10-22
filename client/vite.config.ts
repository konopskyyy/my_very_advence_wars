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
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
