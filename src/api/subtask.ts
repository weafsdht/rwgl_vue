import { request } from '@/utils/request';
import type { SubTask } from '@/types';

const BASE = '/tasks';

export default {
  /**
   * 获取任务的子任务列表
   */
  getSubtasks: (taskId: number) => {
    return request.get<SubTask[]>(`${BASE}/${taskId}/subtasks`);
  },

  /**
   * 创建子任务
   */
  createSubtask: (taskId: number, data: Partial<SubTask>) => {
    return request.post<SubTask>(`${BASE}/${taskId}/subtasks`, data);
  },

  /**
   * 更新子任务
   */
  updateSubtask: (taskId: number, subtaskId: number, data: Partial<SubTask>) => {
    return request.patch<SubTask>(`${BASE}/${taskId}/subtasks/${subtaskId}`, data);
  },

  /**
   * 删除子任务
   */
  deleteSubtask: (taskId: number, subtaskId: number) => {
    return request.delete<void>(`${BASE}/${taskId}/subtasks/${subtaskId}`);
  },

  /**
   * 切换子任务完成状态
   */
  toggleSubtask: (taskId: number, subtaskId: number) => {
    return request.patch<SubTask>(`${BASE}/${taskId}/subtasks/${subtaskId}/toggle`);
  },
};
