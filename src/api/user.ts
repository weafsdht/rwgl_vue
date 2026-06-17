/**
 * 用户接口：axios `baseURL` 一般为 `/api`，故：
 * - `/auth/me` → GET/PATCH `/api/auth/me`
 * - `/users/me` → GET/PATCH `/api/users/me`
 */
import { request } from '@/utils/request';
import type { User } from '@/types';

const BASE = '/auth';

export type LoginBody =
  | { password: string; email: string; username?: never }
  | { password: string; username: string; email?: never };

export default {
  /**
   * 登录（JSON）：password 必填；账号二选一 email 或 username（与后端 LoginRequest 一致）
   */
  login: (body: LoginBody) => {
    return request.post<{ token: string; user: User }>(`${BASE}/login`, body);
  },

  /**
   * 注册：email、password 必填；nickname 可选（与后端注册 DTO 一致）
   */
  register: (data: { email: string; password: string; nickname?: string }) => {
    return request.post<{ token: string; user: User }>(`${BASE}/register`, data);
  },

  /**
   * 获取当前用户信息（GET `/api/auth/me`，axios 路径为 `/auth/me`）
   * 若后端仅提供 GET `/api/users/me`，可将此处改为 `request.get('/users/me', config)`
   * @param config.skipGlobalError - 首屏加载时可传 true，失败时由调用方静默处理
   */
  getCurrentUser: (config?: { skipGlobalError?: boolean }) => {
    return request.get<User>(`${BASE}/me`, config);
  },

  /**
   * 更新用户信息（登录/基础信息，部分后端为 PATCH /auth/me）
   */
  updateUser: (data: Partial<User>) => {
    return request.patch<User>(`${BASE}/me`, data);
  },

  /**
   * 更新个人资料
   * 实际接口：PATCH `/api/users/me` 或 PATCH `/api/auth/me`（与 baseURL 拼接后为上述完整路径）
   * 清空个性签名：请求体传 `"signature": ""`
   */
  updateProfile: (data: {
    username?: string;
    nickname?: string;
    /** 与后端 ProfileUpdateRequest 一致；亦兼容别名 emailAddress */
    email?: string;
    emailAddress?: string;
    avatar?: string;
    phone?: string;
    gender?: string;
    timezone?: string;
    /** 个性签名；传空字符串 `""` 表示清空 */
    signature?: string;
  }) => {
    return request
      .patch<User>('/users/me', data, { skipGlobalError: true })
      .catch(() => request.patch<User>(`${BASE}/me`, data));
  },

  /**
   * 上传头像（POST /api/users/me/avatar）
   * FormData 字段名必须为 file，支持 JPG/PNG/GIF/WebP，单文件 ≤ 2MB；返回最新用户信息。
   */
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request.post<User>('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /**
   * 修改当前用户密码（PATCH /api/users/me/password）
   * Body: { oldPassword, newPassword }，新密码至少 6 位；原密码错误返回 400「原密码错误」。
   * 成功返回最新用户信息（与 GET /api/users/me 结构一致）。
   */
  changePassword: (oldPassword: string, newPassword: string) => {
    return request.patch<User>('/users/me/password', { oldPassword, newPassword });
  },

  /**
   * 按 id 获取用户公开资料（评论/负责人展示补全）。
   * 需后端提供 **GET /api/users/{id}**（或兼容 **GET /api/auth/users/{id}**）。
   * 均失败时返回 `null`，不弹全局错误提示。
   */
  getUserById: async (id: number): Promise<User | null> => {
    if (!id) return null;
    const opts = { skipGlobalError: true } as const;
    try {
      return await request.get<User>(`/users/${id}`, opts);
    } catch {
      try {
        return await request.get<User>(`/auth/users/${id}`, opts);
      } catch {
        return null;
      }
    }
  },
};
