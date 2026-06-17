import { shallowRef } from 'vue';
import userApi from '@/api/user';
import type { User } from '@/types';
import { normalizeUserFromPayload } from '@/utils/task';

/** 模块级缓存：跨组件共享，避免同一用户重复请求 */
const cacheRef = shallowRef(new Map<number, User>());
const inflight = new Map<number, Promise<void>>();

function setCached(id: number, u: User) {
  const m = new Map(cacheRef.value);
  m.set(id, u);
  cacheRef.value = m;
}

/**
 * 用户资料缓存：在评论等场景下按 userId 补全昵称/头像（依赖后端 GET /users/{id}，无则静默跳过）。
 */
export function useUserProfileCache() {
  function getCached(id: number): User | undefined {
    return id ? cacheRef.value.get(id) : undefined;
  }

  /** 将已知的 User 写入缓存（团队列表、任务 assignees 等） */
  function seedUsers(users: (User | null | undefined)[]) {
    let changed = false;
    const m = new Map(cacheRef.value);
    for (const raw of users) {
      const u = raw && (normalizeUserFromPayload(raw) ?? raw);
      if (u?.id) {
        m.set(u.id, u);
        changed = true;
      }
    }
    if (changed) cacheRef.value = m;
  }

  async function ensureUser(id: number): Promise<void> {
    if (!id || cacheRef.value.has(id)) return;
    const pending = inflight.get(id);
    if (pending) return pending;

    const p = (async () => {
      const raw = await userApi.getUserById(id);
      if (raw) {
        const u = normalizeUserFromPayload(raw) ?? raw;
        if (u.id) setCached(u.id, u);
      }
    })()
      .catch(() => {})
      .finally(() => inflight.delete(id));

    inflight.set(id, p);
    return p;
  }

  async function ensureUsers(ids: number[]): Promise<void> {
    const uniq = [...new Set(ids.filter((x) => x > 0))];
    await Promise.all(uniq.map((id) => ensureUser(id)));
  }

  return { getCached, seedUsers, ensureUser, ensureUsers };
}
