<script setup lang="ts">
/**
 * 全局页面头部组件
 * 仅保留站点 Logo / 标题
 */
</script>

<template>
  <header
    class="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md"
  >
    <div class="mx-auto flex max-w-7xl items-center px-4 py-3 sm:px-6">
      <ULink to="/" class="flex items-center gap-3">
        <UIcon name="i-lucide-search" class="size-6 text-primary-500" />
        <span class="text-lg font-semibold text-gray-900 dark:text-white">
          聚合网盘搜索
        </span>
      </ULink>
    </div>
  </header>
</template>
