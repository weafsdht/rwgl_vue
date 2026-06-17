/**
 * 好友接口：与 `request.ts` 一致，baseURL `/api`，自动带 `Authorization: Bearer <token>`。
 * 响应 `{ code, message, data }`，`code === 0` 时业务数据在 `data`（由 request 封装已解包）。
 */
import { request } from '@/utils/request';
import type { FriendRequestVO, FriendUserVO } from '@/types';

export default {
  /** POST /api/friends/requests/by-email */
  requestByEmail: (email: string) =>
    request.post<FriendRequestVO>('/friends/requests/by-email', { email }),

  /** GET /api/friends/requests/incoming */
  getIncoming: () => request.get<FriendRequestVO[]>('/friends/requests/incoming'),

  /** GET /api/friends/requests/outgoing */
  getOutgoing: () => request.get<FriendRequestVO[]>('/friends/requests/outgoing'),

  /** POST /api/friends/requests/{id}/accept */
  accept: (id: number) => request.post<FriendRequestVO>(`/friends/requests/${id}/accept`),

  /** POST /api/friends/requests/{id}/reject */
  reject: (id: number) => request.post<null>(`/friends/requests/${id}/reject`),

  /** POST /api/friends/requests/{id}/cancel（仅发起人） */
  cancel: (id: number) => request.post<null>(`/friends/requests/${id}/cancel`),

  /** GET /api/friends — FriendUserVO[]，含 remark / friendRemark（同值） */
  getFriends: () => request.get<FriendUserVO[]>('/friends'),

  /**
   * PATCH /api/friends/{friendUserId}/remark
   * Body: `{ remark: string }`；传 `null` 或空字符串表示清空（与后端约定一致）。
   */
  updateFriendRemark: (friendUserId: number, remark: string | null) =>
    request.patch<FriendUserVO>(
      `/friends/${friendUserId}/remark`,
      { remark: remark === '' || remark === null ? null : remark },
      { skipGlobalError: true }
    ),
};

/**
 * 防抖执行（备注「边改边存」）。回调内请自行读取最新输入框值，避免定时触发时拿到过期字符串。
 * @param fn 无参回调，通常内部读取当前 remark 草稿再调 `updateFriendRemark`
 * @param delayMs 默认 600ms 量级
 */
export function createDebouncedRemarkSave(
  fn: () => void | Promise<void>,
  delayMs: number
): { schedule: () => void; cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return {
    schedule() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        void fn();
      }, delayMs);
    },
    cancel() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    },
  };
}
