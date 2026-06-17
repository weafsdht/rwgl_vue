import { request } from '@/utils/request';
import type { MemberInvite } from '@/types';

const BASE = '/invites';

/**
 * 邀请好友/团队成员 API
 * 后端可提供：GET 成员列表、POST 发送邀请、DELETE 取消邀请、获取邀请链接等
 */
export default {
  /** 获取团队成员及待处理邀请列表 */
  getMembers: () =>
    request.get<MemberInvite[]>(BASE).catch(() => []),

  /** 邀请成员（邮箱），返回待处理邀请含 inviteLink */
  inviteMember: (email: string) =>
    request.post<MemberInvite>(BASE, { email }),

  /** 取消/删除邀请 */
  deleteInvite: (id: number) =>
    request.delete<void>(`${BASE}/${id}`),
};
