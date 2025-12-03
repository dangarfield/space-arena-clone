import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import buildDataPlugin from './vite-plugin-build-data.js';

export default defineConfig({
  plugins: [buildDataPlugin(), solid()],
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../dist'
  }
});
