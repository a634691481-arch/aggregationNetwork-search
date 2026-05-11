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
</script>

<template>
  <UApp>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
