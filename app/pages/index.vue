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
// accent / dot 为该网盘独立的品牌色，用于跳出一刀切的 primary
const cloudTypes = [
  {
    value: "baidu",
    label: "百度网盘",
    icon: "i-lucide-cloud",
    color: "info" as const,
    accent:
      "from-sky-500/15 to-sky-500/5 text-sky-600 dark:text-sky-300 ring-sky-500/30",
    dot: "bg-sky-500",
  },
  {
    value: "aliyun",
    label: "阿里云盘",
    icon: "i-lucide-cloud",
    color: "warning" as const,
    accent:
      "from-orange-500/15 to-orange-500/5 text-orange-600 dark:text-orange-300 ring-orange-500/30",
    dot: "bg-orange-500",
  },
  {
    value: "quark",
    label: "夸克网盘",
    icon: "i-lucide-cloud",
    color: "primary" as const,
    accent:
      "from-blue-500/15 to-blue-500/5 text-blue-600 dark:text-blue-300 ring-blue-500/30",
    dot: "bg-blue-500",
  },
  {
    value: "tianyi",
    label: "天翼云盘",
    icon: "i-lucide-cloud",
    color: "error" as const,
    accent:
      "from-red-500/15 to-red-500/5 text-red-600 dark:text-red-300 ring-red-500/30",
    dot: "bg-red-500",
  },
  {
    value: "uc",
    label: "UC 网盘",
    icon: "i-lucide-cloud",
    color: "warning" as const,
    accent:
      "from-amber-500/15 to-amber-500/5 text-amber-600 dark:text-amber-300 ring-amber-500/30",
    dot: "bg-amber-500",
  },
  {
    value: "mobile",
    label: "移动云盘",
    icon: "i-lucide-cloud",
    color: "info" as const,
    accent:
      "from-cyan-500/15 to-cyan-500/5 text-cyan-600 dark:text-cyan-300 ring-cyan-500/30",
    dot: "bg-cyan-500",
  },
  {
    value: "115",
    label: "115 网盘",
    icon: "i-lucide-cloud",
    color: "primary" as const,
    accent:
      "from-indigo-500/15 to-indigo-500/5 text-indigo-600 dark:text-indigo-300 ring-indigo-500/30",
    dot: "bg-indigo-500",
  },
  {
    value: "pikpak",
    label: "PikPak",
    icon: "i-lucide-cloud",
    color: "secondary" as const,
    accent:
      "from-violet-500/15 to-violet-500/5 text-violet-600 dark:text-violet-300 ring-violet-500/30",
    dot: "bg-violet-500",
  },
  {
    value: "xunlei",
    label: "迅雷网盘",
    icon: "i-lucide-download",
    color: "info" as const,
    accent:
      "from-blue-600/15 to-blue-600/5 text-blue-700 dark:text-blue-300 ring-blue-600/30",
    dot: "bg-blue-600",
  },
  {
    value: "123",
    label: "123 网盘",
    icon: "i-lucide-cloud",
    color: "success" as const,
    accent:
      "from-emerald-500/15 to-emerald-500/5 text-emerald-600 dark:text-emerald-300 ring-emerald-500/30",
    dot: "bg-emerald-500",
  },
  {
    value: "magnet",
    label: "磁力链接",
    icon: "i-lucide-magnet",
    color: "neutral" as const,
    accent:
      "from-slate-500/15 to-slate-500/5 text-slate-700 dark:text-slate-300 ring-slate-500/30",
    dot: "bg-slate-500",
  },
  {
    value: "ed2k",
    label: "电驴链接",
    icon: "i-lucide-link",
    color: "neutral" as const,
    accent:
      "from-zinc-500/15 to-zinc-500/5 text-zinc-700 dark:text-zinc-300 ring-zinc-500/30",
    dot: "bg-zinc-500",
  },
];

const colorMap = Object.fromEntries(cloudTypes.map((c) => [c.value, c]));

// 判断链接是否可直接打开（http/https） —— 前置声明，供下方计算属性使用
function isHttpUrl(url: string) {
  return /^https?:\/\//i.test(url);
}

// 路由实例（用于 URL Query 同步）
const route = useRoute();
const router = useRouter();

// 表单状态：初始值从 URL Query 读取，支持刷新/分享链接还原状态
const initialKw = typeof route.query.kw === "string" ? route.query.kw : "";
const initialTypes =
  typeof route.query.types === "string" && route.query.types ?
    route.query.types.split(",").filter(Boolean)
  : [];

const keyword = ref(initialKw);
const selectedTypes = ref<string[]>(initialTypes);
const loading = ref(false);
const error = ref<string | null>(null);
const result = ref<JhsjResponse["data"] | null>(null);
const hasSearched = ref(false);

// 结果区二次筛选 / 排序
const resultFilter = ref("");
const sortBy = ref<"default" | "date-desc" | "date-asc" | "title">("default");

// 分组折叠状态：记录被折起的网盘类型
const collapsedGroups = ref<Set<string>>(new Set());
function toggleGroup(type: string) {
  const s = new Set(collapsedGroups.value);
  if (s.has(type)) s.delete(type);
  else s.add(type);
  collapsedGroups.value = s;
}

// 输入框引用（用于快捷键 focus）
const searchInputRef = ref<{ inputRef?: HTMLInputElement } | null>(null);
function focusSearchInput() {
  // UInput 的实例有 inputRef 属性，兄弟溯取底层 input
  const el =
    searchInputRef.value?.inputRef ||
    (searchInputRef.value as unknown as HTMLElement | null)?.querySelector?.(
      "input",
    );
  (el as HTMLInputElement | undefined)?.focus();
  (el as HTMLInputElement | undefined)?.select?.();
}

const toast = useToast();
const { openPreview } = useImagePreview();
const {
  history: searchHistory,
  add: addHistory,
  remove: removeHistory,
  clear: clearHistory,
} = useSearchHistory();
const { copy: doCopy, isCopied } = useCopy();

// 搜索历史下拉展示状态
const historyOpen = ref(false);
function closeHistorySoon() {
  // 延迟关闭，避免点击面板项时 blur 抓早关闭导致点击失效
  setTimeout(() => (historyOpen.value = false), 180);
}

// 网盘类型预设组合（一键勾选）
const typePresets = [
  {
    key: "video",
    label: "影视常用",
    icon: "i-lucide-film",
    types: ["aliyun", "quark", "baidu"],
  },
  {
    key: "fast",
    label: "高速下载",
    icon: "i-lucide-zap",
    types: ["xunlei", "115", "123"],
  },
  {
    key: "magnet",
    label: "磁力 / 电驴",
    icon: "i-lucide-magnet",
    types: ["magnet", "ed2k"],
  },
  {
    key: "all",
    label: "全部",
    icon: "i-lucide-check-check",
    types: [],
  },
];

function applyPreset(types: string[]) {
  // 若当前选中的类型与预设完全一致 -> 再次点击即取消
  const same =
    selectedTypes.value.length === types.length &&
    types.every((t) => selectedTypes.value.includes(t));
  selectedTypes.value = same ? [] : [...types];
}
function isPresetActive(types: string[]) {
  if (types.length === 0) return selectedTypes.value.length === 0;
  return (
    selectedTypes.value.length === types.length &&
    types.every((t) => selectedTypes.value.includes(t))
  );
}

// 热门关键词建议
const hotKeywords = [
  "庆余年",
  "斗罗大陆",
  "仙逆",
  "雪中悍刀行",
  "Windows 11",
  "Office 2021",
];

// 计算属性：结果按网盘类型分组的数组（已应用二次筛选与排序）
const groupedResults = computed(() => {
  if (!result.value?.merged_by_type) return [];
  const filterText = resultFilter.value.trim().toLowerCase();

  return Object.entries(result.value.merged_by_type)
    .filter(([, items]) => items && items.length > 0)
    .map(([type, items]) => {
      let list = items;

      // 二次筛选：标题 / source 匹配
      if (filterText) {
        list = list.filter((it) => {
          const plain = plainNote(it.note).toLowerCase();
          const src = (it.source || "").toLowerCase();
          return plain.includes(filterText) || src.includes(filterText);
        });
      }

      // 排序
      if (sortBy.value !== "default") {
        const sorted = [...list];
        sorted.sort((a, b) => {
          if (sortBy.value === "title") {
            return plainNote(a.note).localeCompare(plainNote(b.note), "zh-CN");
          }
          const ta = a.datetime ? new Date(a.datetime).getTime() : 0;
          const tb = b.datetime ? new Date(b.datetime).getTime() : 0;
          return sortBy.value === "date-asc" ? ta - tb : tb - ta;
        });
        list = sorted;
      }

      return {
        type,
        label: colorMap[type]?.label ?? type,
        icon: colorMap[type]?.icon ?? "i-lucide-cloud",
        color: colorMap[type]?.color ?? "neutral",
        accent:
          colorMap[type]?.accent ??
          "from-slate-500/15 to-slate-500/5 text-slate-700 dark:text-slate-300 ring-slate-500/30",
        dot: colorMap[type]?.dot ?? "bg-slate-500",
        items: list,
      };
    })
    .filter((g) => g.items.length > 0);
});

const totalCount = computed(() =>
  groupedResults.value.reduce((sum, g) => sum + g.items.length, 0),
);
const rawTotalCount = computed(() => result.value?.total ?? 0);

// 所有可直接打开的 http(s) 链接（用于“全部打开”功能）
const openableUrls = computed<string[]>(() => {
  return groupedResults.value.flatMap((g) =>
    g.items.map((it) => it.url).filter((u): u is string => !!u && isHttpUrl(u)),
  );
});

// 一键打开全部链接
// ⚠️ 关键：必须在 click 同步上下文中连续调用 window.open，
//    若用 setTimeout 延迟会丢失“用户手势”，除第一个外其余全部被拦截。
function openAllLinks() {
  const urls = openableUrls.value;
  if (urls.length === 0) {
    toast.add({
      title: "没有可打开的链接",
      description: "当前结果中没有 http(s) 类型的直链",
      color: "warning",
      icon: "i-lucide-alert-circle",
    });
    return;
  }

  // 打开过多标签页容易被浏览器拦截，超过阈值时二次确认
  if (urls.length > 10) {
    const ok = window.confirm(
      `即将打开 ${urls.length} 个标签页，可能会被浏览器拦截，是否继续？\n\n提示：若被拦截，请在地址栏允许本站弹出窗口后重试。`,
    );
    if (!ok) return;
  }

  // 同步批量打开：不用 setTimeout，保留用户手势上下文
  let opened = 0;
  let blocked = 0;
  for (const url of urls) {
    const win = window.open(url, "_blank", "noopener,noreferrer");
    if (win) {
      opened += 1;
    } else {
      blocked += 1;
    }
  }

  if (blocked > 0 && opened === 0) {
    // 全部被拦截：提醒用户开启弹窗权限
    toast.add({
      title: `所有链接均被浏览器拦截`,
      description:
        "请点击地址栏右侧的“弹出窗口被阻止”图标，选择“始终允许”后重试",
      color: "error",
      icon: "i-lucide-shield-alert",
      duration: 8000,
    });
  } else if (blocked > 0) {
    toast.add({
      title: `已打开 ${opened} 个，${blocked} 个被拦截`,
      description: "请在浏览器地址栏允许本站弹出窗口后重试",
      color: "warning",
      icon: "i-lucide-shield-alert",
      duration: 6000,
    });
  } else {
    toast.add({
      title: `已打开 ${opened} 个链接`,
      color: "success",
      icon: "i-lucide-check",
    });
  }
}

// 当前搜索的 AbortController，用于中断上一次未完成的请求
let currentAbort: AbortController | null = null;

// 将当前状态同步到 URL Query（replace，不新增历史记录）
function syncQuery(kw: string, types: string[]) {
  const query: Record<string, string> = {};
  if (kw) query.kw = kw;
  if (types.length > 0) query.types = types.join(",");
  router.replace({ query });
}

// 发起搜索
async function handleSearch() {
  const kw = keyword.value.trim();
  if (!kw) {
    toast.add({
      title: "请输入关键词",
      color: "warning",
      icon: "i-lucide-alert-circle",
    });
    focusSearchInput();
    return;
  }

  // 取消上一次未完成的请求
  currentAbort?.abort();
  const ac = new AbortController();
  currentAbort = ac;

  loading.value = true;
  error.value = null;
  hasSearched.value = true;
  historyOpen.value = false;
  // 重置结果筛选排序与折叠状态
  resultFilter.value = "";
  collapsedGroups.value = new Set();

  // 写入历史 + 同步到 URL
  addHistory(kw);
  syncQuery(kw, selectedTypes.value);

  try {
    const params: Record<string, string> = { kw };
    if (selectedTypes.value.length > 0) {
      params.cloud_types = selectedTypes.value.join(",");
    }

    const res = await $fetch<JhsjResponse>("/api/jhsj", {
      params,
      signal: ac.signal,
    });

    if (ac.signal.aborted) return;

    if (res.code !== 0) {
      throw new Error(res.message || "搜索失败");
    }
    result.value = res.data ?? { total: 0, merged_by_type: {} };
  } catch (e: any) {
    if (e?.name === "AbortError" || ac.signal.aborted) return;
    error.value = e?.data?.statusMessage || e?.message || "网络请求失败";
    result.value = null;
  } finally {
    if (currentAbort === ac) currentAbort = null;
    loading.value = false;
  }
}

// 重试当前搜索
function retrySearch() {
  handleSearch();
}

// 点击热门关键词 / 历史
function useHot(kw: string) {
  keyword.value = kw;
  historyOpen.value = false;
  handleSearch();
}

// 复制链接/密码（带按钮瀑时状态）
async function copyText(key: string, text: string, label = "链接") {
  const ok = await doCopy(key, text);
  if (ok) {
    toast.add({
      title: `${label}已复制`,
      color: "success",
      icon: "i-lucide-check",
    });
  } else {
    toast.add({ title: "复制失败", color: "error", icon: "i-lucide-x" });
  }
}

// 构建当前页面分享用的 URL（包含 kw / types query，方便好友点开后直接看到同一组搜索结果）
function buildShareUrl(): string {
  if (typeof window === "undefined") return "";
  try {
    const u = new URL(window.location.href);
    if (keyword.value.trim()) u.searchParams.set("kw", keyword.value.trim());
    if (selectedTypes.value.length > 0)
      u.searchParams.set("types", selectedTypes.value.join(","));
    return u.toString();
  } catch {
    return window.location.href;
  }
}

// 分享单条资源：优先 Web Share API（移动端系统分享面板），不支持则回退到复制分享文案
async function shareItem(key: string, item: ResourceItem, groupLabel: string) {
  const shareUrl = buildShareUrl();
  const title = `${plainNote(item.note)} · 聚合网盘搜索`;
  const passwordLine = item.password ? `（提取码：${item.password}）` : "";
  const text =
    `【${groupLabel}】${plainNote(item.note)}\n` +
    `${item.url}${passwordLine}\n` +
    `👉 或直接在聚合搜索查看全网结果`;

  // 1) 优先用系统原生分享面板（移动端 / 部分桌面浏览器支持）
  if (
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function"
  ) {
    try {
      await navigator.share({ title, text, url: shareUrl });
      toast.add({
        title: "分享已发送",
        color: "success",
        icon: "i-lucide-share-2",
      });
      return;
    } catch (e: any) {
      // 用户主动取消：静默返回
      if (e?.name === "AbortError") return;
      // 其他异常走复制分支
    }
  }

  // 2) 回退：复制分享文案到剪贴板
  const payload = `${title}\n\n${text}\n\n${shareUrl}`;
  const ok = await doCopy(key, payload);
  if (ok) {
    toast.add({
      title: "分享链接已复制",
      description: "已将标题 + 链接 + 页面地址放入剪贴板",
      color: "success",
      icon: "i-lucide-share-2",
    });
  } else {
    toast.add({ title: "分享失败", color: "error", icon: "i-lucide-x" });
  }
}

// 一键复制全部链接（纯文本列表，每行一条，带提取码）
async function copyAllLinks() {
  const lines: string[] = [];
  for (const g of groupedResults.value) {
    for (const it of g.items) {
      const line = it.password ? `${it.url}  提取码:${it.password}` : it.url;
      lines.push(`[${g.label}] ${plainNote(it.note)}\n${line}`);
    }
  }
  if (lines.length === 0) {
    toast.add({
      title: "没有可复制的链接",
      color: "warning",
      icon: "i-lucide-alert-circle",
    });
    return;
  }
  const ok = await doCopy("all-links", lines.join("\n\n"));
  if (ok) {
    toast.add({
      title: `已复制 ${lines.length} 条链接到剪贴板`,
      color: "success",
      icon: "i-lucide-clipboard-check",
    });
  } else {
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

// ===== note 字段处理：接口可能返回含 <span class="highlight-keyword"> 的 HTML 片段 =====
// 1) 提取高亮片段，其余 HTML 全部剥离；2) 对所有文本做转义防 XSS；3) 仅以 <mark> 呈现高亮。
function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type NoteToken = { type: "text" | "mark"; value: string };

function tokenizeNote(raw?: string): NoteToken[] {
  if (!raw) return [];
  // 匹配 <span ... class="...highlight-keyword..." ...>xxx</span>，单/双引号、大小写均兼容
  const re =
    /<span[^>]*class\s*=\s*["']?[^"'>]*\bhighlight-keyword\b[^"'>]*["']?[^>]*>([\s\S]*?)<\/span>/gi;
  const tokens: NoteToken[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    if (m.index > lastIndex) {
      tokens.push({ type: "text", value: raw.slice(lastIndex, m.index) });
    }
    tokens.push({ type: "mark", value: m[1] ?? "" });
    lastIndex = re.lastIndex;
  }
  if (lastIndex < raw.length) {
    tokens.push({ type: "text", value: raw.slice(lastIndex) });
  }
  // 兜底：再剥一次残留标签，并做简单空白折叠
  return tokens
    .map((t) => ({
      type: t.type,
      value: t.value.replace(/<[^>]+>/g, "").replace(/\s+/g, " "),
    }))
    .filter((t) => t.value.length > 0);
}

// 纯文本 note，用于 title / alt / aria-label
function plainNote(raw?: string): string {
  const txt = tokenizeNote(raw)
    .map((t) => t.value)
    .join("")
    .trim();
  return txt || "未命名资源";
}

// 带高亮的安全 HTML，用于 v-html 渲染
function renderNote(raw?: string): string {
  const tokens = tokenizeNote(raw);
  if (tokens.length === 0) return escapeHtml("未命名资源");
  return tokens
    .map((t) =>
      t.type === "mark" ?
        `<mark class="rounded px-0.5 bg-amber-200/70 dark:bg-amber-400/25 text-amber-900 dark:text-amber-200">${escapeHtml(t.value)}</mark>`
      : escapeHtml(t.value),
    )
    .join("");
}

// ===== 动态页面标题：搜索后随关键词变化 =====
useHead({
  title: () =>
    hasSearched.value && keyword.value ?
      `${keyword.value} - 聚合网盘搜索`
    : "聚合网盘搜索 · 全网资源一键直达",
});

// ===== 全局快捷键 =====
// - “/” 或 “Ctrl+K / ⌘K” 聚焦搜索框
// - “Esc” 清空关键词（仅当搜索框已聚焦时）
function onGlobalKeydown(e: KeyboardEvent) {
  const target = e.target as HTMLElement | null;
  const isTyping =
    !!target &&
    (target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      (target as HTMLElement).isContentEditable);

  // Ctrl+K / Cmd+K
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    focusSearchInput();
    return;
  }
  // "/" 快捷键（仅当未在输入状态时触发）
  if (e.key === "/" && !isTyping) {
    e.preventDefault();
    focusSearchInput();
    return;
  }
  // Esc：输入框内按下清空关键词
  if (e.key === "Escape" && isTyping && target?.tagName === "INPUT") {
    if (keyword.value) {
      keyword.value = "";
      e.preventDefault();
    }
  }
}

onMounted(() => {
  window.addEventListener("keydown", onGlobalKeydown);
  // 初入场若 URL 中带有 kw 则自动搜索
  if (keyword.value) {
    handleSearch();
  }
});
onBeforeUnmount(() => {
  window.removeEventListener("keydown", onGlobalKeydown);
  currentAbort?.abort();
});

// 网盘类型选择变化时同步到 URL（关键词在搜索时同步）
watch(selectedTypes, (v) => {
  if (hasSearched.value) {
    syncQuery(keyword.value.trim(), v);
  }
});
</script>

<template>
  <div class="mx-auto max-w-7xl xl:max-w-8xl px-4 pb-16 sm:px-6 lg:pb-24">
    <!-- ============ Hero 区 ============ -->
    <section class="pt-0">
      <div class="flex flex-col items-center text-center">
        <!-- 徽章 -->
        <div
          data-aos="fade-down"
          data-aos-duration="600"
          class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium text-primary-700 dark:text-primary-300 bg-primary-50/80 dark:bg-primary-950/40 ring-1 ring-primary-200/60 dark:ring-primary-900/50 backdrop-blur-sm"
        >
          <span class="relative flex size-1.5">
            <span
              class="absolute inline-flex size-full rounded-full bg-primary-500 opacity-75 animate-ping"
            />
            <span
              class="relative inline-flex size-1.5 rounded-full bg-primary-500"
            />
          </span>
          120+ TG 群实时采集
        </div>

        <!-- 主标题 -->
        <h1
          data-aos="fade-up"
          data-aos-delay="100"
          class="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]"
        >
          <span class="text-slate-900 dark:text-white">发现全网资源，</span>
          <span class="gradient-text">聚合十二大网盘</span>
        </h1>

        <!-- 副标题 -->
        <p
          data-aos="fade-up"
          data-aos-delay="200"
          class="mt-5 max-w-2xl text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed"
        >
          短剧 · 影视 · 软件 · 电子书，一次搜索，<span
            class="font-semibold text-slate-800 dark:text-slate-200"
            >百度 / 阿里 / 夸克 / 迅雷 / 115</span
          >
          全盘直达。
        </p>
      </div>
    </section>

    <!-- ============ 搜索卡（玻璃态） ============ -->
    <section class="mt-10">
      <div
        data-aos="fade-up"
        data-aos-delay="300"
        data-aos-duration="800"
        class="relative glass rounded-2xl p-4 sm:p-6 shadow-xl shadow-primary-500/5"
      >
        <!-- 顶部渐变细条 -->
        <div
          class="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-primary-400/70 to-transparent"
          aria-hidden="true"
        />

        <div class="space-y-5">
          <!-- 搜索框 -->
          <div class="flex flex-col sm:flex-row gap-3">
            <div class="relative flex-1">
              <UInput
                ref="searchInputRef"
                v-model="keyword"
                size="xl"
                placeholder="输入关键词，例如：仙逆、斗罗大陆、庆余年… （按 / 快速聚焦）"
                icon="i-lucide-search"
                class="w-full"
                :ui="{ base: 'w-full pr-20' }"
                @keyup.enter="handleSearch"
                @focus="historyOpen = true"
                @blur="closeHistorySoon"
              />
              <!-- 右侧嵌入按钮组：清空 + 快捷键提示 -->
              <div
                class="absolute inset-y-0 right-2 flex items-center gap-1 pointer-events-none"
              >
                <button
                  v-if="keyword"
                  type="button"
                  aria-label="清空关键词"
                  class="pointer-events-auto inline-flex size-6 items-center justify-center rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  @mousedown.prevent
                  @click="
                    keyword = '';
                    focusSearchInput();
                  "
                >
                  <UIcon name="i-lucide-x" class="size-4" />
                </button>
                <kbd
                  v-if="!keyword"
                  class="pointer-events-none hidden sm:inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-mono text-slate-400 dark:text-slate-500 ring-1 ring-slate-200 dark:ring-slate-700 bg-white/70 dark:bg-slate-900/70"
                  aria-hidden="true"
                >
                  <span>Ctrl</span><span>K</span>
                </kbd>
              </div>

              <!-- 搜索历史下拉面板 -->
              <div
                v-if="historyOpen && searchHistory.length > 0"
                class="absolute z-20 left-0 right-0 mt-1.5 rounded-xl glass shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/60 dark:ring-slate-800/60 overflow-hidden"
                @mousedown.prevent
              >
                <div
                  class="flex items-center justify-between px-3 pt-2 pb-1 text-[11px] text-slate-500 dark:text-slate-400"
                >
                  <span class="inline-flex items-center gap-1">
                    <UIcon name="i-lucide-history" class="size-3.5" />
                    搜索历史
                  </span>
                  <button
                    type="button"
                    class="hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                    @click="clearHistory"
                  >
                    清空全部
                  </button>
                </div>
                <ul class="max-h-64 overflow-y-auto py-1">
                  <li
                    v-for="h in searchHistory"
                    :key="h"
                    class="group/hi flex items-center gap-2 px-3 py-1.5 hover:bg-primary-50/70 dark:hover:bg-primary-950/30 cursor-pointer transition-colors"
                    @click="useHot(h)"
                  >
                    <UIcon
                      name="i-lucide-corner-down-left"
                      class="size-3.5 text-slate-400 shrink-0"
                    />
                    <span
                      class="flex-1 truncate text-sm text-slate-700 dark:text-slate-200"
                    >
                      {{ h }}
                    </span>
                    <button
                      type="button"
                      aria-label="删除该历史"
                      class="opacity-0 group-hover/hi:opacity-100 size-5 flex items-center justify-center rounded text-slate-400 hover:text-error-500 transition-opacity"
                      @click.stop="removeHistory(h)"
                    >
                      <UIcon name="i-lucide-x" class="size-3.5" />
                    </button>
                  </li>
                </ul>
              </div>
            </div>
            <UButton
              size="xl"
              color="primary"
              icon="i-lucide-search"
              :loading="loading"
              :disabled="loading"
              class="cursor-pointer shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-shadow"
              @click="handleSearch"
            >
              {{ loading ? "搜索中" : "立即搜索" }}
            </UButton>
          </div>

          <!-- 热门关键词 -->
          <div class="flex flex-wrap items-center gap-2">
            <span
              class="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-medium"
            >
              <UIcon name="i-lucide-flame" class="size-3.5 text-orange-500" />
              热搜：
            </span>
            <button
              v-for="kw in hotKeywords"
              :key="kw"
              type="button"
              class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/60 ring-1 ring-slate-200 dark:ring-slate-700/80 hover:text-primary-600 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-950/40 hover:ring-primary-300/60 dark:hover:ring-primary-800/60 transition-colors cursor-pointer"
              @click="useHot(kw)"
            >
              {{ kw }}
            </button>
          </div>

          <!-- 分隔线 -->
          <div
            class="h-px bg-slate-200/70 dark:bg-slate-800/80"
            aria-hidden="true"
          />

          <!-- 网盘类型多选（彩色 chip） -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <span
                class="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                <UIcon name="i-lucide-filter" class="size-4 text-slate-400" />
                网盘类型
                <span class="text-slate-400 dark:text-slate-500 font-normal">
                  · 不选即聚合全部
                </span>
              </span>
              <UButton
                v-if="selectedTypes.length > 0"
                size="xs"
                variant="ghost"
                color="neutral"
                icon="i-lucide-x"
                class="cursor-pointer"
                @click="selectedTypes = []"
              >
                清空 ({{ selectedTypes.length }})
              </UButton>
            </div>

            <!-- 快捷预设组合 -->
            <div class="mb-3 flex flex-wrap gap-2">
              <button
                v-for="p in typePresets"
                :key="p.key"
                type="button"
                :class="[
                  'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ring-1 transition-colors cursor-pointer select-none',
                  isPresetActive(p.types) ?
                    'bg-primary-500/10 text-primary-700 dark:text-primary-300 ring-primary-400/50 dark:ring-primary-500/40'
                  : 'text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-800/40 ring-slate-200 dark:ring-slate-700 hover:text-slate-800 dark:hover:text-slate-200 hover:ring-slate-300 dark:hover:ring-slate-600',
                ]"
                :title="`快捷选择：${p.label}`"
                @click="applyPreset(p.types)"
              >
                <UIcon :name="p.icon" class="size-3.5" />
                {{ p.label }}
              </button>
            </div>

            <div class="flex flex-wrap gap-2">
              <button
                v-for="ct in cloudTypes"
                :key="ct.value"
                type="button"
                :class="[
                  'group/chip inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 transition-colors cursor-pointer select-none',
                  selectedTypes.includes(ct.value) ?
                    `bg-linear-to-br ${ct.accent} ring-2`
                  : 'text-slate-600 dark:text-slate-400 bg-white/60 dark:bg-slate-800/50 ring-slate-200 dark:ring-slate-700 hover:text-slate-900 dark:hover:text-white hover:ring-slate-300 dark:hover:ring-slate-600',
                ]"
                @click="
                  selectedTypes.includes(ct.value) ?
                    (selectedTypes = selectedTypes.filter(
                      (t) => t !== ct.value,
                    ))
                  : selectedTypes.push(ct.value)
                "
              >
                <span
                  :class="[
                    'size-1.5 rounded-full transition-colors',
                    selectedTypes.includes(ct.value) ?
                      ct.dot
                    : 'bg-slate-300 dark:bg-slate-600 group-hover/chip:bg-slate-400',
                  ]"
                />
                {{ ct.label }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ 错误提示 ============ -->
    <UAlert
      v-if="error"
      data-aos="fade-down"
      data-aos-duration="400"
      color="error"
      variant="soft"
      icon="i-lucide-alert-triangle"
      title="搜索失败"
      :description="error"
      class="mt-6"
      :close-button="{ icon: 'i-lucide-x', color: 'neutral', variant: 'link' }"
      :actions="[
        {
          label: '重试',
          icon: 'i-lucide-refresh-ccw',
          color: 'error',
          variant: 'solid',
          onClick: retrySearch,
        },
      ]"
      @close="error = null"
    />

    <!-- ============ 加载中：骨架屏 ============ -->
    <div
      v-if="loading"
      aria-busy="true"
      aria-live="polite"
      class="mt-10 space-y-6"
    >
      <!-- 顶部统计条骨架 -->
      <div class="glass rounded-2xl p-5">
        <div class="flex items-center gap-4">
          <div class="size-11 rounded-xl skeleton-bar" />
          <div class="flex-1 space-y-2">
            <div class="h-3 w-40 skeleton-bar rounded" />
            <div class="h-5 w-56 skeleton-bar rounded" />
          </div>
        </div>
      </div>
      <!-- 分组骨架 × 2 -->
      <div v-for="n in 2" :key="`sk-${n}`" class="space-y-4">
        <div class="flex items-center gap-3">
          <div class="size-10 rounded-xl skeleton-bar" />
          <div class="h-4 w-24 skeleton-bar rounded" />
          <div class="flex-1 h-px bg-slate-200/60 dark:bg-slate-800/60" />
        </div>
        <div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <div
            v-for="c in 3"
            :key="`sk-c-${n}-${c}`"
            class="glass rounded-2xl overflow-hidden"
          >
            <div class="aspect-16/10 skeleton-bar" />
            <div class="p-4 space-y-3">
              <div class="h-4 w-3/4 skeleton-bar rounded" />
              <div class="h-3 w-1/2 skeleton-bar rounded" />
              <div class="h-8 skeleton-bar rounded-lg" />
            </div>
          </div>
        </div>
      </div>
      <div
        class="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400"
      >
        <UIcon name="i-lucide-loader-2" class="size-4 animate-spin" />
        正在全网搜索资源…
      </div>
    </div>

    <!-- ============ 空状态（已搜索但无结果） ============ -->
    <div
      v-else-if="hasSearched && !error && totalCount === 0"
      data-aos="fade-up"
      data-aos-duration="500"
      class="mt-10 glass rounded-2xl text-center py-16 px-6"
    >
      <div
        class="mx-auto flex size-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800/60 ring-1 ring-slate-200 dark:ring-slate-700"
      >
        <UIcon
          name="i-lucide-inbox"
          class="size-7 text-slate-400 dark:text-slate-500"
        />
      </div>
      <p
        class="mt-4 text-base font-semibold text-slate-800 dark:text-slate-100"
      >
        未找到相关资源
      </p>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
        换个关键词、或调整网盘类型再试一次
      </p>
    </div>

    <!-- ============ 搜索结果 ============ -->
    <div
      v-else-if="groupedResults.length > 0"
      v-auto-animate
      class="mt-10 space-y-12"
    >
      <!-- 统计条（玻璃态 + 渐变） -->
      <div
        data-aos="fade-right"
        data-aos-duration="700"
        class="relative overflow-hidden rounded-2xl glass p-5 ring-1 ring-primary-200/50 dark:ring-primary-900/40"
      >
        <div
          class="absolute -top-20 -right-20 size-56 rounded-full bg-primary-500/15 blur-3xl"
          aria-hidden="true"
        />
        <div
          class="absolute -bottom-24 -left-10 size-56 rounded-full bg-violet-500/15 blur-3xl"
          aria-hidden="true"
        />
        <div class="relative flex items-center gap-4">
          <div
            class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary-500 to-violet-500 shadow-lg shadow-primary-500/30"
          >
            <UIcon name="i-lucide-sparkles" class="size-5 text-white" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm text-slate-600 dark:text-slate-400">
              已为关键词
              <code
                class="mx-1 px-1.5 py-0.5 rounded-md text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >{{ keyword }}</code
              >
              聚合全网资源
            </p>
            <div class="mt-1 flex items-baseline gap-3">
              <span
                class="text-2xl font-bold gradient-text tabular-nums leading-none"
                >{{ totalCount }}</span
              >
              <span class="text-sm text-slate-500 dark:text-slate-400"
                >条资源 · 分布在
                <span
                  class="font-semibold text-slate-700 dark:text-slate-300"
                  >{{ groupedResults.length }}</span
                >
                个网盘</span
              >
            </div>
          </div>

          <!-- 右侧操作组：复制全部 + 全部打开 -->
          <div class="flex items-center gap-2 shrink-0">
            <UButton
              color="neutral"
              variant="soft"
              :icon="
                isCopied('all-links') ? 'i-lucide-check' : 'i-lucide-clipboard'
              "
              size="md"
              class="cursor-pointer"
              :title="`复制全部 ${totalCount} 条链接到剪贴板`"
              @click="copyAllLinks"
            >
              <span class="hidden sm:inline">复制全部</span>
              <span class="sm:hidden">复制</span>
            </UButton>
            <UButton
              v-if="openableUrls.length > 0"
              color="primary"
              variant="solid"
              icon="i-lucide-external-link"
              size="md"
              class="cursor-pointer shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-shadow"
              :title="`一键打开 ${openableUrls.length} 个链接`"
              @click="openAllLinks"
            >
              <span class="hidden sm:inline">全部打开</span>
              <span class="sm:hidden">打开</span>
              <UBadge
                :label="String(openableUrls.length)"
                color="neutral"
                variant="solid"
                size="sm"
                class="ml-1 bg-white/20 text-white ring-1 ring-white/30"
              />
            </UButton>
          </div>
        </div>

        <!-- 二次筛选 / 排序工具栏 -->
        <div
          class="relative mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-col sm:flex-row gap-3 sm:items-center"
        >
          <div class="relative flex-1">
            <UInput
              v-model="resultFilter"
              size="sm"
              placeholder="在当前结果中过滤标题 / 来源…"
              icon="i-lucide-filter"
              class="w-full"
              :ui="{ base: 'w-full pr-8' }"
            />
            <button
              v-if="resultFilter"
              type="button"
              aria-label="清空过滤"
              class="absolute right-2 top-1/2 -translate-y-1/2 inline-flex size-5 items-center justify-center rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              @click="resultFilter = ''"
            >
              <UIcon name="i-lucide-x" class="size-3.5" />
            </button>
          </div>
          <div class="flex items-center gap-2">
            <span
              class="text-xs text-slate-500 dark:text-slate-400 shrink-0 inline-flex items-center gap-1"
            >
              <UIcon name="i-lucide-arrow-up-down" class="size-3.5" />
              排序
            </span>
            <div
              class="flex items-center rounded-lg ring-1 ring-slate-200 dark:ring-slate-700 bg-white/60 dark:bg-slate-800/40 overflow-hidden"
            >
              <button
                v-for="opt in [
                  { key: 'default', label: '默认' },
                  { key: 'date-desc', label: '最新' },
                  { key: 'date-asc', label: '最早' },
                  { key: 'title', label: '标题' },
                ]"
                :key="opt.key"
                type="button"
                :class="[
                  'px-2.5 py-1 text-xs font-medium cursor-pointer transition-colors',
                  sortBy === opt.key ?
                    'bg-primary-500 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50',
                ]"
                @click="sortBy = opt.key as typeof sortBy"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 分组 -->
      <div v-for="group in groupedResults" :key="group.type" class="space-y-5">
        <!-- 分组标题（可折叠） -->
        <button
          type="button"
          data-aos="fade-left"
          data-aos-duration="600"
          class="group/gh flex w-full items-center gap-3 cursor-pointer select-none"
          :aria-expanded="!collapsedGroups.has(group.type)"
          :aria-label="`折叠 / 展开 ${group.label} 分组`"
          @click="toggleGroup(group.type)"
        >
          <div
            :class="[
              'flex size-10 items-center justify-center rounded-xl bg-linear-to-br ring-1',
              group.accent,
            ]"
          >
            <UIcon :name="group.icon" class="size-5" />
          </div>
          <div class="flex items-center gap-2">
            <h2
              class="text-lg font-semibold text-slate-900 dark:text-white group-hover/gh:text-primary-600 dark:group-hover/gh:text-primary-400 transition-colors"
            >
              {{ group.label }}
            </h2>
            <span
              class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-700"
            >
              <span :class="['size-1.5 rounded-full', group.dot]" />
              {{ group.items.length }}
            </span>
          </div>
          <div
            class="flex-1 h-px bg-linear-to-r from-slate-200 dark:from-slate-800 to-transparent"
          />
          <span
            :class="[
              'inline-flex size-8 shrink-0 items-center justify-center rounded-lg ring-1 transition-all duration-300',
              collapsedGroups.has(group.type) ?
                'bg-slate-100 dark:bg-slate-800/80 ring-slate-200 dark:ring-slate-700 text-slate-500 dark:text-slate-400'
              : 'bg-primary-50 dark:bg-primary-950/40 ring-primary-200 dark:ring-primary-800/60 text-primary-600 dark:text-primary-300 shadow-sm shadow-primary-500/10',
              'group-hover/gh:ring-primary-400/80 dark:group-hover/gh:ring-primary-500/70 group-hover/gh:bg-primary-100 dark:group-hover/gh:bg-primary-900/50 group-hover/gh:text-primary-700 dark:group-hover/gh:text-primary-200 group-hover/gh:shadow-md group-hover/gh:shadow-primary-500/20 group-hover/gh:scale-110',
            ]"
            aria-hidden="true"
          >
            <UIcon
              name="i-lucide-chevron-down"
              :class="[
                'size-4 transition-transform duration-300',
                collapsedGroups.has(group.type) ? '-rotate-90' : 'rotate-0',
              ]"
            />
          </span>
        </button>

        <!-- 资源列表（折叠时隐藏） -->
        <div
          v-if="!collapsedGroups.has(group.type)"
          v-auto-animate
          class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
        >
          <article
            v-for="(item, idx) in group.items"
            :key="`${group.type}-${idx}`"
            data-aos="fade-up"
            :data-aos-delay="idx * 80"
            class="group relative flex flex-col overflow-hidden rounded-2xl glass transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary-500/15 hover:ring-primary-300/60 dark:hover:ring-primary-700/60"
          >
            <!-- 封面区：有图 = 头图，无图 = 渐变占位 -->
            <div
              :class="[
                'relative aspect-16/10 w-full overflow-hidden bg-linear-to-br',
                group.accent,
              ]"
            >
              <!-- 降级层：图片加载失败时 img 隐藏后显露出来 -->
              <div
                class="absolute inset-0 flex items-center justify-center"
                aria-hidden="true"
              >
                <UIcon
                  :name="group.icon"
                  class="size-14 opacity-25 group-hover:opacity-40 transition-opacity"
                />
              </div>
              <!-- 有图：主图 + 左下角缩略图栈 -->
              <template v-if="normalizeImages(item.images).length > 0">
                <button
                  type="button"
                  class="absolute inset-0 block cursor-zoom-in"
                  :aria-label="`预览${plainNote(item.note)}图片`"
                  @click="openPreview(normalizeImages(item.images), 0)"
                >
                  <img
                    :src="normalizeImages(item.images)[0]"
                    :alt="plainNote(item.note)"
                    loading="lazy"
                    referrerpolicy="no-referrer"
                    class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    @error="
                      ($event.target as HTMLImageElement).style.display = 'none'
                    "
                  />
                </button>
                <!-- 底部渐黑遮罩 -->
                <div
                  class="pointer-events-none absolute inset-0 bg-linear-to-t from-slate-950/70 via-slate-950/0 to-slate-950/0"
                />
                <!-- 缩略图栈 -->
                <div
                  v-if="normalizeImages(item.images).length > 1"
                  class="absolute bottom-2 left-2 flex gap-1"
                >
                  <button
                    v-for="(img, i) in normalizeImages(item.images).slice(1, 4)"
                    :key="`${group.type}-${idx}-thumb-${i}`"
                    type="button"
                    class="block size-8 overflow-hidden rounded-md ring-2 ring-white/70 dark:ring-slate-900/70 hover:ring-primary-400 transition-shadow cursor-pointer"
                    :aria-label="`预览第 ${i + 2} 张图`"
                    @click.stop="
                      openPreview(normalizeImages(item.images), i + 1)
                    "
                  >
                    <img
                      :src="img"
                      :alt="`预览 ${i + 2}`"
                      loading="lazy"
                      referrerpolicy="no-referrer"
                      class="h-full w-full object-cover"
                      @error="
                        ($event.target as HTMLImageElement).style.display =
                          'none'
                      "
                    />
                  </button>
                  <button
                    v-if="normalizeImages(item.images).length > 4"
                    type="button"
                    class="flex size-8 items-center justify-center rounded-md text-[10px] font-semibold text-white bg-slate-900/60 backdrop-blur ring-2 ring-white/70 dark:ring-slate-900/70 hover:bg-slate-900/80 cursor-pointer"
                    :aria-label="`查看全部 ${normalizeImages(item.images).length} 张图`"
                    @click.stop="openPreview(normalizeImages(item.images), 4)"
                  >
                    +{{ normalizeImages(item.images).length - 4 }}
                  </button>
                </div>
              </template>

              <!-- 无图：仅保留右下装饰圆（渐变 + 图标由外层降级层提供） -->
              <template v-else>
                <div
                  class="absolute -bottom-6 -right-6 size-24 rounded-full bg-white/10 dark:bg-white/5"
                  aria-hidden="true"
                />
              </template>

              <!-- 左上角：网盘徽标 -->
              <div
                class="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full pl-1 pr-2 py-0.5 text-[11px] font-medium text-white bg-slate-950/60 backdrop-blur-md ring-1 ring-white/10"
              >
                <span
                  :class="['size-4 rounded-full', group.dot]"
                  aria-hidden="true"
                />
                {{ group.label }}
              </div>

              <!-- 右上角：提取码 -->
              <div
                v-if="item.password"
                class="absolute top-2.5 right-2.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-amber-50 bg-amber-500/80 backdrop-blur-md ring-1 ring-amber-300/50"
              >
                <UIcon name="i-lucide-key-round" class="size-3" />
                <code class="font-mono font-semibold">{{ item.password }}</code>
              </div>
            </div>

            <!-- 内容区 -->
            <div class="flex flex-col flex-1 p-4">
              <h3
                class="text-sm font-semibold text-slate-900 dark:text-white leading-snug line-clamp-2 mb-2 min-h-10"
                :title="plainNote(item.note)"
                v-html="renderNote(item.note)"
              />

              <!-- 元信息 -->
              <div
                class="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3 text-[11px] text-slate-500 dark:text-slate-400"
              >
                <span
                  v-if="item.source"
                  class="inline-flex items-center gap-1 truncate max-w-36"
                >
                  <UIcon
                    name="i-lucide-tag"
                    class="size-3 shrink-0 text-slate-400"
                  />
                  <span class="truncate">{{ item.source }}</span>
                </span>
                <span
                  v-if="formatDate(item.datetime)"
                  class="inline-flex items-center gap-1"
                >
                  <UIcon
                    name="i-lucide-calendar"
                    class="size-3 shrink-0 text-slate-400"
                  />
                  {{ formatDate(item.datetime) }}
                </span>
              </div>

              <!-- 链接 -->
              <div
                class="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-slate-50/80 dark:bg-slate-950/60 ring-1 ring-slate-200/70 dark:ring-slate-800/70 mb-3"
              >
                <UIcon
                  name="i-lucide-link-2"
                  class="size-3.5 text-slate-400 shrink-0"
                />
                <span
                  class="flex-1 text-[11px] text-slate-600 dark:text-slate-400 font-mono truncate"
                  :title="item.url"
                >
                  {{ item.url }}
                </span>
              </div>

              <!-- 操作按钮 -->
              <div class="mt-auto flex items-center gap-1.5">
                <UButton
                  v-if="isHttpUrl(item.url)"
                  size="sm"
                  color="primary"
                  variant="solid"
                  icon="i-lucide-external-link"
                  :to="item.url"
                  target="_blank"
                  block
                  class="flex-1 cursor-pointer shadow-sm shadow-primary-500/20 hover:shadow-primary-500/40 transition-shadow"
                >
                  立即前往
                </UButton>
                <UButton
                  v-else
                  size="sm"
                  :color="
                    isCopied(`${group.type}-${idx}-url`) ? 'success' : 'neutral'
                  "
                  variant="soft"
                  :icon="
                    isCopied(`${group.type}-${idx}-url`) ? 'i-lucide-check' : (
                      'i-lucide-copy'
                    )
                  "
                  block
                  class="flex-1 cursor-pointer"
                  @click="
                    copyText(`${group.type}-${idx}-url`, item.url, '链接')
                  "
                >
                  {{
                    isCopied(`${group.type}-${idx}-url`) ? "已复制" : "复制链接"
                  }}
                </UButton>
                <UButton
                  v-if="isHttpUrl(item.url)"
                  size="sm"
                  :color="
                    isCopied(`${group.type}-${idx}-url`) ? 'success' : 'neutral'
                  "
                  variant="soft"
                  :icon="
                    isCopied(`${group.type}-${idx}-url`) ? 'i-lucide-check' : (
                      'i-lucide-copy'
                    )
                  "
                  square
                  class="cursor-pointer"
                  :title="
                    isCopied(`${group.type}-${idx}-url`) ? '已复制' : '复制链接'
                  "
                  aria-label="复制链接"
                  @click="
                    copyText(`${group.type}-${idx}-url`, item.url, '链接')
                  "
                />
                <UButton
                  v-if="item.password"
                  size="sm"
                  :color="
                    isCopied(`${group.type}-${idx}-pwd`) ? 'success' : 'warning'
                  "
                  variant="soft"
                  :icon="
                    isCopied(`${group.type}-${idx}-pwd`) ? 'i-lucide-check' : (
                      'i-lucide-key-round'
                    )
                  "
                  square
                  class="cursor-pointer"
                  :title="
                    isCopied(`${group.type}-${idx}-pwd`) ? '已复制' : (
                      '复制提取码'
                    )
                  "
                  aria-label="复制提取码"
                  @click="
                    copyText(
                      `${group.type}-${idx}-pwd`,
                      item.password!,
                      '提取码',
                    )
                  "
                />
                <UButton
                  size="sm"
                  :color="
                    isCopied(`${group.type}-${idx}-share`) ? 'success' : (
                      'primary'
                    )
                  "
                  variant="soft"
                  :icon="
                    isCopied(`${group.type}-${idx}-share`) ? 'i-lucide-check'
                    : 'i-lucide-share-2'
                  "
                  square
                  class="cursor-pointer"
                  :title="
                    isCopied(`${group.type}-${idx}-share`) ? '分享链接已复制'
                    : '分享到好友 / 复制分享链接'
                  "
                  aria-label="分享"
                  @click="
                    shareItem(`${group.type}-${idx}-share`, item, group.label)
                  "
                />
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>

    <!-- ============ 首次进入提示 ============ -->
    <div
      v-else-if="!hasSearched"
      data-aos="fade-up"
      data-aos-delay="400"
      data-aos-duration="700"
      class="mt-10 glass rounded-2xl p-8 sm:p-10 text-center"
    >
      <div class="relative mx-auto flex size-16 items-center justify-center">
        <div
          class="absolute inset-0 rounded-2xl bg-linear-to-br from-primary-500 to-violet-500 opacity-20 blur-xl"
          aria-hidden="true"
        />
        <div
          class="relative flex size-16 items-center justify-center rounded-2xl bg-linear-to-br from-primary-500 to-violet-500 shadow-xl shadow-primary-500/30"
        >
          <UIcon name="i-lucide-sparkles" class="size-7 text-white" />
        </div>
      </div>
      <p class="mt-5 text-lg font-semibold text-slate-800 dark:text-slate-100">
        输入关键词，开启资源之旅
      </p>
      <p
        class="mt-1.5 max-w-md mx-auto text-sm text-slate-500 dark:text-slate-400"
      >
        支持百度 / 阿里 / 夸克 / UC / 迅雷 / 115 / 磁力 / 电驴 等
        <span class="font-semibold text-slate-700 dark:text-slate-300">12</span>
        种资源类型
      </p>

      <!-- 小特性条 -->
      <div
        class="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto text-left"
      >
        <div
          data-aos="fade-right"
          data-aos-delay="500"
          class="flex items-start gap-3 rounded-xl p-3 ring-1 ring-slate-200/70 dark:ring-slate-800/70 bg-white/50 dark:bg-slate-900/40"
        >
          <div
            class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 ring-1 ring-sky-500/20"
          >
            <UIcon name="i-lucide-zap" class="size-4" />
          </div>
          <div>
            <p class="text-xs font-semibold text-slate-800 dark:text-slate-200">
              毫秒级聚合
            </p>
            <p
              class="text-[11px] text-slate-500 dark:text-slate-400 leading-snug"
            >
              并发请求多源，最快 2s 返回
            </p>
          </div>
        </div>
        <div
          data-aos="fade-right"
          data-aos-delay="600"
          class="flex items-start gap-3 rounded-xl p-3 ring-1 ring-slate-200/70 dark:ring-slate-800/70 bg-white/50 dark:bg-slate-900/40"
        >
          <div
            class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 ring-1 ring-violet-500/20"
          >
            <UIcon name="i-lucide-shield-check" class="size-4" />
          </div>
          <div>
            <p class="text-xs font-semibold text-slate-800 dark:text-slate-200">
              无需登录
            </p>
            <p
              class="text-[11px] text-slate-500 dark:text-slate-400 leading-snug"
            >
              直链 + 提取码，开箱即用
            </p>
          </div>
        </div>
        <div
          data-aos="fade-right"
          data-aos-delay="700"
          class="flex items-start gap-3 rounded-xl p-3 ring-1 ring-slate-200/70 dark:ring-slate-800/70 bg-white/50 dark:bg-slate-900/40"
        >
          <div
            class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20"
          >
            <UIcon name="i-lucide-wifi-off" class="size-4" />
          </div>
          <div>
            <p class="text-xs font-semibold text-slate-800 dark:text-slate-200">
              离线可用
            </p>
            <p
              class="text-[11px] text-slate-500 dark:text-slate-400 leading-snug"
            >
              PWA 支持，断网秒开
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
