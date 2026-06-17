import { request } from '@/utils/request';
import type { Task } from '@/types';

/**
 * AI 解析任务文本
 */
export const parseTaskAI = async (text: string) => {
  return request.post<Partial<Task>>('/ai/parse-task', { text });
};
