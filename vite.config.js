import { defineConfig } from 'vite';

// base './' — сборку из dist/ можно выложить в любую папку (Vercel, GitHub Pages, свой хостинг)
export default defineConfig({
  base: './',
  build: { chunkSizeWarningLimit: 900 },
});
