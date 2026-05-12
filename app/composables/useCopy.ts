/**
 * 带状态反馈的复制：
 * 调用 copy(key, text) 后，isCopied(key) 在 1.5s 内返回 true，
 * 可用于让按钮文本 / 图标瞬时切换为 "已复制"。
 */
export function useCopy() {
  const copiedKey = ref<string | null>(null);
  let timer: ReturnType<typeof setTimeout> | null = null;

  async function copy(key: string, text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      copiedKey.value = key;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        copiedKey.value = null;
      }, 1500);
      return true;
    } catch {
      return false;
    }
  }

  function isCopied(key: string) {
    return copiedKey.value === key;
  }

  return { copy, isCopied };
}
