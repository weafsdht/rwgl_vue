import { ref } from 'vue';
import teamApi from '@/api/team';
import { useUserStore } from '@/stores/user';
import { normalizeUserFromPayload } from '@/utils/task';
import type { Project, Task, User } from '@/types';
import type { TeamMember } from '@/types';

/** 模块级共享：看板/项目卡片/TaskCard 等处解析负责人 id → 用户信息 */
const assigneeUserMap = ref<Map<number, User>>(new Map());

/** 团队成员转 User，兼容 avatar_url、嵌套 user、接口未放在 m.avatar 上的头像 */
export function teamMemberToUser(m: TeamMember): User {
  const raw = m as TeamMember & Record<string, unknown>;
  const nested = normalizeUserFromPayload(raw.user);
  const avatar =
    (typeof m.avatar === 'string' && m.avatar.trim()) ||
    (typeof raw.avatar_url === 'string' && String(raw.avatar_url).trim()) ||
    (typeof raw.avatarUrl === 'string' && String(raw.avatarUrl).trim()) ||
    nested?.avatar;
  return {
    id: m.userId,
    username: (m as TeamMember & { username?: string }).username ?? nested?.username ?? m.nickname ?? m.email,
    nickname: m.nickname ?? nested?.nickname,
    email: m.email,
    avatar: avatar || nested?.avatar,
    createdAt: nested?.createdAt ?? '',
  };
}

/**
 * 合并任务/项目上嵌套的负责人信息与团队成员映射，优先使用带头像的字段（列表接口常在 assignees 里带头像）
 */
export function resolveTaskAssigneeUser(
  entity: Task | Project,
  userId: number,
  map: Map<number, User>,
  currentUser: User | null
): User {
  const fromList = entity.assignees?.find((x) => x.id === userId);
  const fromSingle = entity.assignee?.id === userId ? entity.assignee : undefined;
  const fromMe = currentUser?.id === userId ? currentUser : undefined;
  const fromMap = map.get(userId);
  const base = fromList || fromSingle || fromMe || fromMap;
  if (!base) {
    return {
      id: userId,
      username: `用户 ${userId}`,
      nickname: `用户 ${userId}`,
      email: '',
      createdAt: '',
    };
  }
  return {
    ...base,
    avatar: base.avatar || fromList?.avatar || fromSingle?.avatar || fromMe?.avatar || fromMap?.avatar,
    nickname: base.nickname || fromList?.nickname || fromSingle?.nickname || fromMe?.nickname || fromMap?.nickname,
    username:
      base.username ||
      fromList?.username ||
      fromSingle?.username ||
      fromMe?.username ||
      fromMap?.username ||
      '',
    email:
      base.email || fromList?.email || fromSingle?.email || fromMe?.email || fromMap?.email || '',
  };
}

/**
 * 项目负责人展示：拉取团队成员构建 userId -> User 映射，用于在项目卡片/看板等处解析并显示负责人
 */
export function useProjectAssignees() {
  const userStore = useUserStore();

  async function ensureMap() {
    try {
      const teams = await teamApi.getMyTeams();
      const memberLists = await Promise.all((teams ?? []).map((t) => teamApi.getTeamMembers(t.id)));
      const map = new Map<number, User>();
      const u = userStore.user;
      if (u) map.set(u.id, u);
      for (const members of memberLists) {
        for (const m of members ?? []) {
          if (m.status === 'active' && !map.has(m.userId)) {
            map.set(m.userId, teamMemberToUser(m));
          }
        }
      }
      assigneeUserMap.value = map;
    } catch {
      assigneeUserMap.value = new Map();
    }
  }

  function displayProjectAssignees(project: Project | null | undefined): User[] {
    if (!project) return [];
    const ids = project.assigneeIds?.length
      ? project.assigneeIds
      : project.assigneeId != null
        ? [project.assigneeId]
        : [];
    if (project.assignees?.length) {
      return project.assignees.map((u) =>
        resolveTaskAssigneeUser(project, u.id, assigneeUserMap.value, userStore.user)
      );
    }
    if (ids.length === 0) return [];
    return ids.map((id) =>
      resolveTaskAssigneeUser(project, id, assigneeUserMap.value, userStore.user)
    );
  }

  return { assigneeUserMap, ensureMap, displayProjectAssignees };
}
