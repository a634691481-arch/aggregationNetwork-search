<script setup lang="ts">
/**
 * 全局浮动胶囊顶栏
 * - 左侧：Logo + 站名（渐变文字）
 * - 右侧：主题色选择器 + 亮/暗模式切换
 * 采用 fixed 定位，外层 pointer-events-none，子胶囊 pointer-events-auto，
 * 避免遮挡下方内容的交互。
 */
</script>

<template>
  <header
    class="fixed top-4 left-4 right-4 z-50 flex items-center justify-between pointer-events-none"
  >
    <!-- 左侧 Logo 胶囊 -->
    <ULink
      to="/"
      class="group pointer-events-auto flex items-center gap-2.5 rounded-full pl-2 pr-4 py-1.5 glass transition-colors duration-200 hover:border-primary-400 dark:hover:border-primary-500 cursor-pointer"
    >
      <span
        class="relative flex size-8 items-center justify-center rounded-full bg-linear-to-br from-primary-500 via-violet-500 to-sky-400 shadow-lg shadow-primary-500/30"
      >
        <UIcon name="i-lucide-search" class="size-4 text-white" />
        <span
          class="absolute inset-0 rounded-full ring-1 ring-inset ring-white/20"
        />
      </span>
      <span class="text-sm font-semibold tracking-tight">
        <span class="gradient-text">聚合网盘</span>
        <span class="text-slate-500 dark:text-slate-400 font-normal ml-1"
          >搜索</span
        >
      </span>
    </ULink>

    <!-- 右侧操作胶囊 -->
    <div
      class="pointer-events-auto flex items-center gap-0.5 rounded-full glass px-1 py-1"
    >
      <AppThemePicker />
      <div
        class="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-0.5"
        aria-hidden="true"
      />
      <AppColorModeButton />
    </div>
  </header>
</template>
