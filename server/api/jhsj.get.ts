/**
 * 聚合网盘资源搜索代理接口
 * 转发到 https://wzapi.com/api/jhsj，规避浏览器跨域限制
 */
export default defineEventHandler(async (event): Promise<any> => {
  const query = getQuery<{ kw?: string; cloud_types?: string }>(event)

  const kw = (query.kw ?? '').toString().trim()
  if (!kw) {
    throw createError({ statusCode: 400, statusMessage: '关键词 kw 不能为空' })
  }

  const params: Record<string, string> = { kw }
  if (query.cloud_types) {
    params.cloud_types = String(query.cloud_types)
  }

  try {
    const data: any = await $fetch('https://wzapi.com/api/jhsj', {
      method: 'GET',
      params,
      timeout: 15000,
    })
    return data
  } catch (err: any) {
    throw createError({
      statusCode: 502,
      statusMessage: `上游接口请求失败: ${err?.message ?? 'unknown error'}`,
    })
  }
})
