import { request } from '@/utils/request';
import type { AdminUserVO } from '@/types';

const BASE = '/admin/users';

export default {
  /**
   * 获取用户列表（仅系统管理员）
   * GET /api/admin/users — 响应项含 avatar，并可带 avatarUrl / avatar_url（见 AdminUserVO）
   */
  getUsers: () => request.get<AdminUserVO[]>(BASE),

  /**
   * 修改用户角色
   * PATCH /api/admin/users/{id}/role
   * @param id 用户主键（AdminUserVO.id）
   * @param role 0=系统管理员，1=项目经理，2=普通用户
   */
  updateRole: (id: number, role: number) =>
    request.patch<AdminUserVO>(`${BASE}/${id}/role`, { role }),

  /**
   * 删除用户（仅系统管理员）
   * DELETE /api/admin/users/{id}
   */
  deleteUser: (id: number) => request.delete<void>(`${BASE}/${id}`),

  /**
   * 修改用户密码（管理员重置指定用户密码）
   * PATCH /api/admin/users/{id}/password
   * @param id 用户主键
   * @param password 新密码
   */
  updatePassword: (id: number, password: string) =>
    request.patch<void>(`${BASE}/${id}/password`, { password }),
};
