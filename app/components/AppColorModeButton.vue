<script setup lang="ts">
/**
 * 颜色模式切换按钮
 * 基于 Nuxt UI 内置的 @nuxtjs/color-mode 集成
 * 参考: https://ui.nuxt.com/docs/getting-started/integrations/color-mode/nuxt
 */
const colorMode = useColorMode();

// 默认设置为暗色模式
if (import.meta.client && !colorMode.preference) {
  colorMode.preference = "dark";
}

const isDark = computed<boolean>({
  get() {
    return colorMode.value === "dark";
  },
  set(_isDark: boolean) {
    colorMode.preference = _isDark ? "dark" : "light";
  },
});
</script>

<template>
  <ClientOnly v-if="!colorMode?.forced">
    <UButton
      :icon="isDark ? 'i-lucide-moon' : 'i-lucide-sun'"
      color="neutral"
      variant="ghost"
      size="md"
      :aria-label="`切换到${isDark ? '亮色' : '暗色'}模式`"
      @click="isDark = !isDark"
    />

    <template #fallback>
      <!-- 占位按钮：与实际按钮尺寸一致，避免刷新时闪动 -->
      <UButton
        icon="i-lucide-sun-moon"
        color="neutral"
        variant="ghost"
        size="md"
        disabled
        aria-hidden="true"
      />
    </template>
  </ClientOnly>
</template>
