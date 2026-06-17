import type { Task, User } from '@/types';
import { normalizeUserFromPayload } from '@/utils/user';

export { normalizeUserFromPayload, mergeApiUser } from '@/utils/user';

const STATUS_MAP: Record<string, Task['status']> = {
  todo: 'todo',
  doing: 'doing',
  done: 'done',
  stalled: 'stalled',
  '0': 'todo',
  '1': 'doing',
  '2': 'done',
  '3': 'stalled',
  '4': 'stalled',
  '待办': 'todo',
  '进行中': 'doing',
  '已完成': 'done',
  '完成': 'done',
  '搁置': 'stalled',
};

/**
 * 看板分组/展示前必用：将接口返回的 task.status 规范为 'todo'|'doing'|'done'|'stalled'，再按 0/1/2/3 分列
 */
export function normalizeTaskStatus(s: unknown): Task['status'] {
  if (s === null || s === undefined) return 'todo';
  if (typeof s === 'number') {
    // 0-based（与常见后端一致）: 0=待办 1=进行中 2=完成 3=搁置；4 兼容 1-based 搁置
    if (s === 0) return 'todo';
    if (s === 1) return 'doing';
    if (s === 2) return 'done';
    if (s === 3) return 'stalled';
    if (s === 4) return 'stalled';
    return 'todo';
  }
  const key = String(s).toLowerCase();
  return STATUS_MAP[key] ?? 'todo';
}

/** 状态转为后端常用的数字 1-4（1=待办 2=进行中 3=完成 4=搁置） */
export function statusToNumber(status: Task['status']): number {
  const map: Record<Task['status'], number> = {
    todo: 1,
    doing: 2,
    done: 3,
    stalled: 4,
  };
  return map[status] ?? 1;
}

/** 拖拽保存：目标列状态 → 0–3，用于 PATCH /api/tasks/:id body: { status: statusToBackendNumber(目标状态) } */
export function statusToBackendNumber(status: Task['status']): number {
  const map: Record<Task['status'], number> = {
    todo: 0,
    doing: 1,
    done: 2,
    stalled: 3,
  };
  return map[status] ?? 0;
}

/** 优先级 1–4 对应四象限文案（与 CreateTaskModal 一致） */
const PRIORITY_LABELS: Record<number, string> = {
  1: '不重要也不紧急',
  2: '不重要但紧急',
  3: '重要不紧急',
  4: '重要且紧急',
};

export function getPriorityLabel(priority: Task['priority'] | undefined): string {
  if (priority == null) return PRIORITY_LABELS[1];
  const n = typeof priority === 'number' ? Math.min(5, Math.max(1, priority)) : (priority === 'high' ? 5 : priority === 'medium' ? 3 : 1);
  return PRIORITY_LABELS[Math.min(4, n)] ?? PRIORITY_LABELS[1];
}

/** 优先级 1–4 对应颜色（与 CreateTaskModal 芯片一致），用于列表/卡片文字高亮 */
const PRIORITY_COLORS: Record<number, string> = {
  1: '#94a3b8',
  2: '#eab308',
  3: '#3b82f6',
  4: '#ef4444',
};

export function getPriorityColor(priority: Task['priority'] | undefined): string {
  if (priority == null) return PRIORITY_COLORS[1];
  const n = typeof priority === 'number' ? Math.min(5, Math.max(1, priority)) : (priority === 'high' ? 5 : priority === 'medium' ? 3 : 1);
  return PRIORITY_COLORS[Math.min(4, n)] ?? PRIORITY_COLORS[1];
}

/** 优先级芯片背景色（与状态芯片一致：颜色 + 透明混合） */
export function getPriorityBg(priority: Task['priority'] | undefined): string {
  const c = getPriorityColor(priority);
  return `color-mix(in srgb, ${c} 22%, transparent)`;
}

/** 解析负责人列表（接口可能为 assignees / assignee_users） */
export function normalizeUsersArray(raw: unknown): User[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  const out: User[] = [];
  for (const item of raw) {
    const u = normalizeUserFromPayload(item);
    if (u) out.push(u);
  }
  return out.length ? out : undefined;
}
