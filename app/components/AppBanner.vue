<script setup lang="ts">
/**
 * 欢迎横幅组件
 * 展示接口提供的欢迎卡片图 https://wzapi.com/api/ipqmd?bg=1
 */
interface Props {
  /** 横幅图片地址，默认为接口提供的欢迎卡片 */
  src?: string;
  /** 图片 alt 文本 */
  alt?: string;
}

withDefaults(defineProps<Props>(), {
  src: "https://wzapi.com/api/ipqmd?bg=1",
  alt: "欢迎卡片",
});

const loaded = ref(false);
const failed = ref(false);
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
    <div
      class="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 shadow-sm"
    >
      <!-- 加载骨架 -->
      <div
        v-if="!loaded && !failed"
        class="aspect-[5/1] w-full animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800"
      />

      <!-- 加载失败占位 -->
      <div
        v-if="failed"
        class="aspect-[5/1] w-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500"
      >
        <UIcon name="i-lucide-image-off" class="size-8 mb-1" />
        <span class="text-sm">横幅图片加载失败</span>
      </div>

      <!-- 实际图片 -->
      <img
        v-show="loaded && !failed"
        :src="src"
        :alt="alt"
        class="w-full h-auto block"
        referrerpolicy="no-referrer"
        @load="loaded = true"
        @error="failed = true"
      />
    </div>
  </div>
</template>
