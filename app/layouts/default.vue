<template>
  <div class="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
    <!-- 头部 -->
    <!-- <AppHeader /> -->

    <!-- 欢迎横幅 -->
    <!-- <AppBanner /> -->

    <!-- 主内容 -->
    <main class="flex-1">
      <slot />
    </main>

    <!-- 底部 -->
    <AppFooter />

    <!-- 回到顶部 -->
    <AppBackToTop />

    <!-- 主题切换（固定右上角） -->
    <div
      class="fixed top-4 right-4 z-50 flex items-center gap-1 rounded-full bg-white/70 dark:bg-gray-900/70 backdrop-blur-md ring-1 ring-gray-200/60 dark:ring-gray-800 shadow-sm px-1"
    >
      <!-- <AppThemePicker /> -->
      <AppColorModeButton />
    </div>

    <!-- PWA 安装 / 更新提示 -->
    <AppPwaPrompt />
  </div>
</template>
