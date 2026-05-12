<script setup lang="ts">
/**
 * 全站默认 SEO meta
 * - useSeoMeta 由 @nuxtjs/seo 增强，自动生成 og:* / twitter:* 等标签
 * - 页面级可再次调用 useSeoMeta() 覆盖默认值
 */
useSeoMeta({
  titleTemplate: "%s %separator %siteName",
  title: "聚合网盘资源搜索",
  ogTitle: "聚合网盘资源搜索",
  description:
    "全网短剧 / 影视 / 软件 / 资源聚合搜索，支持百度、阿里、夸克等 12 种网盘类型。",
  ogDescription:
    "全网短剧 / 影视 / 软件 / 资源聚合搜索，支持百度、阿里、夸克等 12 种网盘类型。",
  ogType: "website",
  ogLocale: "zh_CN",
  twitterCard: "summary_large_image",
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

    <!-- 全屏粒子背景（仅客户端渲染，深浅色自适应） -->
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
