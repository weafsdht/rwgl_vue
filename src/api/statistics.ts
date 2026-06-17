import { request } from '@/utils/request';
import type { Statistics } from '@/types';

/** 完成率等统计 query 参数 */
export interface StatisticsQuery {
  scope?: string;
  projectId?: number;
  timeDimension?: string;
  startDate?: string;
  endDate?: string;
  allMembers?: boolean;
}

export default {
  /**
   * 获取统计数据（非关键请求，失败时由调用方静默处理）
   * 用法：getStatistics() | getStatistics({ teamId }) | getStatistics(config) | getStatistics(params, config)
   */
  getStatistics: (
    paramsOrConfig?: { teamId?: number; skipGlobalError?: boolean },
    config?: { skipGlobalError?: boolean }
  ) => {
    const params = config != null ? paramsOrConfig : undefined;
    const cfg = config != null ? config : (paramsOrConfig as { skipGlobalError?: boolean } | undefined);
    return request.get<Statistics>('/statistics', { params, ...cfg });
  },

  getCompletionRate: (params?: StatisticsQuery) =>
    request.get('/statistics/completion-rate', { params }),

  getAverageCompletionTime: (params?: StatisticsQuery) =>
    request.get('/statistics/average-completion-time', { params }),

  getOverdueRate: (params?: StatisticsQuery) =>
    request.get('/statistics/overdue-rate', { params }),

  getWorkSaturation: (params?: { startDate?: string; endDate?: string; allMembers?: boolean }) =>
    request.get('/statistics/work-saturation', { params }),

  getDashboard: () => request.get('/statistics/dashboard'),
};
