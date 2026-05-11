<script setup lang="ts">
/**
 * 全局页面底部组件
 * 仅保留版权信息
 */
const year = new Date().getFullYear();
</script>

<template>
  <footer
    class="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
  >
    <div
      class="mx-auto flex max-w-7xl items-center justify-center px-4 py-6 sm:px-6"
    >
      <div
        class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400"
      >
        <UIcon name="i-lucide-search" class="size-4" />
        <span>© {{ year }} 聚合网盘搜索</span>
      </div>
    </div>
  </footer>
</template>
