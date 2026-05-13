<script setup lang="ts">
/**
 * 全站默认 SEO meta
 * - useSeoMeta 由 @nuxtjs/seo 增强，自动生成 og:* / twitter:* 等标签
 * - 页面级可再次调用 useSeoMeta() 覆盖默认值
 */

// 关键词池：网盘品牌 + 资源类型 + 搜索场景 + 热门 IP + 长尾词
// 既覆盖搜索意图（"XXX 网盘资源"），也覆盖聚合产品词（"全网搜索"）
const SEO_KEYWORDS = [
  // —— 核心产品词 ——
  "聚合网盘搜索",
  "网盘搜索",
  "网盘资源搜索",
  "全网网盘搜索",
  "全网资源搜索",
  "网盘聚合搜索引擎",
  "资源聚合搜索",
  "免费网盘搜索",
  "在线网盘搜索",
  "网盘搜索神器",
  "盘搜",
  "盘多多",
  "盘搜搜",
  // —— 12 种网盘品牌 ——
  "百度网盘资源",
  "百度云资源",
  "阿里云盘资源",
  "阿里云盘分享",
  "夸克网盘资源",
  "夸克网盘分享",
  "天翼云盘资源",
  "UC 网盘资源",
  "移动云盘资源",
  "115 网盘资源",
  "PikPak 资源",
  "PikPak 分享",
  "迅雷网盘资源",
  "迅雷云盘",
  "123 网盘资源",
  "磁力链接",
  "磁力搜索",
  "BT 磁力",
  "电驴链接",
  "ed2k 资源",
  // —— 资源类型 / 内容品类 ——
  "短剧资源",
  "短剧网盘",
  "短剧在线观看",
  "影视资源",
  "电影资源",
  "电视剧资源",
  "美剧资源",
  "韩剧资源",
  "日剧资源",
  "综艺资源",
  "动漫资源",
  "番剧资源",
  "纪录片资源",
  "4K 蓝光资源",
  "1080P 高清",
  "软件下载",
  "破解软件",
  "绿色软件",
  "游戏资源",
  "PC 游戏下载",
  "单机游戏",
  "Switch 游戏",
  "电子书下载",
  "PDF 电子书",
  "有声书下载",
  "学习资料",
  "课程资源",
  "考研资料",
  "音乐无损资源",
  // —— 使用场景 / 卖点 ——
  "提取码分享",
  "免登录下载",
  "高速下载",
  "直链下载",
  "一键打开",
  "批量复制链接",
  "TG 群资源",
  "Telegram 资源",
  "网盘分享群",
  "PWA 离线应用",
  // —— 热门长尾 / IP（与 hotKeywords 对齐）——
  "庆余年",
  "斗罗大陆",
  "仙逆",
  "雪中悍刀行",
  "Windows 11",
  "Office 2021",
  "原神资源",
  "GPT 课程",
].join(", ");

useSeoMeta({
  titleTemplate: "%s %separator %siteName",
  title: "聚合网盘资源搜索",
  ogTitle: "聚合网盘资源搜索",
  description:
    "聚合网盘搜索工具，一次搜索直达全网 12 大网盘（百度 / 阿里 / 夸克 / UC / 天翼 / 移动 / 115 / PikPak / 迅雷 / 123 / 磁力 / 电驴），覆盖短剧、影视、综艺、动漫、软件、游戏、电子书、学习资料等资源，免登录，附提取码，支持 PWA 离线访问。",
  ogDescription:
    "聚合网盘搜索工具，一次搜索直达全网 12 大网盘（百度 / 阿里 / 夸克 / UC / 天翼 / 移动 / 115 / PikPak / 迅雷 / 123 / 磁力 / 电驴），覆盖短剧、影视、综艺、动漫、软件、游戏、电子书、学习资料等资源，免登录，附提取码，支持 PWA 离线访问。",
  keywords: SEO_KEYWORDS,
  author: "聚合网盘搜索",
  applicationName: "聚合网盘搜索",
  generator: "Nuxt 4",
  robots: "index, follow, max-image-preview:large, max-snippet:-1",
  themeColor: [
    { content: "#ffffff", media: "(prefers-color-scheme: light)" },
    { content: "#0b1220", media: "(prefers-color-scheme: dark)" },
  ],
  ogType: "website",
  ogLocale: "zh_CN",
  ogSiteName: "聚合网盘搜索",
  twitterCard: "summary_large_image",
  twitterTitle: "聚合网盘资源搜索",
  twitterDescription:
    "全网短剧 / 影视 / 软件 / 游戏 / 电子书聚合搜索，覆盖 12 种网盘类型，免登录直达。",
});

// 额外：语言、分类、格式检测等补充字段（useSeoMeta 未覆盖的走 useHead）
useHead({
  htmlAttrs: { lang: "zh-CN" },
  meta: [
    { name: "category", content: "网盘搜索, 资源聚合, 影视短剧, 软件下载" },
    { name: "format-detection", content: "telephone=no,email=no,address=no" },
    { name: "referrer", content: "no-referrer-when-downgrade" },
    { name: "revisit-after", content: "1 days" },
    // 百度 / 360 / Sogou 站长常用
    { name: "baidu-site-verification", content: "" },
    { "http-equiv": "x-dns-prefetch-control", content: "on" },
  ],
});

import { computed } from "vue";

const colorMode = useColorMode();
const isDark = computed(() => colorMode.value === "dark");
</script>

<template>
  <UApp>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <!-- 全屏粒子背景（仅桌面端渲染 + 仅客户端，深浅色自适应） -->
    <ClientOnly>
      <AppParticlesBg
        :key="isDark ? 'dark' : 'light'"
        class="pointer-events-none absolute inset-0 z-0"
        :quantity="100"
        :ease="100"
        :staticity="10"
        :color="isDark ? '#FFFFFF' : '#000000'"
      />
    </ClientOnly>
  </UApp>
</template>
