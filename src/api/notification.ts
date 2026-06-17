import { request } from '@/utils/request';
import type { Notification, NotificationPreferences } from '@/types';

const BASE = '/notifications';

function parseNotification(raw: unknown): Notification {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const actorRaw =
    o.actorUserId ??
    o.actor_id ??
    o.fromUserId ??
    o.from_user_id ??
    o.senderId ??
    o.sender_id ??
    o.triggerUserId ??
    o.trigger_user_id;
  const actorNum = actorRaw != null && actorRaw !== '' ? Number(actorRaw) : NaN;
  const actorUserId = Number.isFinite(actorNum) ? actorNum : undefined;
  const typeStr = String(o.type ?? 'system');
  const type: Notification['type'] =
    typeStr === 'deadline' ||
    typeStr === 'assign' ||
    typeStr === 'comment' ||
    typeStr === 'system' ||
    typeStr === 'friend_request'
      ? typeStr
      : typeStr === '8' || Number(typeStr) === 8
        ? 'friend_request'
        : 'system';
  const relatedRaw = o.relatedType ?? o.related_type;
  const relatedIdRaw = o.relatedId ?? o.related_id;
  return {
    id: Number(o.id),
    type,
    title: String(o.title ?? ''),
    content: String(o.content ?? ''),
    taskId:
      o.taskId != null
        ? Number(o.taskId)
        : o.task_id != null
          ? Number(o.task_id)
          : undefined,
    read: Boolean(o.read),
    createdAt: String(o.createdAt ?? o.created_at ?? ''),
    updatedAt:
      o.updatedAt != null || o.updated_at != null
        ? String(o.updatedAt ?? o.updated_at ?? '')
        : undefined,
    actorUserId,
    isSelfAction:
      o.isSelfAction === true ||
      o.is_self === true ||
      o.selfAction === true ||
      o.self_action === true,
    relatedType: relatedRaw != null && relatedRaw !== '' ? String(relatedRaw) : undefined,
    relatedId: (() => {
      if (relatedIdRaw == null || relatedIdRaw === '') return undefined;
      const n = Number(relatedIdRaw);
      return Number.isFinite(n) && n > 0 ? n : undefined;
    })(),
  };
}

export default {
  /**
   * 获取通知列表
   */
  getNotifications: async () => {
    const list = await request.get<unknown[]>(BASE);
    return (list ?? []).map(parseNotification);
  },

  /**
   * 标记通知为已读
   */
  markAsRead: (id: number) => {
    return request.patch<void>(`${BASE}/${id}/read`);
  },

  /**
   * 标记所有通知为已读（兼容 PATCH / POST）
   */
  markAllAsRead: async () => {
    try {
      return await request.patch<void>(`${BASE}/read-all`);
    } catch {
      return await request.post<void>(`${BASE}/read-all`);
    }
  },

  /**
   * 删除通知（仅已读后可删除，未读时后端返回 400）
   */
  delete: (id: number, config?: { skipGlobalError?: boolean }) => {
    return request.delete<void>(`${BASE}/${id}`, config);
  },

  /** 通知偏好（与后端 VO 对齐：channelInApp、channelEmail、frequencyMinutes 等） */
  getPreferences: (config?: { skipGlobalError?: boolean }) =>
    request.get<NotificationPreferences>(`${BASE}/preferences`, config),

  updatePreferences: (data: Partial<NotificationPreferences>, config?: { skipGlobalError?: boolean }) =>
    request.patch<NotificationPreferences>(`${BASE}/preferences`, data, config),
};
