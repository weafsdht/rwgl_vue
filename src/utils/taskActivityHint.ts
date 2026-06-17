import type { Task } from '@/types';
import { getPriorityLabel, normalizeTaskStatus } from '@/utils/task';

const STATUS_LABEL: Record<Task['status'], string> = {
  todo: '待办',
  doing: '进行中',
  done: '已完成',
  stalled: '搁置',
};

export interface TaskActivitySnapshot {
  title: string;
  status: Task['status'];
  priorityLabel: string;
  assigneeKey: string;
  assigneeLabel: string;
  attachmentCount: number;
  commentCount: number;
}

function buildAssigneeKey(task: Task): string {
  if (task.assigneeIds?.length) {
    return [...new Set(task.assigneeIds)].sort((a, b) => a - b).join(',');
  }
  if (task.assigneeId != null) return String(task.assigneeId);
  return '';
}

/** 负责人展示：与仪表盘「指派」风格一致，简短 */
export function formatTaskAssigneeBrief(task: Task): string {
  if (task.assignees?.length) {
    return task.assignees
      .map((u) => u.nickname?.trim() || u.username?.trim() || u.email?.split('@')[0] || `用户${u.id}`)
      .join('、');
  }
  if (task.assignee) {
    const u = task.assignee;
    return u.nickname?.trim() || u.username?.trim() || u.email?.split('@')[0] || `用户${u.id}`;
  }
  if (task.assigneeIds?.length) return task.assigneeIds.map((id) => `用户${id}`).join('、');
  if (task.assigneeId != null) return `用户${task.assigneeId}`;
  return '未指定';
}

function getCommentCount(task: Task): number {
  if (Array.isArray(task.comments)) return task.comments.length;
  if (task.commentCount != null) return Number(task.commentCount);
  return 0;
}

function getAttachmentCount(task: Task): number {
  if (Array.isArray(task.attachments)) return task.attachments.length;
  if (task.attachmentCount != null) return Number(task.attachmentCount);
  return 0;
}

export function buildTaskActivitySnapshot(task: Task): TaskActivitySnapshot {
  return {
    title: (task.title ?? '').trim(),
    status: normalizeTaskStatus(task.status),
    priorityLabel: getPriorityLabel(task.priority),
    assigneeKey: buildAssigneeKey(task),
    assigneeLabel: formatTaskAssigneeBrief(task),
    attachmentCount: getAttachmentCount(task),
    commentCount: getCommentCount(task),
  };
}

/**
 * 对比两次快照：只写变更结果，不加「状态/优先级」等字段前缀
 */
export function diffActivitySnapshots(prev: TaskActivitySnapshot, cur: TaskActivitySnapshot): string | null {
  const parts: string[] = [];
  if (prev.status !== cur.status) {
    parts.push(`${STATUS_LABEL[prev.status]}→${STATUS_LABEL[cur.status]}`);
  }
  if (prev.priorityLabel !== cur.priorityLabel) {
    parts.push(`${prev.priorityLabel}→${cur.priorityLabel}`);
  }
  if (prev.assigneeKey !== cur.assigneeKey) {
    parts.push(`${prev.assigneeLabel}→${cur.assigneeLabel}`);
  }
  if (cur.attachmentCount > prev.attachmentCount) {
    const n = cur.attachmentCount - prev.attachmentCount;
    parts.push(`+${n} 附件`);
  }
  if (cur.commentCount > prev.commentCount) {
    const n = cur.commentCount - prev.commentCount;
    parts.push(`+${n} 评论`);
  }
  if (prev.title !== cur.title) {
    parts.push('标题已修改');
  }
  return parts.length ? parts.join('；') : null;
}

export function truncateActivityHint(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}
