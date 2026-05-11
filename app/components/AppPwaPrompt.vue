<script setup lang="ts">
/**
 * PWA 提示组件
 * - 检测到新版本时提示刷新
 * - 支持「安装到主屏幕」一键安装
 * - 首次离线可用时提示用户
 * 依赖 @vite-pwa/nuxt 注入的 $pwa 对象
 */
const { $pwa } = useNuxtApp();

const toast = useToast();

// 新版本可用：提示刷新
watch(
  () => $pwa?.needRefresh,
  (val) => {
    if (val) {
      toast.add({
        id: "pwa-update",
        title: "发现新版本",
        description: "点击刷新以应用最新内容",
        icon: "i-lucide-refresh-ccw",
        color: "primary",
        duration: 0,
        actions: [
          {
            label: "立即刷新",
            onClick: () => $pwa?.updateServiceWorker?.(),
          },
        ],
      });
    }
  },
  { immediate: true },
);

// 离线可用：首次缓存完成
watch(
  () => $pwa?.offlineReady,
  (val) => {
    if (val) {
      toast.add({
        title: "已支持离线访问",
        description: "应用现在可以在无网络时继续使用",
        icon: "i-lucide-wifi-off",
        color: "success",
      });
    }
  },
);

// 安装按钮显示条件：支持安装 & 尚未安装
const showInstall = computed(
  () => !!$pwa?.showInstallPrompt && !$pwa?.isPWAInstalled,
);

function install() {
  $pwa?.install?.();
}

function cancelInstall() {
  $pwa?.cancelInstall?.();
}
</script>

<template>
  <Transition
    enter-active-class="transition ease-out duration-200"
    enter-from-class="opacity-0 translate-y-2"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition ease-in duration-150"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-2"
  >
    <div
      v-if="showInstall"
      class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 pl-3 pr-2 py-2 rounded-full glass shadow-xl shadow-primary-500/10"
    >
      <span
        class="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 via-violet-500 to-sky-400 shadow-md shadow-primary-500/30"
      >
        <UIcon name="i-lucide-download-cloud" class="size-4 text-white" />
      </span>
      <span class="text-sm text-slate-700 dark:text-slate-200">
        将本站添加到主屏幕，随时访问
      </span>
      <UButton
        size="xs"
        color="primary"
        variant="solid"
        icon="i-lucide-download"
        class="cursor-pointer"
        @click="install"
      >
        安装
      </UButton>
      <UButton
        size="xs"
        color="neutral"
        variant="ghost"
        icon="i-lucide-x"
        square
        class="cursor-pointer"
        aria-label="关闭安装提示"
        @click="cancelInstall"
      />
    </div>
  </Transition>
</template>
