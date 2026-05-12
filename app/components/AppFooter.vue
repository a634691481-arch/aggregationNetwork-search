<script setup lang="ts">
/**
 * 全局页面底部组件
 * Aurora Glass 风格：细分隔线 + 渐变胶囊 logo + 外链
 */
const year = new Date().getFullYear();
</script>

<template>
  <footer class="mt-12 border-t border-slate-200/70 dark:border-slate-800/70">
    <div
      class="mx-auto flex max-w-7xl xl:max-w-8xl flex-col items-center gap-4 px-4 py-4 sm:flex-row sm:justify-between sm:gap-6 sm:px-6"
    >
      <div class="flex items-center gap-2.5">
        <span
          class="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 via-violet-500 to-sky-400 shadow-sm shadow-primary-500/30"
        >
          <UIcon name="i-lucide-search" class="size-3.5 text-white" />
        </span>
        <span class="text-sm font-semibold text-slate-700 dark:text-slate-300">
          聚合网盘搜索
        </span>
        <span
          class="hidden sm:inline text-xs text-slate-400 dark:text-slate-500"
        >
          · 工具型产品
        </span>
      </div>

      <div
        class="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400"
      >
        <span class="inline-flex items-center gap-1.5">
          <span
            class="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgb(16_185_129_/_0.15)]"
          />
          服务正常
        </span>
        <span
          class="hidden sm:inline h-3 w-px bg-slate-200 dark:bg-slate-800"
        />
        <span>© {{ year }} All rights reserved</span>
      </div>
    </div>
  </footer>
</template>
