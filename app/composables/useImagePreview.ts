/**
 * 图片预览全局状态
 * - openPreview(list, index?) 打开 Lightbox
 * - closePreview() 关闭
 * - next()/prev() 切换
 * 通过 useState 保证 SSR 安全且全局单例
 */
export function useImagePreview() {
  const state = useState('image-preview', () => ({
    open: false,
    images: [] as string[],
    index: 0,
  }));

  function openPreview(images: string[], index = 0) {
    const valid = (images || []).filter(Boolean);
    if (valid.length === 0) return;
    state.value = {
      open: true,
      images: valid,
      index: Math.min(Math.max(index, 0), valid.length - 1),
    };
  }

  function closePreview() {
    state.value = { ...state.value, open: false };
  }

  function next() {
    if (!state.value.open || state.value.images.length <= 1) return;
    state.value.index =
      (state.value.index + 1) % state.value.images.length;
  }

  function prev() {
    if (!state.value.open || state.value.images.length <= 1) return;
    state.value.index =
      (state.value.index - 1 + state.value.images.length) %
      state.value.images.length;
  }

  function goTo(i: number) {
    if (!state.value.open) return;
    if (i < 0 || i >= state.value.images.length) return;
    state.value.index = i;
  }

  return { state, openPreview, closePreview, next, prev, goTo };
}
