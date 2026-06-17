import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import taskApi from '@/api/task';
import { normalizeTaskStatus, statusToBackendNumber, normalizeUserFromPayload, normalizeUsersArray } from '@/utils/task';
import type { Task, BoardData, RepeatRule } from '@/types';

/** 空看板（四列皆空），用于初始化或请求失败时展示空列而不消失 */
export const EMPTY_BOARD: BoardData = {
  todo: [],
  doing: [],
  done: [],
  stalled: [],
};

/**
 * 从请求响应中取出看板数据。支持：axios 完整响应（res.data / res.data.data）、或已解包 payload
 */
export function unwrapBoardPayload(res: unknown): BoardData | Task[] | null {
  if (res == null) return null;
  let data = res as Record<string, unknown>;
  while (data && typeof data === 'object' && typeof data.data === 'object' && data.data !== null) {
    data = data.data as Record<string, unknown>;
  }
  if (Array.isArray(data)) return data as Task[];
  if (data && typeof data === 'object' && ('todo' in data || 'doing' in data || 'done' in data)) {
    return data as unknown as BoardData;
  }
  return data as unknown as BoardData | Task[] | null;
}

/** 附带合并后的任务，便于项目列表等未依赖看板内存的视图立即刷新，无需依赖 allTasks 查找时机 */
function emitTaskUpdated(taskId: number, snapshot?: Task) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('task-updated', { detail: { taskId, task: snapshot } }));
}

function emitTaskDeleted(taskId: number) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('task-deleted', { detail: { taskId } }));
}

/** 从接口原始字段解析重复规则（repeat_rule JSON 或对象） */
function coerceRepeatRule(raw: unknown): RepeatRule | undefined {
  if (raw == null || raw === '') return undefined;
  if (typeof raw === 'string') {
    try {
      const o = JSON.parse(raw) as unknown;
      return typeof o === 'object' && o !== null ? (o as RepeatRule) : undefined;
    } catch {
      return undefined;
    }
  }
  if (typeof raw === 'object') return raw as RepeatRule;
  return undefined;
}

export const useTaskStore = defineStore('task', () => {
  /** 看板进入时即初始化为空四列，避免 undefined；失败时也会置为 EMPTY_BOARD */
  const tasks = ref<BoardData>({ ...EMPTY_BOARD });

  const loading = ref(false);

  /**
   * 所有任务（扁平化）
   */
  const allTasks = computed(() => {
    return [
      ...tasks.value.todo,
      ...tasks.value.doing,
      ...tasks.value.done,
      ...(tasks.value.stalled ?? []),
    ];
  });

  /** 规范任务状态字段 */
  function normalizeTask(t: Task): Task {
    const raw = t as Task & Record<string, unknown>;
    const assignee =
      normalizeUserFromPayload(t.assignee) ??
      t.assignee ??
      normalizeUserFromPayload(raw.assignee) ??
      normalizeUserFromPayload(raw.assignee_user) ??
      normalizeUserFromPayload(raw.assigneeUser);
    const assigneesFromApi =
      normalizeUsersArray(t.assignees) ??
      normalizeUsersArray(raw.assignees) ??
      normalizeUsersArray(raw.assignee_users) ??
      normalizeUsersArray(raw.assigneeUsers);
    const creator =
      normalizeUserFromPayload(t.creator) ??
      normalizeUserFromPayload(raw.creator) ??
      normalizeUserFromPayload(raw.created_by_user) ??
      normalizeUserFromPayload(raw.createdBy);
    const createdById =
      t.createdById ??
      (raw.created_by != null ? Number(raw.created_by) : undefined) ??
      (raw.createdById != null ? Number(raw.createdById) : undefined) ??
      creator?.id;
    const assignedBy =
      normalizeUserFromPayload(t.assignedBy) ??
      normalizeUserFromPayload(raw.assigned_by) ??
      normalizeUserFromPayload(raw.assigner) ??
      normalizeUserFromPayload(raw.assignedBy);
    const assignedById =
      t.assignedById ??
      (raw.assigned_by_id != null ? Number(raw.assigned_by_id) : undefined) ??
      (raw.assigner_id != null ? Number(raw.assigner_id) : undefined) ??
      assignedBy?.id;
    const repeatRule =
      t.repeatRule ?? coerceRepeatRule(raw.repeat_rule) ?? coerceRepeatRule(raw.repeatRule);
    const commentCount =
      Array.isArray(t.comments)
        ? t.comments.length
        : t.commentCount != null
          ? Number(t.commentCount)
          : raw.comment_count != null
            ? Number(raw.comment_count)
            : undefined;
    const attachmentCount =
      Array.isArray(t.attachments)
        ? t.attachments.length
        : t.attachmentCount != null
          ? Number(t.attachmentCount)
          : raw.attachment_count != null
            ? Number(raw.attachment_count)
            : undefined;
    const activitySummary =
      typeof raw.activity_summary === 'string' && raw.activity_summary.trim()
        ? raw.activity_summary.trim()
        : typeof t.activitySummary === 'string' && t.activitySummary.trim()
          ? t.activitySummary.trim()
          : undefined;

    const normalized: Task = {
      ...t,
      status: normalizeTaskStatus(t.status),
      activitySummary,
      commentCount,
      attachmentCount,
      projectId: t.projectId ?? (raw.project_id != null ? Number(raw.project_id) : undefined),
      tagIds: t.tagIds ?? (Array.isArray(raw.tag_ids) ? raw.tag_ids.map((id: unknown) => Number(id)) : undefined),
      assigneeId: t.assigneeId ?? (raw.assignee_id != null ? Number(raw.assignee_id) : undefined),
      assigneeIds: t.assigneeIds ?? (Array.isArray(raw.assignee_ids) ? raw.assignee_ids.map((id: unknown) => Number(id)) : undefined),
      tags: t.tags ?? undefined,
      assignee,
      assignees: assigneesFromApi ?? t.assignees,
      creator: creator ?? t.creator,
      createdById: createdById ?? t.createdById,
      assignedBy: assignedBy ?? t.assignedBy,
      assignedById: assignedById ?? t.assignedById,
      repeatRule,
    };
    return normalized;
  }

  /**
   * 看板与任务列表共用同一数据源（GET /tasks），支持按项目筛选
   * @param params.projectId - 按项目筛选
   * @param params.getCurrentBoard - 可选；若传入，请求失败时不修改 tasks（完整保留当前看板）
   * @param params.onError - 可选，请求失败时回调（如提示「加载失败，请检查网络连接」）
   */
  async function fetchBoard(params?: {
    projectId?: number;
    getCurrentBoard?: () => BoardData;
    onError?: (err: unknown) => void;
  }) {
    loading.value = true;
    try {
      const raw = await taskApi.getTasks(
        { projectId: params?.projectId },
        { skipGlobalError: true }
      );
      const data = raw.map((t: Task) => normalizeTask(t));
      const sortByOrder = (a: Task, b: Task) =>
        (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id - b.id;
      const notArchived = (t: Task) => !t.archivedAt;
      const byStatus = (status: Task['status']) =>
        data.filter(t => t.status === status && notArchived(t)).sort(sortByOrder);
      tasks.value = {
        todo: byStatus('todo'),
        doing: byStatus('doing'),
        done: byStatus('done'),
        stalled: byStatus('stalled'),
      };
    } catch (e) {
      // 传入 getCurrentBoard 时：失败一律保留内存中已有看板数据，不写入 EMPTY_BOARD（避免刷新偶发失败导致「整板被清空」）
      if (params?.getCurrentBoard) {
        if (params.onError) params.onError(e);
        else console.warn('[fetchBoard]', e);
      } else {
        tasks.value = { ...EMPTY_BOARD };
        if (params?.onError) params.onError(e);
        else console.warn('[fetchBoard]', e);
      }
    } finally {
      loading.value = false;
    }
  }

  /**
   * 获取任务列表（支持日历/甘特时间范围：startTimeFrom/To、dueTimeFrom/To 格式 yyyy-MM-dd HH:mm:ss 或 yyyy-MM-dd）
   * @param options.skipGlobalError - 非关键场景（如 Dashboard 概览）可传 true，失败时静默
   */
  async function fetchTasks(
    params?: {
      projectId?: number;
      status?: string;
      startTimeFrom?: string;
      startTimeTo?: string;
      dueTimeFrom?: string;
      dueTimeTo?: string;
    },
    options?: { skipGlobalError?: boolean }
  ) {
    loading.value = true;
    try {
      const raw = await taskApi.getTasks(params, options);
      const data = raw.map((t: Task) => normalizeTask(t));
      const sortByOrder = (a: Task, b: Task) =>
        (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id - b.id;
      const notArchived = (t: Task) => !t.archivedAt;
      const byStatus = (status: Task['status']) =>
        data.filter(t => t.status === status && notArchived(t)).sort(sortByOrder);
      tasks.value = {
        todo: byStatus('todo'),
        doing: byStatus('doing'),
        done: byStatus('done'),
        stalled: byStatus('stalled'),
      };
    } finally {
      loading.value = false;
    }
  }

  /**
   * 按时间范围拉取任务（供日历/甘特用，不修改看板数据）
   * 参数格式 yyyy-MM-dd 或 yyyy-MM-dd HH:mm:ss
   */
  async function fetchTasksInRange(params: {
    startTimeFrom?: string;
    startTimeTo?: string;
    dueTimeFrom?: string;
    dueTimeTo?: string;
    projectId?: number;
  }) {
    const raw = await taskApi.getTasks(params, { skipGlobalError: true });
    return raw.map((t: Task) => normalizeTask(t));
  }

  /**
   * 创建任务（直接追加到对应列，不重新拉取看板，避免刷新）
   */
  async function createTask(data: Partial<Task>) {
    const newTask = await taskApi.createTask(data);
    const taskToAdd = normalizeTask(newTask);
    taskToAdd.status = normalizeTaskStatus(newTask.status ?? data.status) as Task['status'];
    if (Object.prototype.hasOwnProperty.call(data, 'repeatRule')) {
      taskToAdd.repeatRule = data.repeatRule ?? undefined;
    }
    const status = taskToAdd.status as keyof BoardData;
    const list = tasks.value[status] ?? [];
    tasks.value = {
      ...tasks.value,
      [status]: [...list, taskToAdd],
    };
    return taskToAdd;
  }

  /**
   * 更新任务（直接合并到本地列表，不刷新看板）
   */
  async function updateTask(taskId: number, payload: Partial<Task>) {
    let updatedTask: Task;
    try {
      updatedTask = await taskApi.updateTask(taskId, payload);
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message ?? '';
      const hasAssigneeInPayload = Object.prototype.hasOwnProperty.call(payload, 'assigneeId');
      const isInvalidAssignee =
        msg.includes('负责人不存在') ||
        msg.includes('负责人无效') ||
        msg.includes('请选择有效用户');
      if (!hasAssigneeInPayload || !isInvalidAssignee) throw e;
      // 负责人无效时，自动清空 assigneeId 后重试一次，避免保存被阻断
      updatedTask = await taskApi.updateTask(taskId, { ...payload, assigneeId: null } as unknown as Partial<Task>);
    }
    const taskMerged = normalizeTask(updatedTask);
    const p = payload as Record<string, unknown>;
    const clearedAssignees =
      (Object.prototype.hasOwnProperty.call(p, 'assigneeIds') &&
        Array.isArray(p.assigneeIds) &&
        (p.assigneeIds as unknown[]).length === 0) ||
      p.assigneeId === null;
    if (clearedAssignees) {
      taskMerged.assigneeIds = [];
      taskMerged.assigneeId = undefined;
      taskMerged.assignee = undefined;
      taskMerged.assignees = undefined;
    }
    // 编辑保存后以用户选择的状态为准，确保任务留在对应看板列（接口可能返回空或与表单不一致）
    taskMerged.status = (payload.status ? normalizeTaskStatus(payload.status) : normalizeTaskStatus(updatedTask.status)) as Task['status'];
    if (payload.hasOwnProperty('repeatRule')) {
      const rr = payload.repeatRule;
      taskMerged.repeatRule = rr === null || rr === undefined ? undefined : (rr as RepeatRule);
    }
    const newStatus = taskMerged.status as keyof BoardData;
    const keys: (keyof BoardData)[] = ['todo', 'doing', 'done', 'stalled'];
    let fromKey: keyof BoardData | null = null;
    let taskIndex = -1;
    for (const k of keys) {
      const list = tasks.value[k] ?? [];
      const idx = list.findIndex(t => t.id === taskId);
      if (idx >= 0) {
        fromKey = k;
        taskIndex = idx;
        break;
      }
    }
    if (fromKey === null) {
      const col = tasks.value[newStatus] ?? [];
      if (!col.some((t) => t.id === taskId)) {
        tasks.value = {
          ...tasks.value,
          [newStatus]: [...col, taskMerged],
        };
      } else {
        const next = col.map((t) => (t.id === taskId ? taskMerged : t));
        tasks.value = { ...tasks.value, [newStatus]: next };
      }
      emitTaskUpdated(taskId, taskMerged);
      return taskMerged;
    }
    if (fromKey === newStatus) {
      const next = [...(tasks.value[fromKey] ?? [])];
      next[taskIndex] = taskMerged;
      tasks.value = { ...tasks.value, [fromKey]: next };
    } else {
      const fromList = (tasks.value[fromKey] ?? []).filter((_, i) => i !== taskIndex);
      tasks.value = {
        ...tasks.value,
        [fromKey]: fromList,
        [newStatus]: [...(tasks.value[newStatus] ?? []), taskMerged],
      };
    }
    emitTaskUpdated(taskId, taskMerged);
    return taskMerged;
  }

  /**
   * 删除任务（直接从本地列表移除，不刷新看板）
   */
  async function deleteTask(taskId: number) {
    await taskApi.deleteTask(taskId);
    removeTaskFromBoard(taskId);
    emitTaskDeleted(taskId);
  }

  /** 从看板中移除任务（归档或删除后调用） */
  function removeTaskFromBoard(taskId: number) {
    const keys: (keyof BoardData)[] = ['todo', 'doing', 'done', 'stalled'];
    for (const k of keys) {
      const list = tasks.value[k] ?? [];
      if (list.some(t => t.id === taskId)) {
        tasks.value = {
          ...tasks.value,
          [k]: list.filter(t => t.id !== taskId),
        };
        break;
      }
    }
  }

  /**
   * 归档任务（PATCH 设置 archivedAt，并从看板移除）
   */
  async function archiveTask(taskId: number) {
    await taskApi.archiveTask(taskId);
    removeTaskFromBoard(taskId);
    emitTaskDeleted(taskId);
  }

  /**
   * 移动任务（拖拽）：先乐观更新本地，再 PATCH 持久化；失败则回滚
   */
  async function moveTask(taskId: number, newStatus: string, newIndex?: number) {
    const statusKey = newStatus as keyof BoardData;
    if (!tasks.value[statusKey]) return;

    let task: Task | undefined;
    const keys: (keyof BoardData)[] = ['todo', 'doing', 'done', 'stalled'];
    let fromKey: keyof BoardData | null = null;
    for (const k of keys) {
      const list = tasks.value[k] ?? [];
      const idx = list.findIndex(t => t.id === taskId);
      if (idx >= 0) {
        task = list[idx];
        fromKey = k;
        break;
      }
    }
    if (!task || !fromKey) return;

    const prev = {
      todo: [...(tasks.value.todo ?? [])],
      doing: [...(tasks.value.doing ?? [])],
      done: [...(tasks.value.done ?? [])],
      stalled: [...(tasks.value.stalled ?? [])],
    };

    const fromList = prev[fromKey].filter(t => t.id !== taskId);
    const newTask = { ...task, status: newStatus as Task['status'] };
    const toList = [...(prev[statusKey] ?? [])];
    const idx = newIndex !== undefined && newIndex >= 0 ? Math.min(newIndex, toList.length) : toList.length;
    toList.splice(idx, 0, newTask);

    tasks.value = {
      ...tasks.value,
      [fromKey]: fromList,
      [statusKey]: toList,
    };

    try {
      // 拖拽保存：0-based 状态 0–3，PATCH /api/tasks/:id body: { status }
      const payload = {
        status: statusToBackendNumber(newStatus as Task['status']),
        ...(newIndex !== undefined && { sortOrder: newIndex }),
      } as unknown as Partial<Task>;
      await taskApi.updateTask(taskId, payload);
      const snap = (tasks.value[statusKey] ?? []).find((x) => x.id === taskId);
      emitTaskUpdated(taskId, snap);
    } catch (e) {
      tasks.value = { ...prev };
      throw e;
    }
  }

  return {
    tasks,
    loading,
    allTasks,
    fetchBoard,
    fetchTasks,
    fetchTasksInRange,
    createTask,
    updateTask,
    deleteTask,
    archiveTask,
    moveTask,
  };
});
