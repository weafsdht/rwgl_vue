import type { AdminUserVO, User } from '@/types';

/**
 * 从单层对象读取头像字段（驼峰 / 蛇形）。
 */
export function pickAvatarFromPayload(o: Record<string, unknown>): string | undefined {
  const av =
    (typeof o.avatar === 'string' && o.avatar.trim()) ||
    (typeof o.avatarUrl === 'string' && o.avatarUrl.trim()) ||
    (typeof o.avatar_url === 'string' && o.avatar_url.trim()) ||
    '';
  return av || undefined;
}

/**
 * 从任务/接口嵌套对象解析 User（兼容 avatar_url、avatarUrl、嵌套 user / user_info）。
 */
export function normalizeUserFromPayload(raw: unknown): User | undefined {
  if (raw == null || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  const id = Number(o.id);
  if (!Number.isFinite(id)) return undefined;

  let avatar = pickAvatarFromPayload(o);
  if (!avatar) {
    const nested = o.user ?? o.user_info ?? o.userInfo;
    if (nested != null && typeof nested === 'object') {
      avatar = pickAvatarFromPayload(nested as Record<string, unknown>);
    }
  }

  return {
    id,
    username: String(o.username ?? ''),
    email: String(o.email ?? ''),
    nickname: o.nickname != null ? String(o.nickname) : undefined,
    avatar: avatar || undefined,
    createdAt: String(o.createdAt ?? o.created_at ?? ''),
  };
}

/**
 * 将 GET /auth/me、登录等返回的 User 与 normalize 结果合并，保证 avatar 落到驼峰字段。
 */
export function mergeApiUser(raw: User | null | undefined): User | null {
  if (raw == null) return null;
  const n = normalizeUserFromPayload(raw);
  if (!n) return raw;
  return { ...(raw as object), ...n } as User;
}

/**
 * GET /api/admin/users 列表项：合并 avatar / avatarUrl / avatar_url → avatar。
 */
export function normalizeAdminUserVo(u: AdminUserVO): AdminUserVO {
  const n = normalizeUserFromPayload(u);
  return { ...u, avatar: n?.avatar ?? u.avatar };
}
