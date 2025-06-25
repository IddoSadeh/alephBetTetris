import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/alephBetTetris/', // Replace with your GitHub repo name
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      }
    }
  }
});