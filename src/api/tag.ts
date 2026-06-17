import { request } from '@/utils/request';
import type { Tag } from '@/types';

export default {
  /** @param config.skipGlobalError - 列表页首屏拉取失败时可静默，由调用方 .catch 处理 */
  getList: (config?: { skipGlobalError?: boolean }) => request.get<Tag[]>('/tags', config),

  create: (data: { name: string; color?: string }) =>
    request.post<Tag>('/tags', data),

  update: (id: number, data: { name?: string; color?: string }) =>
    request.patch<Tag>(`/tags/${id}`, data),

  remove: (id: number) => request.delete(`/tags/${id}`),
};
