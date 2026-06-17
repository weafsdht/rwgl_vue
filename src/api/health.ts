import { request } from '@/utils/request';

/**
 * 健康检查：GET /api/health（公开，无需登录；联调时可先调此接口确认 baseURL 与网关）
 * 成功时返回 data（具体字段以后端为准）
 */
export function getHealth() {
  return request.get<unknown>('/health', { skipGlobalError: true });
}
