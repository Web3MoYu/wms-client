import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 9090,
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // 目标服务器地址
        changeOrigin: true, // 允许跨域
        rewrite: (path) => path.replace(/^\/api/, ''), // 重写路径
      },
    },
  },
});
