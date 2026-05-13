<script setup lang="ts">
/**
 * 赞赏组件 AppSponsor
 * --------------------------------------------------------------
 * - 屏幕右下角浮动"赞赏"按钮（FAB），点击弹出二维码收款面板
 * - 面板内 Tab 切换 微信 / 支付宝 收款码，支持点击二维码放大预览
 * - 所有文案 & 二维码地址均可通过 props 自定义，默认值先用占位图，
 *   你后续把二维码图片放到 public/sponsor/ 目录下覆盖同名文件即可
 *
 * 使用方式：
 *   <AppSponsor />                            // 使用全部默认值
 *   <AppSponsor :qrcodes="[{ label: '微信', image: '...' }]" />
 */

interface QrCode {
  /** 选项卡标签，如 "微信" / "支付宝" */
  label: string;
  /** 二维码图片地址（public/ 下绝对路径或远程 URL 均可） */
  image: string;
  /** 顶部渐变色，Tailwind 类名片段，如 "from-green-500 to-emerald-500" */
  accent?: string;
  /** 选项卡图标（UIcon 名） */
  icon?: string;
  /** 副标题 / 提示语 */
  tip?: string;
}

interface Props {
  /** 标题 */
  title?: string;
  /** 副标题 / 感谢语 */
  description?: string;
  /** 底部署名 */
  author?: string;
  /** 二维码列表（至少 1 项） */
  qrcodes?: QrCode[];
}

const props = withDefaults(defineProps<Props>(), {
  title: "请我喝杯咖啡 ☕",
  description: "如果本站对你有帮助，欢迎赞赏一杯咖啡，支持我持续维护更新 ❤️",
  author: "聚合网盘搜索",
  qrcodes: () => [
    {
      label: "微信",
      // 占位图：用户后续把自己的二维码放到 public/sponsor/wechat.png 覆盖即可
      image: "/sponsor/wechat.png",
      icon: "i-lucide-message-circle",
      accent: "from-green-500 to-emerald-500",
      tip: "微信扫一扫 · 感谢支持",
    },
    {
      label: "支付宝",
      image: "/sponsor/alipay.png",
      icon: "i-lucide-wallet",
      accent: "from-sky-500 to-blue-500",
      tip: "支付宝扫一扫 · 感谢支持",
    },
  ],
});

const open = ref(false);
const activeIndex = ref(0);
const imgFailed = ref<Record<number, boolean>>({});

const { openPreview } = useImagePreview();

const activeQr = computed(() => props.qrcodes[activeIndex.value]);

function handleOpen() {
  open.value = true;
  activeIndex.value = 0;
}

function handleImgError(idx: number) {
  imgFailed.value = { ...imgFailed.value, [idx]: true };
}

function handleImgLoad(idx: number) {
  if (imgFailed.value[idx]) {
    imgFailed.value = { ...imgFailed.value, [idx]: false };
  }
}

// 点击二维码 → 走全局图片预览（放大查看）
function previewActive() {
  if (!activeQr.value) return;
  openPreview(
    props.qrcodes.map((q) => q.image),
    activeIndex.value,
  );
}
</script>

<template>
  <!-- ============ 触发按钮（桌面 & 移动通用 FAB） ============ -->
  <button
    type="button"
    aria-label="赞赏作者"
    class="sponsor-fab group fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/30 cursor-pointer select-none transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-rose-500/50 active:scale-95 sm:bottom-6 sm:right-6"
    @click="handleOpen"
  >
    <span
      class="relative flex size-5 items-center justify-center"
      aria-hidden="true"
    >
      <span
        class="absolute inset-0 rounded-full bg-white/30 opacity-0 group-hover:opacity-100 group-hover:animate-ping"
      />
      <UIcon name="i-lucide-heart" class="size-4 drop-shadow-sm" />
    </span>
    <span class="hidden sm:inline">赞赏</span>
  </button>

  <!-- ============ 弹窗 ============ -->
  <UModal
    v-model:open="open"
    :ui="{
      content:
        'w-[min(92vw,26rem)] rounded-2xl overflow-hidden ring-1 ring-slate-200/70 dark:ring-slate-800/70',
    }"
  >
    <template #content>
      <div class="relative">
        <!-- 顶部渐变条 -->
        <div
          :class="[
            'h-1.5 w-full bg-linear-to-r',
            activeQr?.accent || 'from-rose-500 to-pink-500',
          ]"
          aria-hidden="true"
        />

        <!-- 关闭按钮 -->
        <button
          type="button"
          aria-label="关闭"
          class="absolute top-3 right-3 z-10 inline-flex size-8 items-center justify-center rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          @click="open = false"
        >
          <UIcon name="i-lucide-x" class="size-4" />
        </button>

        <div class="px-6 pb-6 pt-5">
          <!-- 标题 + 描述 -->
          <div class="flex flex-col items-center text-center">
            <div
              class="relative flex size-12 items-center justify-center rounded-2xl bg-linear-to-br from-rose-500 to-pink-500 shadow-lg shadow-rose-500/30"
            >
              <UIcon
                name="i-lucide-heart"
                class="size-6 text-white drop-shadow"
              />
              <span
                class="absolute -inset-1 rounded-2xl bg-rose-500/20 blur-md -z-10"
                aria-hidden="true"
              />
            </div>
            <h3
              class="mt-3 text-lg font-bold tracking-tight text-slate-900 dark:text-white"
            >
              {{ title }}
            </h3>
            <p
              class="mt-1 max-w-xs text-xs leading-relaxed text-slate-500 dark:text-slate-400"
            >
              {{ description }}
            </p>
          </div>

          <!-- Tab 切换 -->
          <div
            v-if="qrcodes.length > 1"
            class="mt-5 flex items-center justify-center"
          >
            <div
              role="tablist"
              class="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800/80 p-1 ring-1 ring-slate-200 dark:ring-slate-700"
            >
              <button
                v-for="(qr, i) in qrcodes"
                :key="qr.label"
                type="button"
                role="tab"
                :aria-selected="activeIndex === i"
                :class="[
                  'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold cursor-pointer transition-all',
                  activeIndex === i ?
                    `text-white bg-linear-to-r ${qr.accent || 'from-rose-500 to-pink-500'} shadow-md`
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white',
                ]"
                @click="activeIndex = i"
              >
                <UIcon v-if="qr.icon" :name="qr.icon" class="size-3.5" />
                {{ qr.label }}
              </button>
            </div>
          </div>

          <!-- 二维码区 -->
          <div class="mt-5 flex flex-col items-center">
            <button
              type="button"
              class="group/qr relative overflow-hidden rounded-2xl bg-white p-3 ring-1 ring-slate-200 dark:ring-slate-700 shadow-lg shadow-slate-900/5 cursor-zoom-in transition-transform hover:scale-[1.02]"
              :aria-label="`放大查看${activeQr?.label}收款码`"
              @click="previewActive"
            >
              <!-- 加载失败占位 -->
              <div
                v-if="imgFailed[activeIndex]"
                class="flex size-56 flex-col items-center justify-center gap-2 text-slate-400"
              >
                <UIcon name="i-lucide-image-off" class="size-8" />
                <span class="text-xs">二维码加载失败</span>
                <span class="text-[10px] text-slate-400">
                  请将图片放到 public{{ activeQr?.image }}
                </span>
              </div>
              <!-- 实际二维码 -->
              <img
                v-else
                :src="activeQr?.image"
                :alt="`${activeQr?.label}收款码`"
                referrerpolicy="no-referrer"
                class="size-56 object-contain block"
                @load="handleImgLoad(activeIndex)"
                @error="handleImgError(activeIndex)"
              />
              <!-- 四角装饰 -->
              <span
                class="pointer-events-none absolute top-1 left-1 size-3 border-t-2 border-l-2 border-slate-300 dark:border-slate-600 rounded-tl"
              />
              <span
                class="pointer-events-none absolute top-1 right-1 size-3 border-t-2 border-r-2 border-slate-300 dark:border-slate-600 rounded-tr"
              />
              <span
                class="pointer-events-none absolute bottom-1 left-1 size-3 border-b-2 border-l-2 border-slate-300 dark:border-slate-600 rounded-bl"
              />
              <span
                class="pointer-events-none absolute bottom-1 right-1 size-3 border-b-2 border-r-2 border-slate-300 dark:border-slate-600 rounded-br"
              />
            </button>

            <p
              v-if="activeQr?.tip"
              class="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"
            >
              <UIcon
                name="i-lucide-scan-line"
                class="size-3.5 text-slate-400"
              />
              {{ activeQr.tip }}
            </p>
          </div>

          <!-- 底部署名 -->
          <div
            class="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500"
          >
            <UIcon name="i-lucide-sparkles" class="size-3" />
            <span>{{ author }}</span>
            <span class="mx-1">·</span>
            <span>感谢每一份支持</span>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>

<style scoped>
/* 渐变动画：彩虹流光 + 呼吸脉冲 */
.sponsor-fab {
  background: linear-gradient(
    120deg,
    #f43f5e 0%,
    #ec4899 25%,
    #a855f7 50%,
    #ec4899 75%,
    #f43f5e 100%
  );
  background-size: 200% 200%;
  animation:
    sponsor-gradient 6s ease infinite,
    sponsor-pulse 2.4s ease-in-out infinite;
}

@keyframes sponsor-gradient {
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

@keyframes sponsor-pulse {
  0%,
  100% {
    box-shadow:
      0 8px 20px -6px rgba(244, 63, 94, 0.45),
      0 0 0 0 rgba(244, 63, 94, 0.45);
  }
  50% {
    box-shadow:
      0 10px 26px -6px rgba(244, 63, 94, 0.55),
      0 0 0 8px rgba(244, 63, 94, 0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .sponsor-fab {
    animation: none;
  }
}
</style>
