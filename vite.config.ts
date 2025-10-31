import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      // 代理 AMap Web 服务 API，追加本地开发的 jscode（需在 .env 设置 VITE_AMAP_JSCODE）
      '/_AMapService': {
        target: 'https://restapi.amap.com',
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/_AMapService/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq: any) => {
            try {
              const base = new URL('https://restapi.amap.com');
              const u = new URL(proxyReq.path, base);
              const js = process.env.VITE_AMAP_JSCODE;
              if (js && !u.searchParams.has('jscode')) {
                u.searchParams.append('jscode', js);
                proxyReq.path = u.pathname + u.search;
              }
            } catch {}
          });
        }
      },
      // 可选：自定义地图样式代理（如未使用可忽略）
      '/_AMapService/v4/map/styles': {
        target: 'https://webapi.amap.com',
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/_AMapService/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq: any) => {
            try {
              const base = new URL('https://webapi.amap.com');
              const u = new URL(proxyReq.path, base);
              const js = process.env.VITE_AMAP_JSCODE;
              if (js && !u.searchParams.has('jscode')) {
                u.searchParams.append('jscode', js);
                proxyReq.path = u.pathname + u.search;
              }
            } catch {}
          });
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
});