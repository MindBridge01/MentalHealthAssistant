import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.VITE_DEV_API_PROXY_TARGET || 'http://localhost:3000';

  return {
    plugins: [
      tailwindcss(),
      react()
    ],
    build: {
      outDir: 'dist',
      assetsDir: 'assets', // Output assets to dist/assets/
      rollupOptions: {
        output: {
          entryFileNames: 'assets/main-[hash].js', // e.g., assets/main-CkN0H0W1.js
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]'
        }
      }
    },
    server: {
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
          secure: false
        }
      }
    }
  };
})
