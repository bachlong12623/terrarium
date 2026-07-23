import { defineConfig } from 'vite';

export default defineConfig({
  base: '/terrarium/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
