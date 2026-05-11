<script setup lang="ts">
/**
 * 主题颜色切换组件
 * 通过 useAppConfig 动态修改 ui.colors.primary，并持久化到 localStorage
 */
interface ThemeColor {
  value: string;
  /** Tailwind 实色类，用于色块展示 */
  swatch: string;
  label: string;
}

const colors: ThemeColor[] = [
  { value: "blue", swatch: "bg-blue-500", label: "蓝色" },
  { value: "sky", swatch: "bg-sky-500", label: "天空" },
  { value: "cyan", swatch: "bg-cyan-500", label: "青色" },
  { value: "teal", swatch: "bg-teal-500", label: "鸭青" },
  { value: "emerald", swatch: "bg-emerald-500", label: "翡翠" },
  { value: "green", swatch: "bg-green-500", label: "绿色" },
  { value: "lime", swatch: "bg-lime-500", label: "青柠" },
  { value: "yellow", swatch: "bg-yellow-500", label: "黄色" },
  { value: "amber", swatch: "bg-amber-500", label: "琥珀" },
  { value: "orange", swatch: "bg-orange-500", label: "橙色" },
  { value: "red", swatch: "bg-red-500", label: "红色" },
  { value: "rose", swatch: "bg-rose-500", label: "玫瑰" },
  { value: "pink", swatch: "bg-pink-500", label: "粉红" },
  { value: "fuchsia", swatch: "bg-fuchsia-500", label: "品红" },
  { value: "purple", swatch: "bg-purple-500", label: "紫色" },
  { value: "violet", swatch: "bg-violet-500", label: "紫罗兰" },
  { value: "indigo", swatch: "bg-indigo-500", label: "靛青" },
];

const STORAGE_KEY = "app:primary-color";
const appConfig = useAppConfig();

const current = computed<string>(
  () => (appConfig.ui as any)?.colors?.primary ?? "blue",
);

function applyColor(color: string) {
  (appConfig.ui as any).colors.primary = color;
  if (import.meta.client) {
    try {
      localStorage.setItem(STORAGE_KEY, color);
    } catch {
      // 忽略 localStorage 写入异常
    }
  }
}

// 初始化：读取本地存储的主题色
onMounted(() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved !== current.value) {
      (appConfig.ui as any).colors.primary = saved;
    }
  } catch {
    // ignore
  }
});
</script>

<template>
  <UPopover :content="{ align: 'end', side: 'bottom' }">
    <UButton
      icon="i-lucide-palette"
      color="neutral"
      variant="ghost"
      size="md"
      aria-label="切换主题色"
    />

    <template #content>
      <div class="p-3 w-56">
        <p
          class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 px-1"
        >
          主题颜色
        </p>
        <div class="grid grid-cols-6 gap-1.5">
          <button
            v-for="c in colors"
            :key="c.value"
            type="button"
            :title="c.label"
            :aria-label="`切换为${c.label}主题`"
            class="relative size-7 rounded-full transition-transform hover:scale-110 active:scale-95 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
            :class="[
              c.swatch,
              current === c.value ? 'ring-2 ring-gray-900 dark:ring-white' : '',
            ]"
            @click="applyColor(c.value)"
          >
            <UIcon
              v-if="current === c.value"
              name="i-lucide-check"
              class="absolute inset-0 m-auto size-4 text-white drop-shadow"
            />
          </button>
        </div>
      </div>
    </template>
  </UPopover>
</template>
