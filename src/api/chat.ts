/**
 * 私聊 REST：与 request 一致，baseURL `/api`，Bearer 鉴权。
 */
import { request } from '@/utils/request';
import type { ChatConversationVO, ChatMessageVO } from '@/types';

export default {
  /** POST /api/chat/conversations/open */
  open: (body: { peerUserId?: number; peerEmail?: string }) =>
    request.post<ChatConversationVO>('/chat/conversations/open', body),

  /** GET /api/chat/conversations */
  list: () => request.get<ChatConversationVO[]>('/chat/conversations'),

  /** GET /api/chat/conversations/{id}/messages */
  messages: (conversationId: number, params?: { beforeMessageId?: number; limit?: number }) =>
    request.get<ChatMessageVO[]>(`/chat/conversations/${conversationId}/messages`, { params }),

  /** POST 文本 */
  sendText: (conversationId: number, content: string) =>
    request.post<ChatMessageVO>(`/chat/conversations/${conversationId}/messages`, { content }),

  /** POST 已读 */
  markRead: (conversationId: number, body?: { lastReadMessageId?: number }) =>
    request.post<unknown>(`/chat/conversations/${conversationId}/read`, body ?? {}),

  /** POST multipart，字段 file；可选 forceAsImage */
  upload: (conversationId: number, file: File, forceAsImage?: boolean) => {
    const fd = new FormData();
    fd.append('file', file);
    return request.post<ChatMessageVO>(`/chat/conversations/${conversationId}/attachments`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: forceAsImage ? { forceAsImage: 'true' } : undefined,
      skipGlobalError: true,
    });
  },
};
