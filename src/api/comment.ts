import { request } from '@/utils/request';
import { normalizeComment } from '@/utils/commentUser';
import type { Comment } from '@/types';

const BASE = '/tasks';

export default {
  /**
   * 获取任务评论列表
   */
  getComments: async (taskId: number) => {
    const list = await request.get<Comment[]>(`${BASE}/${taskId}/comments`);
    return (list ?? []).map((c) => normalizeComment(c));
  },

  /**
   * 创建评论
   */
  createComment: async (taskId: number, content: string) => {
    const c = await request.post<Comment>(`${BASE}/${taskId}/comments`, { content });
    return normalizeComment(c);
  },

  /**
   * 更新评论
   */
  updateComment: async (taskId: number, commentId: number, content: string) => {
    const c = await request.patch<Comment>(`${BASE}/${taskId}/comments/${commentId}`, { content });
    return normalizeComment(c);
  },

  /**
   * 删除评论（DELETE /api/comments/{id}）
   */
  deleteCommentById: (commentId: number) => {
    return request.delete<void>(`/comments/${commentId}`);
  },

  /**
   * 删除评论（按任务+评论 id，若后端仅支持 DELETE /comments/{id} 则用 deleteCommentById）
   */
  deleteComment: (taskId: number, commentId: number) => {
    return request.delete<void>(`${BASE}/${taskId}/comments/${commentId}`);
  },
};
