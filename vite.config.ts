import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

const useVueDevTools = process.env.VITE_VUE_DEVTOOLS === 'true'
/** inotify 不足需轮询时设置 VITE_WATCH_POLLING=true（默认关闭轮询，减轻 CPU 与卡顿感） */
const useWatchPolling = process.env.VITE_WATCH_POLLING === 'true'

// https://vite.dev/config/
export default defineConfig({
  /** sockjs-client 等包在浏览器里引用 Node 的 global，需映射到 globalThis，否则控制台报 global is not defined 且白屏 */
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    /** 预构建常用依赖，减少首次打开时「边请求边编译」的等待 */
    include: [
      'vue',
      'vue-router',
      'pinia',
      'naive-ui',
      'axios',
      'vue-echarts',
      'echarts',
      '@vicons/ionicons5',
      'sockjs-client',
      '@stomp/stompjs',
    ],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
  plugins: [
    vue(),
    vueJsx(),
    ...(useVueDevTools ? [vueDevTools()] : []),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vue 核心库
          if (id.includes('node_modules/vue') || 
              id.includes('node_modules/vue-router') || 
              id.includes('node_modules/pinia')) {
            return 'vue-vendor';
          }
          // Naive UI - 大型 UI 库，单独打包
          if (id.includes('node_modules/naive-ui')) {
            return 'naive-ui';
          }
          // ECharts - 大型图表库，单独打包
          if (id.includes('node_modules/echarts') || 
              id.includes('node_modules/vue-echarts')) {
            return 'echarts';
          }
          // 图标库
          if (id.includes('node_modules/@vicons')) {
            return 'icons';
          }
          // 其他工具库
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
    // 提高警告阈值：naive-ui 是完整的大型 UI 库，1.1MB+ 是正常的
    // 压缩后只有 ~300KB，实际传输大小很小
    chunkSizeWarningLimit: 1200,
  },
  server: {
    /** 监听 0.0.0.0，避免仅 IPv6 ::1 时本机 localhost 连不上 */
    host: true,
    port: 3001,
    /** 3001 被占用时自动尝试下一端口，避免启动失败 */
    strictPort: false,
    /** 启动时预转换入口，加快首次白屏后的首屏可用时间 */
    warmup: {
      clientFiles: [
        './src/main.ts',
        './src/App.vue',
        './src/router/index.ts',
        './src/layouts/MainLayout.vue',
      ],
    },
    /**
     * Linux inotify 上限过低会报 ENOSPC 时：VITE_WATCH_POLLING=true
     * 根治：sudo sysctl -w fs.inotify.max_user_watches=524288
     */
    ...(useWatchPolling
      ? {
          watch: {
            usePolling: true,
            interval: 1000,
          },
        }
      : {}),
    // 开发时 /api 代理到后端；后端在别机时请把 target 设为该后端地址（如 http://192.168.1.220:8080）
    proxy: {
      '/api': {
        target: 'http://192.168.1.220:8080',
        changeOrigin: true,
      },
      /** 私聊 SockJS + STOMP（与 /api 同后端） */
      '/ws': {
        target: 'http://192.168.1.220:8080',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
