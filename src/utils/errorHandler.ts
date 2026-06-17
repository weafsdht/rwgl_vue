/**
 * 错误处理工具函数
 */

/**
 * 格式化错误消息
 */
export function formatErrorMessage(error: any): string {
  // 如果错误对象有 message 属性
  if (error?.message) {
    return error.message;
  }
  
  // 如果是字符串
  if (typeof error === 'string') {
    return error;
  }
  
  // 如果是响应错误
  if (error?.response) {
    const data = error.response.data;
    if (data?.message) {
      return data.message;
    }
    return `请求失败 (${error.response.status})`;
  }
  
  return '未知错误';
}

/**
 * 判断是否为网络错误
 */
export function isNetworkError(error: any): boolean {
  return !error.response && error.request;
}

/**
 * 判断是否为服务器错误（5xx）
 */
export function isServerError(error: any): boolean {
  const status = error?.response?.status;
  return status >= 500 && status < 600;
}

/**
 * 判断是否为客户端错误（4xx）
 */
export function isClientError(error: any): boolean {
  const status = error?.response?.status;
  return status >= 400 && status < 500;
}
