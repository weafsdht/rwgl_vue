import { request } from '@/utils/request';
import type { Team, TeamMember } from '@/types';

const BASE = '/teams';

export default {
  /** 我加入的团队列表（被邀请用户可见；无团队则不显示团队入口） */
  getMyTeams: () => request.get<Team[]>(BASE),

  /** 创建团队（仅项目经理） */
  createTeam: (data: { name: string; description?: string }) =>
    request.post<Team>(BASE, data),

  /** 团队详情 */
  getTeam: (id: number) => request.get<Team>(`${BASE}/${id}`),

  /** 团队成员列表 */
  getTeamMembers: (teamId: number) =>
    request.get<TeamMember[]>(`${BASE}/${teamId}/members`),

  /**
   * 邀请用户加入团队（邮箱）
   * 优先 POST /teams/{id}/members/by-email，失败时回退到 /members（兼容旧后端）
   */
  inviteMember: async (teamId: number, email: string) => {
    try {
      return await request.post<TeamMember>(`${BASE}/${teamId}/members/by-email`, { email });
    } catch {
      return request.post<TeamMember>(`${BASE}/${teamId}/members`, { email });
    }
  },

  /** 移除团队成员 */
  removeMember: (teamId: number, memberId: number) =>
    request.delete<void>(`${BASE}/${teamId}/members/${memberId}`),

  /** 更新团队信息 */
  updateTeam: (id: number, data: { name?: string; description?: string }) =>
    request.patch<Team>(`${BASE}/${id}`, data),

  /** 解散/删除团队 */
  deleteTeam: (id: number) => request.delete<void>(`${BASE}/${id}`),
};
