/**
 * 图片处理工具函数
 */

/**
 * 检查是否为需要代理的图片URL
 * @param url 图片URL
 * @returns 是否需要代理
 */
export function needsImageProxy(url: string): boolean {
  if (!url) return false
  
  const needsProxyDomains = [
    'sns-webpic-qc.xhscdn.com',
    'sns-img-qc.xhscdn.com', 
    'sns-avatar-qc.xhscdn.com',
    'ci.xiaohongshu.com',
  ]
  
  try {
    const urlObj = new URL(url)
    return needsProxyDomains.includes(urlObj.hostname)
  } catch {
    return false
  }
}

/**
 * 生成图片代理URL
 * @param originalUrl 原始图片URL
 * @returns 代理URL
 */
export function getProxyImageUrl(originalUrl: string): string {
  if (!originalUrl) return ''
  
  // 如果不需要代理，直接返回原URL
  if (!needsImageProxy(originalUrl)) {
    return originalUrl
  }
  
  // 生成代理URL
  const encodedUrl = encodeURIComponent(originalUrl)
  return `/api/image-proxy?url=${encodedUrl}`
}

/**
 * 智能图片URL处理
 * 优先使用原始URL，失败时自动降级到代理URL
 * @param originalUrl 原始图片URL
 * @returns 处理后的图片URL配置
 */
export function getSmartImageUrls(originalUrl: string) {
  if (!originalUrl) {
    return {
      primary: '',
      fallback: '',
      needsProxy: false
    }
  }
  
  const needsProxy = needsImageProxy(originalUrl)
  
  return {
    primary: originalUrl, // 优先尝试原始URL
    fallback: needsProxy ? getProxyImageUrl(originalUrl) : '', // 失败时使用代理
    needsProxy
  }
}

/**
 * 获取图片的最优URL
 * 在服务器端可以直接返回代理URL
 * @param originalUrl 原始URL
 * @param forceProxy 是否强制使用代理
 * @returns 最优的图片URL
 */
export function getOptimizedImageUrl(originalUrl: string, forceProxy: boolean = false): string {
  if (!originalUrl) return ''
  
  // 检查是否在服务器端或强制使用代理
  const isServer = typeof window === 'undefined'
  const shouldUseProxy = forceProxy || (isServer && needsImageProxy(originalUrl))
  
  if (shouldUseProxy) {
    return getProxyImageUrl(originalUrl)
  }
  
  return originalUrl
}
