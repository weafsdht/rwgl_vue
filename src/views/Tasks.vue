<template>
  <div class="tasks-page">
    <!-- 筛选工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="tb-pill" :class="{ active: activeFilterCount > 0 }">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
          筛选 <span v-if="activeFilterCount" class="tb-pill-count">{{ activeFilterCount }}</span>
        </div>
        <n-dropdown :options="sortDropdownOpts" trigger="click" @select="onSortSelect">
          <div class="tb-pill" :class="{ active: sortMode !== 'none' }">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5h10M11 9h7M11 13h4M3 17l4 4 4-4M7 3v18"/></svg>
            {{ sortModeLabel }}
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </n-dropdown>

        <n-dropdown :options="projectDropdownOpts" trigger="click" @select="onProjectSelect">
          <div class="tb-pill" :class="{ active: selectedProjectId !== ALL_PROJECTS_ID }">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            {{ selectedProjectId !== ALL_PROJECTS_ID ? (projects.find(p => p.id === selectedProjectId)?.name || '项目') : '项目' }}
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </n-dropdown>

        <n-dropdown :options="statusDropdownOpts" trigger="click" @select="onStatusSelect">
          <div class="tb-pill" :class="{ active: !!filterStatus || filterOverdueOnly }">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
            {{ filterOverdueOnly ? '超期' : filterStatus ? statusLabel(filterStatus) : '状态' }}
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </n-dropdown>

        <n-dropdown :options="tagDropdownOpts" trigger="click" @select="onTagSelect">
          <div class="tb-pill" :class="{ active: !!filterTagId }">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
            {{ filterTagId ? (allTags.find(t => t.id === filterTagId)?.name || '标签') : '标签' }}
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </n-dropdown>

        <n-dropdown :options="priorityDropdownOpts" trigger="click" @select="onPrioritySelect">
          <div class="tb-pill" :class="{ active: filterPriority !== null }">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
            {{ filterPriority !== null ? getPriorityLabel(filterPriority) : '优先级' }}
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </n-dropdown>

        <n-dropdown :options="assigneeDropdownOpts" trigger="click" @select="onAssigneeSelect">
          <div class="tb-pill" :class="{ active: filterAssigneeId !== null }">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            {{ filterAssigneeId !== null ? (assigneeUserMap.get(filterAssigneeId)?.nickname || assigneeUserMap.get(filterAssigneeId)?.username || '负责人') : '负责人' }}
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </n-dropdown>

      </div>
      <div class="toolbar-right">
        <n-input v-model:value="searchText" placeholder="搜索任务..." clearable class="tb-search" />
      </div>
    </div>

    <div v-if="loading" class="loading"><div class="loader-ring"></div></div>

    <div v-else-if="filteredTasks.length === 0" class="empty-state">
      <div class="empty-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><path d="M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
      </div>
      <p>{{ emptyHint }}</p>
    </div>

    <div v-else class="table-wrap">
      <table class="t-table">
        <thead>
          <tr>
            <th class="c-status">状态</th>
            <th class="c-title">任务标题</th>
            <th class="c-labels">标签</th>
            <th class="c-project">项目</th>
            <th class="c-priority">优先级</th>
            <th class="c-start">开始时间</th>
            <th class="c-due">截止日期</th>
            <th class="c-countdown">倒计时</th>
            <th class="c-assignee">负责人</th>
            <th class="c-actions"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="task in pagedTasks" :key="task.id" class="t-row" @click="handleEdit(task)">
            <td class="c-status">
              <span class="t-status" :class="'t-status--' + task.status">
                <i class="t-dot"></i>{{ statusLabel(task.status) }}
              </span>
            </td>
            <td class="c-title"><span class="t-title">{{ task.title }}</span></td>
            <td class="c-labels">
              <div v-if="taskDisplayTags(task).length" class="t-labels">
                <span v-for="tag in taskDisplayTags(task).slice(0, 2)" :key="tag.id" class="t-label"
                  :style="{ background: tag.color || '#e5e7eb', color: tagChipTextColor(tag.color) }">{{ tag.name }}</span>
                <span v-if="taskDisplayTags(task).length > 2" class="t-label-more">+{{ taskDisplayTags(task).length - 2 }}</span>
              </div>
              <span v-else class="t-empty">-</span>
            </td>
            <td class="c-project">
              <span class="t-project">{{ task.projectName?.trim() || '未分组' }}</span>
            </td>
            <td class="c-priority">
              <span class="t-priority" :style="{ background: getPriorityBg(task.priority), color: getPriorityColor(task.priority) }">{{ getPriorityLabel(task.priority) }}</span>
            </td>
            <td class="c-start">
              <span v-if="task.startTime" class="t-due">{{ formatDue(task.startTime) }}</span>
              <span v-else class="t-empty">-</span>
            </td>
            <td class="c-due">
              <span v-if="task.dueTime" class="t-due" :class="{ overdue: task.isOverdue }">{{ formatDue(task.dueTime) }}</span>
              <span v-else class="t-empty">-</span>
            </td>
            <td class="c-countdown">
              <span v-if="task.dueTime" class="t-countdown" :style="countdownStyle(task.dueTime)">{{ countdownText(task.dueTime) }}</span>
              <span v-else class="t-empty">-</span>
            </td>
            <td class="c-assignee">
              <div v-if="displayAssignees(task).length" class="t-avatars" :title="assigneeNames(task)">
                <template v-for="(u, idx) in displayAssignees(task).slice(0, 3)" :key="u.id + '-' + idx">
                  <span v-if="u.avatar" class="t-av"><img :src="getAvatarUrl(u.avatar)" :alt="(u.nickname || u.username || '?')[0]" /></span>
                  <span v-else class="t-av t-av--init">{{ (u.nickname || u.username || u.email || '?')[0].toUpperCase() }}</span>
                </template>
                <span v-if="displayAssignees(task).length > 3" class="t-av-more">+{{ displayAssignees(task).length - 3 }}</span>
              </div>
              <span v-else class="t-empty">-</span>
            </td>
            <td class="c-actions">
              <n-dropdown :options="rowMenuOptions(task)" trigger="click" @select="(key: string) => handleRowMenuSelect(key, task)">
                <button type="button" class="t-menu-btn" aria-label="更多操作" @click.stop>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="6" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="18" r="1.5"/></svg>
                </button>
              </n-dropdown>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="pagination" :class="{ 'pagination--single': totalPages <= 1 }">
        <div v-if="totalPages > 1" class="pagination-nav">
          <button type="button" class="pg-btn" :disabled="currentPage === 1" @click="currentPage--">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
            上一页
          </button>
          <template v-for="p in pageNumbers" :key="p">
            <span v-if="p === '...'" class="pg-dots">...</span>
            <button v-else type="button" class="pg-num" :class="{ active: p === currentPage }" @click="currentPage = p as number">{{ p }}</button>
          </template>
          <button type="button" class="pg-btn" :disabled="currentPage === totalPages" @click="currentPage++">
            下一页
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
        <div class="pagination-size">
          <span class="pg-size-label">每页</span>
          <n-select
            v-model:value="pageSize"
            :options="pageSizeSelectOptions"
            size="small"
            class="pg-size-select"
          />
          <span class="pg-total">共 {{ filteredTasks.length }} 条</span>
        </div>
      </div>
    </div>
  </div>

  <ConfirmModal
    v-model="showDeleteConfirm"
    title="删除提示"
    :content="deleteTarget ? `确定要删除任务「${deleteTarget.title}」吗？删除后不可恢复。` : ''"
    confirm-text="确 定"
    cancel-text="取 消"
    @confirm="handleDelete"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import dayjs from 'dayjs';
import { NInput, NDropdown, NSelect } from 'naive-ui';
import ConfirmModal from '@/components/ConfirmModal.vue';
import '../styles/components.css';
import { useTasks } from '@/composables/useTasks';
import { useProjects } from '@/composables/useProjects';
import { runAutoArchive } from '@/composables/useAutoArchive';
import { useUserStore } from '@/stores/user';
import { getAvatarUrl } from '@/utils/request';
import { formatDate, getCountdownText, isOverdue as checkDueOverdue } from '@/utils/date';
import { normalizeTaskStatus, getPriorityLabel, getPriorityColor, getPriorityBg } from '@/utils/task';
import tagApi from '@/api/tag';
import teamApi from '@/api/team';
import type { Task, User } from '@/types';
import type { Tag, TeamMember } from '@/types';

function tagChipTextColor(bgHex: string | undefined): string {
  if (!bgHex || bgHex === '') return 'var(--text-primary)';
  const hex = bgHex.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#1f2937' : '#fff';
}

const route = useRoute();
const { allTasks, loading, fetchTasks, deleteTask, archiveTask, tasks } = useTasks();
const { projects, currentProjectId, fetchProjects, setCurrentProject } = useProjects();
const userStore = useUserStore();

/** 与看板/项目列表一致：未完成 + 有截止时间且已逾期 */
function isTaskOverdue(task: Task): boolean {
  if (task.archivedAt || task.status === 'done') return false;
  if (task.isOverdue != null) return task.isOverdue;
  if (!task.dueTime) return false;
  return checkDueOverdue(task.dueTime);
}

const filterOverdueOnly = ref(false);

function applyQueryFilters() {
  const q = route.query;
  if (q.overdue === '1' || q.overdue === 'true') {
    filterOverdueOnly.value = true;
    filterStatus.value = null;
  } else {
    filterOverdueOnly.value = false;
    const st = q.status as string | undefined;
    if (st && ['todo', 'doing', 'done', 'stalled'].includes(st)) {
      filterStatus.value = st;
    }
  }
}

const emptyHint = computed(() => {
  if (filterOverdueOnly.value) return '暂无超期任务';
  if (searchText.value || filterStatus.value) return '没有找到匹配的任务';
  return '暂无任务';
});

const allTags = ref<Tag[]>([]);
function taskDisplayTags(task: Task): Tag[] {
  if (task.tags?.length) return task.tags;
  const raw = task as Task & Record<string, unknown>;
  const ids = task.tagIds ?? (Array.isArray(raw.tag_ids) ? raw.tag_ids : undefined);
  if (!ids?.length || !allTags.value.length) return [];
  return ids.map((id: unknown) => allTags.value.find(t => t.id === Number(id))).filter((t): t is Tag => t != null);
}

const searchText = ref('');
const filterStatus = ref<string | null>(null);
const ALL_PROJECTS_ID = -1;
const selectedProjectId = ref<number>(currentProjectId.value ?? ALL_PROJECTS_ID);

const projectDropdownOpts = computed(() => [
  { label: '全部项目', key: ALL_PROJECTS_ID },
  ...projects.value.map(p => ({ label: p.name, key: p.id })),
]);


const filterTagId = ref<number | null>(null);
const filterPriority = ref<number | null>(null);
const filterAssigneeId = ref<number | null>(null);

const activeFilterCount = computed(() => {
  let n = 0;
  if (filterStatus.value) n++;
  if (filterTagId.value) n++;
  if (filterPriority.value !== null) n++;
  if (filterAssigneeId.value !== null) n++;
  if (selectedProjectId.value !== ALL_PROJECTS_ID) n++;
  if (searchText.value) n++;
  if (filterOverdueOnly.value) n++;
  return n;
});

type SortMode = 'none' | 'startTime' | 'dueTime' | 'countdown';
const sortMode = ref<SortMode>('none');
const sortModeLabel = computed(() => {
  const labels: Record<SortMode, string> = { none: '排序', startTime: '开始时间', dueTime: '结束时间', countdown: '倒计时' };
  return labels[sortMode.value];
});
const sortDropdownOpts = [
  { label: '默认排序', key: 'none' },
  { label: '按开始时间', key: 'startTime' },
  { label: '按结束时间', key: 'dueTime' },
  { label: '按倒计时', key: 'countdown' },
];
function onSortSelect(key: string) {
  sortMode.value = key as SortMode;
}

const statusDropdownOpts = computed(() => [
  { label: '全部状态', key: '__all__' },
  { label: '待办', key: 'todo' },
  { label: '进行中', key: 'doing' },
  { label: '已完成', key: 'done' },
  { label: '搁置', key: 'stalled' },
  { label: '超期', key: 'overdue' },
]);

function onStatusSelect(key: string) {
  if (key === '__all__') {
    filterStatus.value = null;
    filterOverdueOnly.value = false;
  } else if (key === 'overdue') {
    filterStatus.value = null;
    filterOverdueOnly.value = true;
  } else {
    filterStatus.value = key;
    filterOverdueOnly.value = false;
  }
}

const tagDropdownOpts = computed(() => [
  { label: '全部标签', key: 0 },
  ...allTags.value.map(t => ({ label: t.name, key: t.id })),
]);

function onTagSelect(key: number) {
  filterTagId.value = key === 0 ? null : key;
}

const priorityDropdownOpts = computed(() => [
  { label: '全部优先级', key: -1 },
  { label: getPriorityLabel(1), key: 1 },
  { label: getPriorityLabel(2), key: 2 },
  { label: getPriorityLabel(3), key: 3 },
  { label: getPriorityLabel(4), key: 4 },
]);

function onPrioritySelect(key: number) {
  filterPriority.value = key === -1 ? null : key;
}

const assigneeDropdownOpts = computed(() => {
  const opts: { label: string; key: number }[] = [{ label: '全部负责人', key: -1 }];
  const seen = new Set<number>();
  for (const t of allTasks.value) {
    if (t.assigneeId != null && !seen.has(t.assigneeId)) {
      seen.add(t.assigneeId);
      const u = assigneeUserMap.value.get(t.assigneeId);
      opts.push({ label: u?.nickname || u?.username || `用户${t.assigneeId}`, key: t.assigneeId });
    }
    if ((t as any).participants) {
      for (const p of (t as any).participants) {
        if (p.userId != null && !seen.has(p.userId)) {
          seen.add(p.userId);
          const u = assigneeUserMap.value.get(p.userId);
          opts.push({ label: u?.nickname || u?.username || `用户${p.userId}`, key: p.userId });
        }
      }
    }
  }
  return opts;
});

function onAssigneeSelect(key: number) {
  filterAssigneeId.value = key === -1 ? null : key;
}

const filteredTasks = computed(() => {
  let list = allTasks.value;
  if (searchText.value) {
    const kw = searchText.value.toLowerCase();
    list = list.filter(t => t.title.toLowerCase().includes(kw) || t.description?.toLowerCase().includes(kw));
  }
  if (filterStatus.value) {
    list = list.filter(t => t.status === filterStatus.value);
  }
  if (filterTagId.value) {
    const tid = filterTagId.value;
    list = list.filter(t => {
      const tags = taskDisplayTags(t);
      return tags.some(tag => tag.id === tid);
    });
  }
  if (filterPriority.value !== null) {
    const p = filterPriority.value;
    list = list.filter(t => t.priority === p);
  }
  if (filterAssigneeId.value !== null) {
    const aid = filterAssigneeId.value;
    list = list.filter(t => {
      if (t.assigneeId === aid) return true;
      if ((t as any).participants?.some((p: any) => p.userId === aid)) return true;
      return false;
    });
  }
  if (filterOverdueOnly.value) {
    list = list.filter((t) => isTaskOverdue(t));
  }
  if (sortMode.value === 'startTime') {
    list = [...list].sort((a, b) => {
      const da = a.startTime ? new Date(a.startTime).getTime() : Infinity;
      const db = b.startTime ? new Date(b.startTime).getTime() : Infinity;
      return da - db;
    });
  } else if (sortMode.value === 'dueTime') {
    list = [...list].sort((a, b) => {
      const da = a.dueTime ? new Date(a.dueTime).getTime() : Infinity;
      const db = b.dueTime ? new Date(b.dueTime).getTime() : Infinity;
      return da - db;
    });
  } else if (sortMode.value === 'countdown') {
    const now = Date.now();
    list = [...list].sort((a, b) => {
      const ra = a.dueTime ? new Date(a.dueTime).getTime() - now : Infinity;
      const rb = b.dueTime ? new Date(b.dueTime).getTime() - now : Infinity;
      return ra - rb;
    });
  }
  return list;
});

const PAGE_SIZE_STORAGE_KEY = 'tasksListPageSize';
const PAGE_SIZE_OPTIONS = [20, 50, 100, 500, 1000] as const;

function readStoredPageSize(): number {
  try {
    const raw = localStorage.getItem(PAGE_SIZE_STORAGE_KEY);
    if (raw == null || raw === '') return 20;
    const n = parseInt(raw, 10);
    if (Number.isFinite(n) && (PAGE_SIZE_OPTIONS as readonly number[]).includes(n)) return n;
  } catch {
    /* ignore */
  }
  return 20;
}

const pageSize = ref<number>(readStoredPageSize());
const pageSizeSelectOptions = PAGE_SIZE_OPTIONS.map((v) => ({ label: `${v} 条`, value: v }));

const currentPage = ref(1);
watch(filteredTasks, () => { currentPage.value = 1; });

watch(pageSize, (v) => {
  try {
    localStorage.setItem(PAGE_SIZE_STORAGE_KEY, String(v));
  } catch {
    /* ignore */
  }
  const tp = Math.max(1, Math.ceil(filteredTasks.value.length / v));
  if (currentPage.value > tp) currentPage.value = tp;
});

const totalPages = computed(() => Math.max(1, Math.ceil(filteredTasks.value.length / pageSize.value)));
const pagedTasks = computed(() => {
  const ps = pageSize.value;
  const start = (currentPage.value - 1) * ps;
  return filteredTasks.value.slice(start, start + ps);
});

const pageNumbers = computed(() => {
  const total = totalPages.value;
  const cur = currentPage.value;
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | string)[] = [1];
  if (cur > 3) pages.push('...');
  for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i);
  if (cur < total - 2) pages.push('...');
  pages.push(total);
  return pages;
});

async function loadTasks() {
  const id = selectedProjectId.value;
  try {
    await fetchTasks(id === ALL_PROJECTS_ID ? undefined : { projectId: id }, { skipGlobalError: true });
  } catch {
    /* 已关闭全局 Toast；失败时保留上次列表数据 */
  }
  await ensureAssigneeMap();
  const archived = await runAutoArchive(tasks.value.done ?? [], archiveTask);
  if (archived > 0) {
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'info', title: '自动归档', message: `${archived} 个已完成任务已移入归档` },
    }));
  }
}

function onProjectSelect(key: number) {
  selectedProjectId.value = key;
  setCurrentProject(key === ALL_PROJECTS_ID ? null : key);
  loadTasks();
}

function onTaskCreated() { loadTasks(); }
/** 任务状态/字段在任意入口更新后，与 store 同步并刷新当前列表筛选 */
function onTaskSync() {
  loadTasks();
}
function onRefreshView(e: Event) {
  const d = (e as CustomEvent).detail;
  if (!d?.view || d.view === 'Tasks') loadTasks();
}

watch(currentProjectId, (id) => { selectedProjectId.value = id ?? ALL_PROJECTS_ID; });

watch(() => route.query, () => {
  applyQueryFilters();
});

onMounted(() => {
  applyQueryFilters();
  userStore.fetchCurrentUser().catch(() => {});
  tagApi.getList({ skipGlobalError: true }).then(list => { allTags.value = list ?? []; }).catch(() => { allTags.value = []; });
  fetchProjects().then(() => {
    selectedProjectId.value = currentProjectId.value ?? ALL_PROJECTS_ID;
    loadTasks();
  });
  window.addEventListener('task-created', onTaskCreated);
  window.addEventListener('task-updated', onTaskSync);
  window.addEventListener('task-deleted', onTaskSync);
  window.addEventListener('refresh-view', onRefreshView);
  countdownTimer = setInterval(() => { countdownNow.value = dayjs(); }, 60 * 1000);
});

onUnmounted(() => {
  window.removeEventListener('task-created', onTaskCreated);
  window.removeEventListener('task-updated', onTaskSync);
  window.removeEventListener('task-deleted', onTaskSync);
  window.removeEventListener('refresh-view', onRefreshView);
  if (countdownTimer) clearInterval(countdownTimer);
});

function statusLabel(status: string): string {
  const map: Record<string, string> = { todo: '待办', doing: '进行中', done: '已完成', stalled: '搁置' };
  return map[status] ?? status;
}

function formatDue(dueTime: string): string { return formatDate(dueTime, 'YYYY-MM-DD'); }

const countdownNow = ref(dayjs());
let countdownTimer: ReturnType<typeof setInterval> | null = null;
function countdownText(dueTime: string): string { return getCountdownText(dueTime, countdownNow.value); }

function countdownStyle(dueTime: string): Record<string, string> {
  const remaining = new Date(dueTime).getTime() - Date.now();
  const days = remaining / (1000 * 60 * 60 * 24);
  let color: string;
  let bg: string;
  if (remaining <= 0) {
    color = '#ef4444'; bg = 'rgba(239,68,68,0.1)';
  } else if (days < 3) {
    color = '#eab308'; bg = 'rgba(234,179,8,0.1)';
  } else if (days < 7) {
    color = '#3b82f6'; bg = 'rgba(59,130,246,0.1)';
  } else {
    color = '#22c55e'; bg = 'rgba(34,197,94,0.1)';
  }
  return { color, background: bg };
}


const assigneeUserMap = ref<Map<number, User>>(new Map());

async function ensureAssigneeMap() {
  const ids = new Set<number>();
  const rawIds = (t: Task) => {
    if (t.assigneeIds?.length) t.assigneeIds.forEach((id: number) => ids.add(id));
    else if (t.assigneeId != null) ids.add(t.assigneeId);
    else {
      const r = t as Task & Record<string, unknown>;
      if (Array.isArray(r.assignee_ids)) r.assignee_ids.forEach((id: unknown) => ids.add(Number(id)));
      else if (r.assignee_id != null) ids.add(Number(r.assignee_id));
    }
  };
  for (const t of allTasks.value) rawIds(t);
  if (ids.size === 0) { assigneeUserMap.value = new Map(); return; }
  try {
    const teams = await teamApi.getMyTeams();
    const memberLists = await Promise.all((teams ?? []).map((t) => teamApi.getTeamMembers(t.id)));
    const map = new Map<number, User>();
    const u = userStore.user;
    if (u) map.set(u.id, u);
    for (const members of memberLists) {
      for (const m of members ?? []) {
        if (m.status === 'active' && !map.has(m.userId)) {
          map.set(m.userId, {
            id: m.userId,
            username: (m as TeamMember & { username?: string }).username ?? m.nickname ?? m.email,
            nickname: m.nickname, email: m.email, avatar: m.avatar, createdAt: '',
          });
        }
      }
    }
    assigneeUserMap.value = map;
  } catch { assigneeUserMap.value = new Map(); }
}

function displayAssignee(task: Task): User | null {
  if (task.assignee) return task.assignee;
  const raw = task as Task & Record<string, unknown>;
  const aid = task.assigneeId ?? (raw.assignee_id != null ? Number(raw.assignee_id) : null);
  if (aid != null && userStore.user?.id === aid) return userStore.user;
  if (aid != null) return assigneeUserMap.value.get(aid) ?? null;
  return null;
}

function displayAssignees(task: Task): User[] {
  if (task.assignees?.length) return task.assignees;
  const raw = task as Task & Record<string, unknown>;
  const ids = task.assigneeIds?.length ? task.assigneeIds
    : Array.isArray(raw.assignee_ids) && raw.assignee_ids.length ? raw.assignee_ids.map((id: unknown) => Number(id))
    : task.assigneeId != null ? [task.assigneeId]
    : raw.assignee_id != null ? [Number(raw.assignee_id)] : [];
  if (ids.length === 0) { const s = displayAssignee(task); return s ? [s] : []; }
  const list: User[] = [];
  for (const id of ids) {
    const u = (task.assignee && task.assignee.id === id) ? task.assignee
      : userStore.user?.id === id ? userStore.user : assigneeUserMap.value.get(id);
    if (u) list.push(u);
    else list.push({ id, username: `用户 ${id}`, nickname: `用户 ${id}`, email: '', createdAt: '' });
  }
  return list;
}

function assigneeNames(task: Task): string {
  return displayAssignees(task).map(u => u.nickname?.trim() || u.username?.trim() || u.email?.trim() || `用户 ${u.id}`).filter(Boolean).join('、') || '';
}

function handleEdit(task: Task): void {
  window.dispatchEvent(new CustomEvent('open-edit-task', { detail: { task } }));
}

function rowMenuOptions(task: Task) {
  const opts: { label: string; key: string }[] = [{ label: '编辑', key: 'edit' }];
  if (normalizeTaskStatus(task.status) === 'done') opts.push({ label: '归档', key: 'archive' });
  opts.push({ label: '删除', key: 'delete' });
  return opts;
}

async function handleRowMenuSelect(key: string, task: Task): Promise<void> {
  if (key === 'edit') handleEdit(task);
  else if (key === 'archive') await handleArchive(task);
  else if (key === 'delete') requestDelete(task);
}

const deleteTarget = ref<Task | null>(null);
const showDeleteConfirm = ref(false);
function requestDelete(task: Task) { deleteTarget.value = task; showDeleteConfirm.value = true; }

async function handleDelete(): Promise<void> {
  const task = deleteTarget.value;
  if (!task) return;
  showDeleteConfirm.value = false;
  try {
    await deleteTask(task.id);
    window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'success', title: '已删除', message: '任务已删除' } }));
    loadTasks();
  } catch (e) {
    window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'error', title: '删除失败', message: (e as Error)?.message || '请稍后重试' } }));
  } finally { deleteTarget.value = null; }
}

async function handleArchive(task: Task): Promise<void> {
  try {
    await archiveTask(task.id);
    window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'success', title: '已归档', message: '任务已移入归档' } }));
    loadTasks();
  } catch (e) {
    window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'error', title: '归档失败', message: (e as Error)?.message || '请稍后重试' } }));
  }
}
</script>

<style scoped>
/* ===== 全局 ===== */
.tasks-page {
  --teal: #2dd4bf; --teal-light: #99f6e4; --teal-dark: #0d9488;
  padding: 0; height: 100%; display: flex; flex-direction: column;
  background: var(--bg-primary); overflow: hidden;
}

/* ===== 工具栏 ===== */
.toolbar {
  flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 12px 20px; background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-subtle); flex-wrap: wrap;
}
.toolbar-left, .toolbar-right { display: flex; align-items: center; gap: 8px; }
.tb-search { width: 200px; }
.tb-pill {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 12px; border-radius: 8px; font-size: 12px; font-weight: 500;
  border: 1px solid var(--border-subtle); background: transparent; color: var(--text-secondary);
  cursor: pointer; transition: all 0.15s; user-select: none;
}
.tb-pill:hover { border-color: var(--teal); color: var(--teal); }
.tb-pill.active { background: var(--teal); color: #fff; border-color: var(--teal); }
.tb-pill-count {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 16px; height: 16px; border-radius: 8px; font-size: 10px; font-weight: 700;
  background: #fff; color: var(--teal); padding: 0 4px;
}
.tb-pill:not(.active) .tb-pill-count { background: var(--teal); color: #fff; }

/* ===== 表格面板 ===== */
.table-wrap {
  flex: 1; min-height: 0; display: flex; flex-direction: column;
  margin: 16px 20px; background: var(--bg-secondary); border-radius: 14px;
  border: 1px solid var(--border-subtle); overflow: auto;
}
.t-table { min-width: 1000px; width: 100%; border-collapse: collapse; table-layout: fixed; }
.t-table thead { background: var(--bg-secondary); }
.t-table th {
  padding: 12px 16px; font-size: 12px; font-weight: 600; color: var(--text-tertiary);
  text-align: left; letter-spacing: 0.05em; text-transform: none;
  border-bottom: 1px solid var(--border-subtle); position: sticky; top: 0;
  background: var(--bg-secondary); z-index: 1;
}
.t-table td { padding: 12px 16px; border-bottom: 1px solid var(--border-subtle); vertical-align: middle; }
.t-row { cursor: pointer; transition: background 0.15s; }
.t-row:hover { background: rgba(45,212,191,0.04); }
.t-row:last-child td { border-bottom: none; }

.c-status { width: 8%; min-width: 70px; }
.c-title { width: 18%; min-width: 120px; }
.c-labels { width: 12%; min-width: 80px; }
.c-project { width: 10%; min-width: 72px; }
.c-priority { width: 8%; min-width: 64px; }
.c-start { width: 10%; min-width: 88px; }
.c-due { width: 10%; min-width: 88px; }
.c-countdown { width: 9%; min-width: 72px; white-space: nowrap; }
.c-assignee { width: 11%; min-width: 104px; }
.c-actions { width: 4%; min-width: 36px; }

.t-title { font-size: 13px; font-weight: 500; color: var(--text-primary); display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ===== 状态 ===== */
.t-status { display: inline-flex; align-items: center; gap: 7px; font-size: 12px; font-weight: 500; white-space: nowrap; }
.t-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
.t-status--todo .t-dot { background: #3b82f6; }
.t-status--todo { color: #3b82f6; }
.t-status--doing .t-dot { background: #f59e0b; }
.t-status--doing { color: #d97706; }
.t-status--done .t-dot { background: #22c55e; }
.t-status--done { color: #16a34a; }
.t-status--stalled .t-dot { background: #94a3b8; }
.t-status--stalled { color: #64748b; }

.dot--todo { background: #3b82f6; }
.dot--doing { background: #f59e0b; }
.dot--done { background: #22c55e; }
.dot--stalled { background: #94a3b8; }

/* ===== 项目 ===== */
.t-project {
  font-size: 12px; color: var(--teal-dark); font-weight: 500;
  padding: 2px 8px; border-radius: 6px; background: rgba(45,212,191,0.08);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: inline-block; max-width: 100%;
}

/* ===== 头像 ===== */
.t-avatars { display: flex; align-items: center; }
.t-av {
  width: 34px; height: 34px; border-radius: 50%; overflow: hidden;
  border: 2px solid var(--bg-secondary); margin-left: -8px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
}
.t-av:first-child { margin-left: 0; }
.t-av img { width: 100%; height: 100%; object-fit: cover; display: block; }
.t-av--init { background: var(--teal); color: #fff; font-size: 13px; font-weight: 600; }
.t-av-more { margin-left: 6px; font-size: 11px; color: var(--text-tertiary); font-weight: 500; }

/* ===== 日期 ===== */
.t-due { font-size: 12px; color: var(--text-secondary); }
.t-due.overdue { color: #ef4444; font-weight: 600; }

/* ===== 倒计时 ===== */
.t-countdown {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 10px; border-radius: 8px; font-size: 11px; font-weight: 600; white-space: nowrap;
}

/* ===== 优先级 ===== */
.t-priority {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 10px; border-radius: 8px; font-size: 11px; font-weight: 600; white-space: nowrap;
}

/* ===== 标签 ===== */
.t-labels { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
.t-label { padding: 2px 8px; border-radius: 8px; font-size: 11px; font-weight: 500; max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.t-label-more { font-size: 11px; color: var(--text-tertiary); font-weight: 500; }

/* ===== 操作 ===== */
.t-menu-btn {
  padding: 4px; border: none; background: transparent; color: var(--text-tertiary);
  cursor: pointer; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.t-menu-btn:hover { color: var(--teal); background: rgba(45,212,191,0.08); }

.t-empty { color: var(--text-tertiary); font-size: 12px; }

/* ===== 分页：每页条数 + 总数固定最右，多页时页码在左侧区域居中 ===== */
.pagination {
  flex-shrink: 0;
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 12px 16px;
  padding: 12px 16px;
  border-top: 1px solid var(--border-subtle);
  width: 100%;
  box-sizing: border-box;
}
.pagination--single {
  grid-template-columns: 1fr;
}
.pagination--single .pagination-size {
  justify-self: end;
}
.pagination-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  flex-wrap: wrap;
  min-width: 0;
}
.pagination-size {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-secondary);
  justify-self: end;
}
.pg-size-label { white-space: nowrap; }
.pg-size-select { width: 100px; }
.pg-total { color: var(--text-tertiary); white-space: nowrap; }
.pg-btn {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 5px 12px; border-radius: 8px; border: 1px solid var(--border-subtle);
  background: transparent; color: var(--text-secondary);
  font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.15s;
}
.pg-btn:hover:not(:disabled) { border-color: var(--teal); color: var(--teal); }
.pg-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.pg-num {
  width: 30px; height: 30px; border-radius: 8px; border: none; background: transparent;
  color: var(--text-secondary); font-size: 12px; font-weight: 500; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center; transition: all 0.15s;
}
.pg-num:hover { background: rgba(45,212,191,0.08); color: var(--teal); }
.pg-num.active { background: var(--teal); color: #fff; font-weight: 700; }
.pg-dots { color: var(--text-tertiary); font-size: 12px; padding: 0 2px; }

/* ===== 加载与空状态 ===== */
.loading { display: flex; align-items: center; justify-content: center; flex: 1; }
.loader-ring { width: 36px; height: 36px; border: 3px solid var(--border-subtle); border-top-color: var(--teal); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-tertiary); }
.empty-icon { width: 56px; height: 56px; margin-bottom: 12px; opacity: 0.35; color: var(--teal); }
.empty-icon svg { width: 100%; height: 100%; }

/* ===== 暗色模式微调 ===== */
[data-theme="dark"] .toolbar { background: var(--bg-secondary); border-color: rgba(255,255,255,0.06); }
[data-theme="dark"] .table-wrap { border-color: rgba(255,255,255,0.06); }
[data-theme="dark"] .t-row:hover { background: rgba(45,212,191,0.06); }
[data-theme="dark"] .t-project { background: rgba(45,212,191,0.12); }

/* ===== 响应式 ===== */
@media (max-width: 1100px) {
  .c-start, .c-countdown { display: none; }
}
@media (max-width: 900px) {
  .toolbar { flex-direction: column; align-items: stretch; }
  .toolbar-left, .toolbar-right { flex-wrap: wrap; }
  .c-labels, .c-project { display: none; }
  .table-wrap { margin: 12px; }
}
@media (max-width: 600px) {
  .c-assignee, .c-priority { display: none; }
  .table-wrap { margin: 8px; border-radius: 10px; }
}
</style>
