const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');
const path = require('node:path');

module.exports = defineConfig({
  root: __dirname,
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api': 'http://localhost:3000'
    }
  },
  build: {
    outDir: path.resolve(__dirname, '../dist'),
    emptyOutDir: true
  }
});
