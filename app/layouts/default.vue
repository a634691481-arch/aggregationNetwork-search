<script setup lang="ts">
import { computed } from "vue";

const colorMode = useColorMode();
const isDark = computed(() => colorMode.value === "dark");
</script>

<template>
  <div
    class="relative flex flex-col min-h-screen bg-linear-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-100 overflow-x-hidden"
  >
    <!-- 装饰层：极光光晕 + 细点阵网格 -->
    <div class="aurora-bg" aria-hidden="true" />
    <div class="grid-bg" aria-hidden="true" />

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

    <!-- 顶栏 -->
    <AppHeader />

    <!-- 主内容 -->
    <main class="relative z-10 flex-1 pt-20">
      <slot />
    </main>

    <!-- 底部 -->
    <AppFooter class="relative z-10" />

    <!-- 返回顶部 -->
    <AppBackToTop />
    <!-- PWA 提示 -->
    <AppPwaPrompt />
    <!-- 图片预览 -->
    <AppImagePreview />

    <!-- 精准悬浮光标 -->
    <ClientOnly>
      <AppSleekLineCursor />
    </ClientOnly>
  </div>
</template>
