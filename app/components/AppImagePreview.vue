<script setup lang="ts">
/**
 * 全屏图片预览组件（Lightbox）
 * - 基于 Teleport 渲染到 body
 * - 键盘：ESC 关闭 / ← → 切换
 * - 鼠标滚轮缩放，拖拽平移，双击/按钮复位
 * - 底部缩略图条
 * 依赖 useImagePreview 全局状态
 */
const { state, closePreview, next, prev, goTo } = useImagePreview();

const open = computed(() => state.value.open);
const images = computed(() => state.value.images);
const index = computed(() => state.value.index);
const current = computed(() => images.value[index.value] || "");

// 缩放/平移
const scale = ref(1);
const offsetX = ref(0);
const offsetY = ref(0);
const dragging = ref(false);
const dragStart = ref({ x: 0, y: 0, ox: 0, oy: 0 });
const loading = ref(true);
const failed = ref(false);

function reset() {
  scale.value = 1;
  offsetX.value = 0;
  offsetY.value = 0;
}

// 切换图片时重置变换并标记加载
watch(
  () => current.value,
  () => {
    reset();
    loading.value = true;
    failed.value = false;
  },
);

// 打开/关闭：锁定 body 滚动 + 绑定键盘
watch(open, (val) => {
  if (!import.meta.client) return;
  if (val) {
    document.documentElement.style.overflow = "hidden";
    reset();
    loading.value = true;
    failed.value = false;
  } else {
    document.documentElement.style.overflow = "";
  }
});

function onKey(e: KeyboardEvent) {
  if (!open.value) return;
  if (e.key === "Escape") closePreview();
  else if (e.key === "ArrowRight") next();
  else if (e.key === "ArrowLeft") prev();
  else if (e.key === "0") reset();
}

onMounted(() => {
  window.addEventListener("keydown", onKey);
});
onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKey);
  if (import.meta.client) document.documentElement.style.overflow = "";
});

// 滚轮缩放（以图片中心）
function onWheel(e: WheelEvent) {
  e.preventDefault();
  const delta = -e.deltaY;
  const step = delta > 0 ? 1.1 : 1 / 1.1;
  const next = Math.min(Math.max(scale.value * step, 0.5), 5);
  scale.value = next;
  if (next === 1) {
    offsetX.value = 0;
    offsetY.value = 0;
  }
}

function onMouseDown(e: MouseEvent) {
  if (scale.value <= 1) return;
  dragging.value = true;
  dragStart.value = {
    x: e.clientX,
    y: e.clientY,
    ox: offsetX.value,
    oy: offsetY.value,
  };
}
function onMouseMove(e: MouseEvent) {
  if (!dragging.value) return;
  offsetX.value = dragStart.value.ox + (e.clientX - dragStart.value.x);
  offsetY.value = dragStart.value.oy + (e.clientY - dragStart.value.y);
}
function onMouseUp() {
  dragging.value = false;
}

function onDoubleClick() {
  if (scale.value === 1) scale.value = 2;
  else reset();
}

function zoomIn() {
  scale.value = Math.min(scale.value * 1.25, 5);
}
function zoomOut() {
  const next = Math.max(scale.value / 1.25, 0.5);
  scale.value = next;
  if (next === 1) {
    offsetX.value = 0;
    offsetY.value = 0;
  }
}

const imgStyle = computed(() => ({
  transform: `translate(${offsetX.value}px, ${offsetY.value}px) scale(${scale.value})`,
  cursor:
    scale.value > 1 ?
      dragging.value ?
        "grabbing"
      : "grab"
    : "zoom-in",
  transition: dragging.value ? "none" : "transform 0.2s ease",
}));
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-[100] flex flex-col bg-slate-950/92 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-label="图片预览"
        @mousemove="onMouseMove"
        @mouseup="onMouseUp"
        @mouseleave="onMouseUp"
      >
        <!-- 顶部工具栏 -->
        <div
          class="relative z-10 flex items-center justify-between px-4 py-3 text-white"
        >
          <div class="text-sm tabular-nums text-white/80">
            <span class="font-semibold">{{ index + 1 }}</span>
            <span class="mx-1 text-white/40">/</span>
            <span>{{ images.length }}</span>
          </div>
          <div class="flex items-center gap-1">
            <button
              type="button"
              class="flex size-9 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              aria-label="缩小"
              @click="zoomOut"
            >
              <UIcon name="i-lucide-zoom-out" class="size-5" />
            </button>
            <span
              class="px-2 text-xs tabular-nums text-white/60 min-w-14 text-center"
            >
              {{ Math.round(scale * 100) }}%
            </span>
            <button
              type="button"
              class="flex size-9 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              aria-label="放大"
              @click="zoomIn"
            >
              <UIcon name="i-lucide-zoom-in" class="size-5" />
            </button>
            <button
              type="button"
              class="flex size-9 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              aria-label="重置"
              @click="reset"
            >
              <UIcon name="i-lucide-rotate-ccw" class="size-5" />
            </button>
            <a
              :href="current"
              target="_blank"
              rel="noopener noreferrer"
              class="flex size-9 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              aria-label="在新标签页打开"
            >
              <UIcon name="i-lucide-external-link" class="size-5" />
            </a>
            <button
              type="button"
              class="ml-1 flex size-9 items-center justify-center rounded-full text-white/80 hover:bg-red-500/80 hover:text-white transition-colors cursor-pointer"
              aria-label="关闭预览 (Esc)"
              @click="closePreview"
            >
              <UIcon name="i-lucide-x" class="size-5" />
            </button>
          </div>
        </div>

        <!-- 主图区 -->
        <div
          class="relative flex flex-1 items-center justify-center overflow-hidden select-none"
          @click.self="closePreview"
          @wheel="onWheel"
        >
          <!-- 上一张 -->
          <button
            v-if="images.length > 1"
            type="button"
            class="absolute left-3 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20 transition-colors cursor-pointer"
            aria-label="上一张 (←)"
            @click.stop="prev"
          >
            <UIcon name="i-lucide-chevron-left" class="size-6" />
          </button>

          <!-- 图片本体 -->
          <div
            class="relative flex max-h-full max-w-full items-center justify-center px-4"
            @click.self="closePreview"
          >
            <!-- loading -->
            <div
              v-if="loading && !failed"
              class="absolute inset-0 flex items-center justify-center text-white/70"
            >
              <UIcon name="i-lucide-loader-2" class="size-8 animate-spin" />
            </div>
            <!-- 加载失败 -->
            <div
              v-if="failed"
              class="flex flex-col items-center gap-2 text-white/70"
            >
              <UIcon name="i-lucide-image-off" class="size-10" />
              <p class="text-sm">图片加载失败</p>
            </div>
            <img
              v-show="!failed"
              :key="current"
              :src="current"
              alt="预览图"
              referrerpolicy="no-referrer"
              draggable="false"
              class="max-h-[calc(100vh-12rem)] max-w-[calc(100vw-6rem)] rounded-lg shadow-2xl shadow-black/40 will-change-transform"
              :style="imgStyle"
              @load="loading = false"
              @error="
                loading = false;
                failed = true;
              "
              @mousedown="onMouseDown"
              @dblclick="onDoubleClick"
            />
          </div>

          <!-- 下一张 -->
          <button
            v-if="images.length > 1"
            type="button"
            class="absolute right-3 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20 transition-colors cursor-pointer"
            aria-label="下一张 (→)"
            @click.stop="next"
          >
            <UIcon name="i-lucide-chevron-right" class="size-6" />
          </button>
        </div>

        <!-- 底部缩略图条 -->
        <div
          v-if="images.length > 1"
          class="relative z-10 flex justify-center gap-2 overflow-x-auto px-4 py-3 scrollbar-thin"
        >
          <button
            v-for="(img, i) in images"
            :key="i"
            type="button"
            class="relative size-14 shrink-0 overflow-hidden rounded-md ring-2 transition-all cursor-pointer"
            :class="
              i === index ?
                'ring-primary-400 scale-105'
              : 'ring-white/10 hover:ring-white/40 opacity-60 hover:opacity-100'
            "
            :aria-label="`切换到第 ${i + 1} 张`"
            @click="goTo(i)"
          >
            <img
              :src="img"
              alt=""
              loading="lazy"
              referrerpolicy="no-referrer"
              class="h-full w-full object-cover"
              @error="
                ($event.target as HTMLImageElement).style.display = 'none'
              "
            />
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
