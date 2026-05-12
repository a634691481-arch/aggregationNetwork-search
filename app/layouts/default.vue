<template>
  <div
    class="relative flex flex-col min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-100 overflow-x-hidden"
  >
    <!-- 极光光晕 + 细点阵网格（装饰层，不响应事件） -->
    <div class="aurora-bg" aria-hidden="true" />
    <div class="grid-bg" aria-hidden="true" />

    <!-- 浮动胶囊顶栏（Logo + 主题切换） -->
    <header
      class="fixed top-4 left-4 right-4 z-50 flex items-center justify-between pointer-events-none"
    >
      <!-- 左侧 Logo 胶囊 -->
      <ULink
        to="/"
        class="group pointer-events-auto flex items-center gap-2.5 rounded-full pl-2 pr-4 py-1.5 glass transition-colors duration-200 hover:border-primary-400 dark:hover:border-primary-500 cursor-pointer"
      >
        <span
          class="relative flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 via-violet-500 to-sky-400 shadow-lg shadow-primary-500/30"
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

      <!-- 右侧：主题色选择器 + 颜色模式切换 -->
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

    <!-- 主内容：相对层级置于背景之上 -->
    <main class="relative z-10 flex-1 pt-20">
      <slot />
    </main>

    <!-- 底部 -->
    <AppFooter class="relative z-10" />

    <!-- 回到顶部 -->
    <AppBackToTop />

    <!-- PWA 安装 / 更新提示 -->
    <AppPwaPrompt />

    <!-- 图片预览 Lightbox（全站单例） -->
    <AppImagePreview />
  </div>
</template>
