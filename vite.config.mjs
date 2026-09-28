import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      'react-native': 'react-native-web'
    }
  },

  define: {
    global: 'globalThis',
    'process.env.NODE_ENV': JSON.stringify('production')
  },

  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  },

  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
