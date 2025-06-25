import { defineConfig } from 'vite';
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  base: '/ALEPHBETTETRIS/', // Replace with your GitHub repo name
  plugins: [
    viteStaticCopy({
      targets: [
        { src: 'fonts/**/*', dest: 'fonts' },
        { src: 'images/**/*', dest: 'images' },
        { src: 'icon/**/*', dest: 'icon' },
        { src: '98.css', dest: '.' },
        { src: 'styles.css', dest: '.' }
      ]
    })
  ],
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