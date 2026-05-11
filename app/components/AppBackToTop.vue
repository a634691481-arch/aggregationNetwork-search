<script setup lang="ts">
/**
 * 回到顶部组件
 * 滚动超过阈值时显示，点击平滑滚动回页面顶部
 */
interface Props {
  /** 显示按钮的滚动阈值（px），默认 300 */
  threshold?: number;
}

const props = withDefaults(defineProps<Props>(), {
  threshold: 300,
});

const visible = ref(false);

function onScroll() {
  visible.value = window.scrollY > props.threshold;
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

onMounted(() => {
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", onScroll);
});
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
    <button
      v-show="visible"
      type="button"
      aria-label="回到顶部"
      class="group fixed bottom-6 right-6 z-50 flex size-12 items-center justify-center rounded-full glass overflow-hidden text-primary-600 dark:text-primary-300 hover:text-white transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
      @click="scrollToTop"
    >
      <!-- 渐变光斑背景（hover 显现） -->
      <span
        class="absolute inset-0 rounded-full bg-gradient-to-br from-primary-500 via-violet-500 to-sky-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        aria-hidden="true"
      />
      <UIcon
        name="i-lucide-arrow-up"
        class="relative size-5 transition-transform duration-200 group-hover:-translate-y-0.5"
      />
    </button>
  </Transition>
</template>
