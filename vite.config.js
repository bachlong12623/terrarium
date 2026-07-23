import { defineConfig } from 'vite';

// Vite is only used as a local dev server (`npm run dev`).
// Deployment serves the repository as-is from the main branch (GitHub Pages).
export default defineConfig({
  base: './',
  publicDir: false,
});
