import { request } from '@/utils/request';
import type { SearchResult } from '@/types';

export default {
  /**
   * 全局搜索
   */
  search: (keyword: string, options?: { type?: 'task' | 'project' | 'all'; limit?: number }) => {
    return request.get<SearchResult>('/search', {
      params: {
        q: keyword,
        ...options,
      },
    });
  },
};
