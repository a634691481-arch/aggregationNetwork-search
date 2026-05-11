<script setup lang="ts">
/**
 * 聚合网盘资源搜索页面
 * 接口文档: https://wzapi.com/doc/jhsj.html
 */

interface ResourceItem {
  url: string;
  password?: string;
  note?: string;
  datetime?: string;
  source?: string;
  /** 图片列表，兼容字符串数组或对象数组 */
  images?: Array<string | { url?: string; src?: string; thumb?: string }>;
}

interface JhsjResponse {
  code: number;
  message: string;
  data?: {
    total: number;
    merged_by_type: Record<string, ResourceItem[]>;
  };
}

// 网盘类型定义（与接口参数一一对应）
const cloudTypes = [
  {
    value: "baidu",
    label: "百度网盘",
    icon: "i-lucide-cloud",
    color: "info" as const,
  },
  {
    value: "aliyun",
    label: "阿里云盘",
    icon: "i-lucide-cloud",
    color: "warning" as const,
  },
  {
    value: "quark",
    label: "夸克网盘",
    icon: "i-lucide-cloud",
    color: "primary" as const,
  },
  {
    value: "tianyi",
    label: "天翼云盘",
    icon: "i-lucide-cloud",
    color: "error" as const,
  },
  {
    value: "uc",
    label: "UC 网盘",
    icon: "i-lucide-cloud",
    color: "warning" as const,
  },
  {
    value: "mobile",
    label: "移动云盘",
    icon: "i-lucide-cloud",
    color: "info" as const,
  },
  {
    value: "115",
    label: "115 网盘",
    icon: "i-lucide-cloud",
    color: "primary" as const,
  },
  {
    value: "pikpak",
    label: "PikPak",
    icon: "i-lucide-cloud",
    color: "secondary" as const,
  },
  {
    value: "xunlei",
    label: "迅雷网盘",
    icon: "i-lucide-download",
    color: "info" as const,
  },
  {
    value: "123",
    label: "123 网盘",
    icon: "i-lucide-cloud",
    color: "success" as const,
  },
  {
    value: "magnet",
    label: "磁力链接",
    icon: "i-lucide-magnet",
    color: "neutral" as const,
  },
  {
    value: "ed2k",
    label: "电驴链接",
    icon: "i-lucide-link",
    color: "neutral" as const,
  },
];

const colorMap = Object.fromEntries(cloudTypes.map((c) => [c.value, c]));

// 表单状态
const keyword = ref("");
const selectedTypes = ref<string[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const result = ref<JhsjResponse["data"] | null>(null);
const hasSearched = ref(false);

const toast = useToast();

// 计算属性：结果按网盘类型分组的数组
const groupedResults = computed(() => {
  if (!result.value?.merged_by_type) return [];
  return Object.entries(result.value.merged_by_type)
    .filter(([, items]) => items && items.length > 0)
    .map(([type, items]) => ({
      type,
      label: colorMap[type]?.label ?? type,
      icon: colorMap[type]?.icon ?? "i-lucide-cloud",
      color: colorMap[type]?.color ?? "neutral",
      items,
    }));
});

const totalCount = computed(() => result.value?.total ?? 0);

// 发起搜索
async function handleSearch() {
  const kw = keyword.value.trim();
  if (!kw) {
    toast.add({
      title: "请输入关键词",
      color: "warning",
      icon: "i-lucide-alert-circle",
    });
    return;
  }

  loading.value = true;
  error.value = null;
  hasSearched.value = true;

  try {
    const params: Record<string, string> = { kw };
    if (selectedTypes.value.length > 0) {
      params.cloud_types = selectedTypes.value.join(",");
    }

    const res = await $fetch<JhsjResponse>("/api/jhsj", { params });

    if (res.code !== 0) {
      throw new Error(res.message || "搜索失败");
    }
    result.value = res.data ?? { total: 0, merged_by_type: {} };
  } catch (e: any) {
    error.value = e?.data?.statusMessage || e?.message || "网络请求失败";
    result.value = null;
  } finally {
    loading.value = false;
  }
}

// 复制链接/密码
async function copyText(text: string, label = "链接") {
  try {
    await navigator.clipboard.writeText(text);
    toast.add({
      title: `${label}已复制`,
      color: "success",
      icon: "i-lucide-check",
    });
  } catch {
    toast.add({ title: "复制失败", color: "error", icon: "i-lucide-x" });
  }
}

// 格式化日期
function formatDate(dt?: string) {
  if (!dt || dt.startsWith("0001-")) return "";
  try {
    return new Date(dt).toLocaleDateString("zh-CN");
  } catch {
    return "";
  }
}

// 判断链接是否可直接打开（http/https）
function isHttpUrl(url: string) {
  return /^https?:\/\//i.test(url);
}

// 标准化 images 字段，统一输出为可用的图片 URL 数组
function normalizeImages(images?: ResourceItem["images"]): string[] {
  if (!images || !Array.isArray(images)) return [];
  return images
    .map((it) => {
      if (typeof it === "string") return it;
      if (it && typeof it === "object")
        return it.url || it.src || it.thumb || "";
      return "";
    })
    .filter((u) => !!u && isHttpUrl(u));
}
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
    <!-- 标题区 -->
    <div class="flex flex-col items-center text-center mb-10">
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-search" class="size-10 text-primary-500" />
        <h1
          class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl"
        >
          聚合网盘资源搜索
        </h1>
      </div>
      <p class="mt-3 max-w-2xl text-base text-gray-600 dark:text-gray-400">
        全网短剧 / 影视 / 软件 / 资源聚合搜索，支持 12 种网盘类型，120+ TG
        群采集
      </p>
    </div>

    <!-- 搜索卡片 -->
    <UCard class="mb-8">
      <div class="space-y-5">
        <!-- 搜索框 -->
        <div class="flex flex-col sm:flex-row gap-3">
          <UInput
            v-model="keyword"
            size="lg"
            placeholder="请输入搜索关键词，例如：仙逆、斗罗大陆、庆余年..."
            icon="i-lucide-search"
            class="flex-1"
            :ui="{ base: 'w-full' }"
            @keyup.enter="handleSearch"
          />
          <UButton
            size="lg"
            color="primary"
            icon="i-lucide-search"
            :loading="loading"
            @click="handleSearch"
          >
            搜索
          </UButton>
        </div>

        <!-- 网盘类型多选 -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
              网盘类型过滤
              <span class="text-gray-400 dark:text-gray-500 font-normal ml-1">
                （不选则聚合全部网盘）
              </span>
            </span>
            <UButton
              v-if="selectedTypes.length > 0"
              size="xs"
              variant="ghost"
              color="neutral"
              icon="i-lucide-x"
              @click="selectedTypes = []"
            >
              清空
            </UButton>
          </div>
          <div class="flex flex-wrap gap-2">
            <UBadge
              v-for="ct in cloudTypes"
              :key="ct.value"
              :color="selectedTypes.includes(ct.value) ? ct.color : 'neutral'"
              :variant="selectedTypes.includes(ct.value) ? 'solid' : 'soft'"
              class="cursor-pointer select-none transition-transform hover:scale-105 active:scale-95"
              @click="
                selectedTypes.includes(ct.value) ?
                  (selectedTypes = selectedTypes.filter((t) => t !== ct.value))
                : selectedTypes.push(ct.value)
              "
            >
              <UIcon :name="ct.icon" class="size-3.5 mr-1" />
              {{ ct.label }}
            </UBadge>
          </div>
        </div>
      </div>
    </UCard>

    <!-- 错误提示 -->
    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      icon="i-lucide-alert-triangle"
      title="搜索失败"
      :description="error"
      class="mb-6"
      :close-button="{ icon: 'i-lucide-x', color: 'neutral', variant: 'link' }"
      @close="error = null"
    />

    <!-- 加载中 -->
    <div v-if="loading" class="flex flex-col items-center py-16">
      <UIcon
        name="i-lucide-loader-circle"
        class="size-10 text-primary-500 animate-spin"
      />
      <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">
        正在搜索全网资源...
      </p>
    </div>

    <!-- 空状态 -->
    <UCard
      v-else-if="hasSearched && !error && totalCount === 0"
      class="text-center py-12"
    >
      <UIcon name="i-lucide-inbox" class="size-12 text-gray-400 mx-auto mb-3" />
      <p class="text-base font-medium text-gray-700 dark:text-gray-300">
        未找到相关资源
      </p>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        换个关键词或调整网盘类型试试
      </p>
    </UCard>

    <!-- 搜索结果 -->
    <div
      v-else-if="groupedResults.length > 0"
      v-auto-animate
      class="space-y-10"
    >
      <!-- 统计条 -->
      <div
        class="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-primary-50 to-primary-100/50 dark:from-primary-950/40 dark:to-primary-900/20 border border-primary-200/60 dark:border-primary-900/40"
      >
        <div class="flex items-center gap-2 text-sm">
          <UIcon
            name="i-lucide-sparkles"
            class="size-4 text-primary-500 shrink-0"
          />
          <p class="text-gray-700 dark:text-gray-300">
            共找到
            <span class="font-bold text-primary-600 dark:text-primary-400">{{
              totalCount
            }}</span>
            条资源，分布在
            <span class="font-bold text-primary-600 dark:text-primary-400">{{
              groupedResults.length
            }}</span>
            个网盘
          </p>
        </div>
      </div>

      <div v-for="group in groupedResults" :key="group.type" class="space-y-4">
        <!-- 分组标题 -->
        <div class="flex items-center gap-3">
          <div
            class="flex items-center justify-center size-9 rounded-lg bg-primary-500/10 ring-1 ring-primary-500/20"
          >
            <UIcon :name="group.icon" class="size-5 text-primary-500" />
          </div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ group.label }}
          </h2>
          <UBadge :color="group.color" variant="subtle" size="sm">
            {{ group.items.length }} 条
          </UBadge>
          <div
            class="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent dark:from-gray-800"
          />
        </div>

        <!-- 资源列表 -->
        <div v-auto-animate class="grid gap-4 sm:grid-cols-2">
          <div
            v-for="(item, idx) in group.items"
            :key="`${group.type}-${idx}`"
            class="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-700 hover:-translate-y-0.5 transition-all duration-200"
          >
            <!-- 顶部彩条 -->
            <div
              class="h-1 w-full bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600 opacity-70 group-hover:opacity-100 transition-opacity"
            />

            <div class="flex flex-col flex-1 p-4">
              <!-- 标题 / 备注 -->
              <div class="flex items-start gap-2 mb-3">
                <UIcon
                  name="i-lucide-film"
                  class="size-4 text-primary-500 mt-0.5 shrink-0"
                />
                <p
                  class="text-sm font-semibold text-gray-900 dark:text-white leading-snug line-clamp-2 flex-1"
                >
                  {{ item.note || "未命名资源" }}
                </p>
              </div>

              <!-- 图片展示（接口返回 images 字段） -->
              <div
                v-if="normalizeImages(item.images).length > 0"
                class="grid grid-cols-3 gap-1.5 mb-3"
              >
                <a
                  v-for="(img, i) in normalizeImages(item.images).slice(0, 6)"
                  :key="`${group.type}-${idx}-img-${i}`"
                  :href="img"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="relative block aspect-square overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-700 hover:ring-2 hover:ring-primary-500 transition"
                >
                  <img
                    :src="img"
                    :alt="item.note || '资源图片'"
                    loading="lazy"
                    referrerpolicy="no-referrer"
                    class="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    @error="
                      ($event.target as HTMLImageElement).style.display = 'none'
                    "
                  />
                </a>
              </div>

              <!-- 元信息（chip 风格） -->
              <div class="flex flex-wrap items-center gap-1.5 mb-3">
                <span
                  v-if="item.source"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                >
                  <UIcon name="i-lucide-tag" class="size-3" />
                  {{ item.source }}
                </span>
                <span
                  v-if="formatDate(item.datetime)"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                >
                  <UIcon name="i-lucide-calendar" class="size-3" />
                  {{ formatDate(item.datetime) }}
                </span>
                <span
                  v-if="item.password"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 ring-1 ring-amber-200/60 dark:ring-amber-900/40"
                >
                  <UIcon name="i-lucide-key-round" class="size-3" />
                  提取码
                  <code class="font-mono font-semibold">{{
                    item.password
                  }}</code>
                </span>
              </div>

              <!-- 链接 -->
              <div
                class="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-950/60 ring-1 ring-gray-200/60 dark:ring-gray-800 mb-3"
              >
                <UIcon
                  name="i-lucide-link-2"
                  class="size-4 text-gray-400 shrink-0"
                />
                <span
                  class="flex-1 text-xs text-gray-600 dark:text-gray-400 font-mono truncate"
                  :title="item.url"
                >
                  {{ item.url }}
                </span>
              </div>

              <!-- 操作按钮（置底） -->
              <div
                class="mt-auto flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800"
              >
                <UButton
                  v-if="isHttpUrl(item.url)"
                  size="xs"
                  color="primary"
                  variant="solid"
                  icon="i-lucide-external-link"
                  :to="item.url"
                  target="_blank"
                >
                  打开
                </UButton>
                <UButton
                  size="xs"
                  color="neutral"
                  variant="soft"
                  icon="i-lucide-copy"
                  @click="copyText(item.url, '链接')"
                >
                  复制链接
                </UButton>
                <UButton
                  v-if="item.password"
                  size="xs"
                  color="warning"
                  variant="soft"
                  icon="i-lucide-key-round"
                  @click="copyText(item.password!, '提取码')"
                >
                  提取码
                </UButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 未搜索时的提示 -->
    <UCard v-else-if="!hasSearched" class="text-center py-12">
      <UIcon
        name="i-lucide-sparkles"
        class="size-12 text-primary-500 mx-auto mb-3"
      />
      <p class="text-base font-medium text-gray-700 dark:text-gray-300">
        输入关键词开始搜索
      </p>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        支持百度网盘、阿里云盘、夸克、UC、迅雷、115、磁力链接等 12 种资源类型
      </p>
    </UCard>
  </div>
</template>
