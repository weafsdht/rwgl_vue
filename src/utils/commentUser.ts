import type { Comment, User } from '@/types';
import { normalizeUserFromPayload } from '@/utils/task';

type RawComment = Comment & Record<string, unknown>;

function pickStr(...vals: unknown[]): string | undefined {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return undefined;
}

function resolveCommentUser(raw: RawComment): User | undefined {
  const nested =
    normalizeUserFromPayload(raw.user) ??
    normalizeUserFromPayload(raw.user_info) ??
    normalizeUserFromPayload(raw.userInfo);

  const uid = Number(raw.userId ?? raw.user_id ?? nested?.id ?? 0);

  const flatNick = pickStr(raw.nickname, raw.user_nickname, raw.userNickname);
  const flatName = pickStr(raw.username, raw.user_name, raw.userName);
  const flatEmail = pickStr(raw.email, raw.user_email, raw.userEmail);
  const flatAvatar = pickStr(
    raw.avatar,
    raw.user_avatar,
    raw.avatar_url,
    raw.avatarUrl,
    raw.userAvatar
  );

  const nestedHasProfile =
    nested &&
    ((nested.nickname && nested.nickname.trim()) ||
      (nested.username && nested.username.trim()) ||
      (nested.email && nested.email.trim()) ||
      (nested.avatar && nested.avatar.trim()));

  if (nested && (nestedHasProfile || flatNick || flatName || flatEmail || flatAvatar)) {
    const id = uid > 0 ? uid : nested.id;
    const username =
      (nested.username && nested.username.trim()) ||
      flatName ||
      (nested.email && nested.email.includes('@') ? nested.email.split('@')[0]! : nested.email) ||
      '';
    return {
      ...nested,
      id,
      username,
      nickname: nested.nickname?.trim() ? nested.nickname : flatNick ?? nested.nickname,
      email: nested.email || flatEmail || '',
      avatar: nested.avatar || flatAvatar || undefined,
    };
  }

  if (uid > 0 && (flatNick || flatName || flatEmail || flatAvatar)) {
    const email = flatEmail || '';
    const localFromEmail = email.includes('@') ? email.split('@')[0]! : email;
    return {
      id: uid,
      username: flatName || flatNick || localFromEmail || `user${uid}`,
      email,
      nickname: flatNick || undefined,
      avatar: flatAvatar || undefined,
      createdAt: String(raw.createdAt ?? raw.created_at ?? ''),
    };
  }

  return nested;
}

/** 将接口返回的评论（含蛇形字段、扁平 nickname/avatar）规范为带 user 的 Comment */
export function normalizeComment(raw: unknown): Comment {
  const o = (raw && typeof raw === 'object' ? raw : {}) as RawComment;
  const user = resolveCommentUser(o);
  const userId = Number(o.userId ?? o.user_id ?? user?.id ?? 0);
  return {
    id: Number(o.id),
    taskId: Number(o.taskId ?? o.task_id ?? 0),
    userId: Number.isFinite(userId) ? userId : 0,
    user,
    content: String(o.content ?? ''),
    createdAt: String(o.createdAt ?? o.created_at ?? ''),
    updatedAt:
      o.updatedAt != null
        ? String(o.updatedAt)
        : o.updated_at != null
          ? String(o.updated_at)
          : undefined,
  };
}
