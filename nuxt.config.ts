// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@formkit/auto-animate/nuxt', '@nuxtjs/seo', '@vite-pwa/nuxt'],
  css: ['~/assets/css/main.css'],

  // 全站 SEO 基础信息（@nuxtjs/seo 会自动注入到 sitemap/robots/og-image/schema-org 等子模块）
  site: {
    url: 'https://example.com',
    name: '聚合网盘搜索',
    description: '全网短剧 / 影视 / 软件 / 资源聚合搜索，支持 12 种网盘类型。',
    defaultLocale: 'zh-CN',
  },

  // robots.txt 配置：允许所有爬虫，禁止爬取 /api
  robots: {
    disallow: ['/api/'],
  },

  // sitemap.xml 配置：自动基于路由生成
  sitemap: {
    sources: ['/api/__sitemap__/urls'],
    autoLastmod: true,
  },

  // 关闭 @nuxt/fonts 的 Google 在线探测，避免因无法访问 fonts.google.com 反复重试
  fonts: {
    providers: {
      google: false,
      googleicons: false,
      adobe: false
    }
  },
  // Nuxt Icon 使用本地打包，不走远程 CDN
  icon: {
    serverBundle: 'local',
    provider: 'iconify'
  },

  // 禁用 OG Image 生成（Cloudflare Pages 不支持 WASM renderer）
  ogImage: {
    enabled: false
  },

  // 颜色模式配置：默认暗色模式
  colorMode: {
    preference: 'dark',
    fallback: 'dark',
    hid: 'nuxt-color-mode-script',
    globalName: '__NUXT_COLOR_MODE__',
    componentName: 'ColorScheme',
    classPrefix: '',
    classSuffix: '',
    storageKey: 'nuxt-color-mode'
  },

  // PWA 配置：支持离线访问、添加到主屏幕
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: '聚合网盘搜索',
      short_name: '网盘搜索',
      description: '全网短剧 / 影视 / 软件 / 资源聚合搜索，支持 12 种网盘类型。',
      theme_color: '#3b82f6',
      background_color: '#ffffff',
      lang: 'zh-CN',
      display: 'standalone',
      orientation: 'portrait',
      scope: '/',
      start_url: '/',
      icons: [
        {
          src: 'pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: 'pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
        {
          src: 'pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable',
        },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
      navigateFallback: '/',
      cleanupOutdatedCaches: true,
      runtimeCaching: [
        {
          // 图片：CacheFirst，最长 30 天
          urlPattern: ({ request }: { request: Request }) => request.destination === 'image',
          handler: 'CacheFirst',
          options: {
            cacheName: 'images-cache',
            expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
          },
        },
        {
          // 聚合搜索接口：网络优先，失败回退缓存
          urlPattern: /\/api\/jhsj(\?.*)?$/,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'jhsj-api-cache',
            networkTimeoutSeconds: 5,
            expiration: { maxEntries: 50, maxAgeSeconds: 60 * 10 },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
      ],
    },
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 3600, // 每小时检查一次更新
    },
    devOptions: {
      enabled: false, // 开发环境默认关闭，需要调试时改为 true
      type: 'module',
    },
  }
})
