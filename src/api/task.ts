import { request } from '@/utils/request';
import { statusToBackendNumber } from '@/utils/task';
import type { Task, BoardData } from '@/types';

const BASE = '/tasks';

/** 创建/更新时把 status 转为后端 0-3 数字（若为字符串） */
function toBackendTaskBody(data: Partial<Task>): Record<string, unknown> {
  const body = { ...data } as Record<string, unknown>;
  const s = body.status;
  if (s === 'todo' || s === 'doing' || s === 'done' || s === 'stalled') {
    body.status = statusToBackendNumber(s);
  }
  // 部分后端只接收 repeat_rule（蛇形），与 repeatRule 同步写入
  if (Object.prototype.hasOwnProperty.call(body, 'repeatRule')) {
    body.repeat_rule = body.repeatRule;
  }
  return body;
}

export default {
  /**
   * 获取任务列表
   * @param archived true 时只返回已归档任务（archivedAt 有值）
   */
  getTasks: (params?: {
    projectId?: number;
    status?: string;
    tagId?: number;
    archived?: boolean;
    startTimeFrom?: string;
    startTimeTo?: string;
    dueTimeFrom?: string;
    dueTimeTo?: string;
  }, config?: { skipGlobalError?: boolean }) => {
    return request.get<Task[]>(BASE, { params, ...config });
  },

  /**
   * 获取已归档任务列表（GET /api/tasks/archived）
   * @param config.skipGlobalError - 附件库等场景并行拉取失败时由页面静默处理，避免重复 Toast
   */
  getArchivedTasks: (config?: { skipGlobalError?: boolean }) => {
    return request.get<Task[]>(`${BASE}/archived`, config);
  },

  /**
   * 恢复归档（POST /api/tasks/{id}/restore）
   */
  restoreTask: (id: number) => {
    return request.post<Task>(`${BASE}/${id}/restore`);
  },

  /**
   * 归档任务
   * 优先调用 POST /api/tasks/{id}/archive；若 404 则回退到 PATCH 设置 archivedAt
   */
  archiveTask: async (id: number) => {
    try {
      return await request.post<Task>(`${BASE}/${id}/archive`);
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        return await request.patch<Task>(`${BASE}/${id}`, { archivedAt: new Date().toISOString() });
      }
      throw e;
    }
  },

  /**
   * 获取看板数据。请求返回 { code, data, message } 时，封装层已从 res.data.data 取 data
   */
  getBoard: () => {
    return request.get<BoardData>(`${BASE}/board`);
  },

  /**
   * 创建任务
   */
  createTask: (data: Partial<Task>) => {
    return request.post<Task>(BASE, toBackendTaskBody(data));
  },

  /**
   * 更新任务
   */
  updateTask: (id: number, data: Partial<Task>) => {
    return request.patch<Task>(`${BASE}/${id}`, toBackendTaskBody(data));
  },

  /**
   * 删除任务
   */
  deleteTask: (id: number) => {
    return request.delete<void>(`${BASE}/${id}`);
  },

  /**
   * 获取任务详情
   */
  getTask: (id: number) => {
    return request.get<Task>(`${BASE}/${id}`);
  },
};
