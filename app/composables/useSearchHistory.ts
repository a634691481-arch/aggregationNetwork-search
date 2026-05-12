/**
 * 本地搜索历史管理
 * - 持久化到 localStorage
 * - 去重、限制最大长度
 * - SSR 安全（仅在客户端读写）
 */
const STORAGE_KEY = "jhsj:search-history";
const MAX_ITEMS = 10;

export function useSearchHistory() {
  const history = useState<string[]>("search-history", () => []);

  // 客户端挂载时加载
  onMounted(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          history.value = arr.filter((s) => typeof s === "string").slice(0, MAX_ITEMS);
        }
      }
    } catch {
      history.value = [];
    }
  });

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history.value));
    } catch {
      /* ignore quota errors */
    }
  }

  function add(kw: string) {
    const v = kw.trim();
    if (!v) return;
    history.value = [v, ...history.value.filter((x) => x !== v)].slice(0, MAX_ITEMS);
    persist();
  }

  function remove(kw: string) {
    history.value = history.value.filter((x) => x !== kw);
    persist();
  }

  function clear() {
    history.value = [];
    persist();
  }

  return { history, add, remove, clear };
}
