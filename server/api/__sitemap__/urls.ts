/**
 * 动态 sitemap URL 源
 * @nuxtjs/sitemap 会调用该接口收集要写入 sitemap.xml 的路由
 * 参考: https://nuxtseo.com/docs/sitemap/guides/dynamic-urls
 */
import type { SitemapUrlInput } from '#sitemap/types'

export default defineSitemapEventHandler((): SitemapUrlInput[] => {
  return [
    {
      loc: '/',
      changefreq: 'daily',
      priority: 1.0,
    },
  ]
})
