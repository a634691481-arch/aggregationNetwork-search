// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@formkit/auto-animate/nuxt', '@nuxtjs/seo', '@vite-pwa/nuxt', 'nuxt-aos'],
  css: ['~/assets/css/main.css'],

  // 全站 SEO 基础信息（@nuxtjs/seo 会自动注入到 sitemap/robots/og-image/schema-org 等子模块）
  site: {
    url: 'https://example.com',
    name: '聚合网盘搜索',
    description:
      '聚合网盘搜索工具，一次搜索直达全网 12 大网盘（百度 / 阿里 / 夸克 / UC / 天翼 / 移动 / 115 / PikPak / 迅雷 / 123 / 磁力 / 电驴），覆盖短剧、影视、综艺、动漫、软件、游戏、电子书、学习资料等资源，免登录，附提取码，支持 PWA 离线访问。',
    defaultLocale: 'zh-CN',
    indexable: true,
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
    // 开发环境禁用 PWA（避免 /sw.js 路由警告）；生产 & preview 照常打开
    disable: process.env.NODE_ENV === 'development',
    registerType: 'autoUpdate',
    // 写入 <head> 的 manifest 链接和 favicon（避免 “Manifest 未注册”）
    injectRegister: 'auto',
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
          purpose: 'any',
        },
        {
          src: 'pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'maskable',
        },
        // TODO: 补一张 512x512 的 png 放到 public/pwa-512x512.png
        // 然后把下面这项取消注释，Chrome 可安装提示会更稳
        // {
        //   src: 'pwa-512x512.png',
        //   sizes: '512x512',
        //   type: 'image/png',
        //   purpose: 'any maskable',
        // },
      ],
    },
    workbox: {
      // SSR（nuxt build）模式下 .output/public 不会生成 index.html，
      // 因此不要设置 navigateFallback（否则会抛 non-precached-url: [{"url":"/"}]）。
      // 若未来改用 nuxt generate（SSG），可再加回 navigateFallback: '/' 或 '/index.html'。
      globPatterns: ['**/*.{js,css,png,svg,ico,woff2}'],
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
  },

  // AOS 滚动动画配置
  aos: {
    // 全局：动画只播放一次（滚动到下方后再回滚不会重播，体验更干净）
    once: true,
    // 触发偏移量：元素进入视口 80px 后开始动画
    offset: 80,
    // 默认动画时长
    duration: 600,
    // 默认缓动曲线
    easing: 'ease-out-cubic',
  },

  // Vite 依赖预构建：把 CJS 包提前打包成 ESM，避免首屏发现新依赖时触发整页刷新
  vite: {
    optimizeDeps: {
      include: [
        '@inspira-ui/plugins', // CJS
      ],
    },
  },
})
