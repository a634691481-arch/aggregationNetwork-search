/**
 * 桌面端检测 composable
 * --------------------------------------------------------------
 * - 基于 matchMedia('(min-width: 1024px)') 判断是否为桌面宽度
 * - SSR 安全：默认值 false（避免移动端 hydration mismatch）
 * - 客户端挂载后实时响应窗口宽度变化
 *
 * 使用方式：
 *   const { isDesktop } = useDesktopOnly()
 *   <ClientOnly v-if="isDesktop"> ... </ClientOnly>
 *
 * 也可在 default.vue 等全局布局里用 v-if 控制桌面专属组件
 */
export function useDesktopOnly(breakpoint = 1024) {
  const isDesktop = ref(false)

  onMounted(() => {
    const mql = window.matchMedia(`(min-width: ${breakpoint}px)`)
    isDesktop.value = mql.matches

    // 现代浏览器用 addEventListener；旧浏览器走 onchange
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      isDesktop.value = e.matches
    }

    if (mql.addEventListener) {
      mql.addEventListener('change', handler as (e: MediaQueryListEvent) => void)
    } else {
      // 兼容旧 Safari
      mql.onchange = handler as (e: MediaQueryListEvent) => void
    }

    onBeforeUnmount(() => {
      if (mql.removeEventListener) {
        mql.removeEventListener('change', handler as (e: MediaQueryListEvent) => void)
      } else {
        mql.onchange = null
      }
    })
  })

  return { isDesktop }
}