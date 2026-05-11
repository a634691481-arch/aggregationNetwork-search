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
    <UButton
      v-show="visible"
      icon="i-lucide-arrow-up"
      color="primary"
      variant="solid"
      size="lg"
      square
      class="fixed bottom-6 right-6 z-50 shadow-lg rounded-full"
      aria-label="回到顶部"
      @click="scrollToTop"
    />
  </Transition>
</template>
