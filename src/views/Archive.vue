<template>
  <div class="archive-page">
    <div class="page-header">
      <div class="page-title-row">
        <h1 class="page-title">任务归档</h1>
      </div>
      <!-- 筛选框（所属项目、任务名称）与导出表格、一键删除始终显示，无数据时按钮禁用 -->
      <div v-if="!loading" class="page-toolbar">
        <div class="archive-filters">
          <n-select
            v-model:value="filterProjectId"
            :options="projectFilterOptions"
            placeholder="所属项目"
            clearable
            class="filter-select"
            style="width: 180px"
          />
          <n-input
            v-model:value="filterTaskName"
            placeholder="任务名称"
            clearable
            class="filter-input"
            style="width: 200px"
          />
        </div>
        <div class="page-actions">
          <button
            type="button"
            class="btn-action btn-export"
            title="当前筛选结果，含全部字段及标签/负责人/子任务/附件/评论等（嵌套列为 JSON）"
            :disabled="deletingAll || importing || filteredArchivedTasks.length === 0"
            @click="handleExportCsvFull"
          >
            导出 CSV
          </button>
          <input
            ref="csvImportInputRef"
            type="file"
            accept=".csv,text/csv"
            class="csv-import-input"
            aria-hidden="true"
            @change="onCsvImportFile"
          />
          <button
            type="button"
            class="btn-action btn-export"
            title="选择由本页「导出 CSV」生成的文件，将按行创建任务并归档（不覆盖已有 ID）"
            :disabled="deletingAll || importing"
            @click="triggerCsvImport"
          >
            {{ importing ? '导入中…' : '导入 CSV' }}
          </button>
          <button type="button" class="btn-action btn-delete-all" :disabled="deletingAll || importing || selectedIds.size === 0" @click="handleDeleteSelectedClick">
            {{ deletingAll ? '删除中…' : `一键删除${selectedCountInView ? `（${selectedCountInView}）` : ''}` }}
          </button>
        </div>
      </div>
    </div>

    <!-- 删除提示：确认后再执行批量删除 -->
    <ConfirmModal
      v-model="showDeleteConfirm"
      title="删除提示"
      :content="deleteConfirmContent"
      confirm-text="确 定"
      cancel-text="取 消"
      @confirm="handleDeleteSelectedConfirm"
    />

    <div class="archive-body">
    <div v-if="loading" class="loading">
      <div class="loader-ring"></div>
    </div>
    <div v-else-if="loadError" class="empty-state empty-state-error">
      <div class="empty-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <p class="empty-text">{{ loadError }}</p>
      <p class="empty-hint">请确认后端服务已启动，且网络连接正常</p>
      <button type="button" class="btn-retry" @click="loadArchived">
        重新加载
      </button>
    </div>
    <div v-else-if="archivedTasks.length === 0" class="empty-state">
      <div class="empty-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 8v13H3V8"/>
          <path d="M1 3h22v5H1z"/>
          <path d="M10 12h4"/>
        </svg>
      </div>
      <p class="empty-text">暂无已归档任务</p>
    </div>
    <div v-else-if="filteredArchivedTasks.length === 0" class="empty-state empty-state-filtered">
      <p class="empty-text">当前筛选无结果，请调整所属项目或任务名称</p>
    </div>
    <div v-else class="archive-table-wrap">
      <table class="archive-table">
        <thead>
          <tr>
            <th class="col-checkbox">
              <input
                type="checkbox"
                :checked="isAllFilteredSelected"
                :indeterminate="isPartiallySelected"
                aria-label="全选当前列表"
                @change="toggleSelectAll"
              />
            </th>
            <th class="col-title">任务标题</th>
            <th class="col-project">所属项目</th>
            <th class="col-completed">完成时间</th>
            <th class="col-archived">归档时间</th>
            <th class="col-actions">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="task in filteredArchivedTasks" :key="task.id" class="archive-row">
            <td class="col-checkbox">
              <input
                type="checkbox"
                :checked="selectedIds.has(task.id)"
                aria-label="选中"
                @change="toggleSelect(task.id)"
              />
            </td>
            <td class="col-title">
              <span class="row-title" @click="handleEdit(task)">{{ task.title }}</span>
            </td>
            <td class="col-project">{{ projectName(task.projectId) }}</td>
            <td class="col-completed">{{ formatTime(task.completedAt || task.updatedAt) }}</td>
            <td class="col-archived">{{ formatTime(task.archivedAt) }}</td>
            <td class="col-actions">
              <button type="button" class="btn-restore" :disabled="restoringId === task.id" @click.stop="handleRestore(task)">
                {{ restoringId === task.id ? '恢复中…' : '恢复' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { NSelect, NInput } from 'naive-ui';
import ConfirmModal from '@/components/ConfirmModal.vue';
import taskApi from '@/api/task';
import projectApi from '@/api/project';
import type { Task, Project } from '@/types';
import dayjs from 'dayjs';
import { getPriorityLabel, normalizeTaskStatus } from '@/utils/task';

/** Task 上已单独导出的字段；其余归入「接口扩展字段」列，避免遗漏后端新增键 */
const KNOWN_TASK_KEYS = new Set<string>([
  'id', 'title', 'description', 'status', 'priority',
  'dueTime', 'startTime', 'projectId', 'projectName', 'projectColor',
  'parentId', 'assigneeId', 'assignee', 'assigneeIds', 'assignees',
  'tags', 'tagIds', 'subtasks',
  'estimateMinutes', 'actualMinutes', 'repeatRule', 'remindAt',
  'content', 'attachments', 'comments',
  'createdAt', 'updatedAt', 'isOverdue', 'sortOrder',
  'completedAt', 'archivedAt',
]);

const archivedTasks = ref<Task[]>([]);
const projects = ref<Project[]>([]);
const loading = ref(true);
const loadError = ref<string | null>(null);
const restoringId = ref<number | null>(null);
const deletingAll = ref(false);
const importing = ref(false);
const csvImportInputRef = ref<HTMLInputElement | null>(null);
const showDeleteConfirm = ref(false);
const ALL_PROJECTS_ID = -1;
const filterProjectId = ref<number>(ALL_PROJECTS_ID);
const filterTaskName = ref('');
/** 选中的任务 id 集合（Set 统一 .has/.add/.delete，避免 selectedIds.has is not a function） */
const selectedIds = ref<Set<number>>(new Set());

const projectFilterOptions = computed(() => [
  { label: '全部项目', value: ALL_PROJECTS_ID },
  ...projects.value.map(p => ({ label: p.name, value: p.id })),
]);

const filteredArchivedTasks = computed(() => {
  let list = archivedTasks.value;
  if (filterProjectId.value !== ALL_PROJECTS_ID) {
    list = list.filter(t => t.projectId === filterProjectId.value);
  }
  const keyword = filterTaskName.value.trim().toLowerCase();
  if (keyword) {
    list = list.filter(t => (t.title ?? '').toLowerCase().includes(keyword));
  }
  return list;
});

const isAllFilteredSelected = computed(() => {
  const list = filteredArchivedTasks.value;
  if (!list.length) return false;
  const set = selectedIds.value;
  return list.every(t => set.has(t.id));
});

const isPartiallySelected = computed(() => {
  const list = filteredArchivedTasks.value;
  if (!list.length) return false;
  const set = selectedIds.value;
  const n = list.filter(t => set.has(t.id)).length;
  return n > 0 && n < list.length;
});

/** 当前列表（筛选后）中选中的数量，用于按钮数字与可见勾选一致 */
const selectedCountInView = computed(() =>
  filteredArchivedTasks.value.filter(t => selectedIds.value.has(t.id)).length
);

const deleteConfirmContent = computed(() => {
  const n = selectedIds.value.size;
  return n > 0 ? `即将删除选中的 ${n} 条归档任务，删除后不可恢复。是否继续？` : '';
});

function toggleSelect(id: number) {
  const next = new Set(selectedIds.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  selectedIds.value = next;
}

function toggleSelectAll() {
  const list = filteredArchivedTasks.value;
  const set = selectedIds.value;
  if (isAllFilteredSelected.value) {
    const next = new Set(set);
    list.forEach(t => next.delete(t.id));
    selectedIds.value = next;
  } else {
    const next = new Set(set);
    list.forEach(t => next.add(t.id));
    selectedIds.value = next;
  }
}

function formatTime(val?: string): string {
  if (!val) return '—';
  return dayjs(val).format('YYYY-MM-DD HH:mm');
}

const projectName = (projectId?: number) => {
  if (projectId == null) return '—';
  const p = projects.value.find(x => x.id === projectId);
  return p?.name ?? `#${projectId}`;
};

async function loadArchived() {
  loading.value = true;
  loadError.value = null;
  try {
    const [list, projs] = await Promise.all([
      (async (): Promise<Task[]> => {
        try {
          return await taskApi.getArchivedTasks();
        } catch {
          // 若 /tasks/archived 不存在，回退到 GET /tasks?archived=true
          const fallback = await taskApi.getTasks({ archived: true }, { skipGlobalError: true });
          return Array.isArray(fallback) ? fallback : [];
        }
      })(),
      projectApi.getProjects(),
    ]);
    archivedTasks.value = Array.isArray(list) ? list : [];
    projects.value = projs ?? [];
  } catch (e) {
    loadError.value = (e as Error)?.message || '加载失败，请检查网络连接';
    // 请求失败时保留当前列表，避免「删除一个后刷新失败导致全部消失」
  } finally {
    loading.value = false;
  }
}

async function handleRestore(task: Task) {
  if (restoringId.value != null) return;
  restoringId.value = task.id;
  try {
    await taskApi.restoreTask(task.id);
    archivedTasks.value = archivedTasks.value.filter(t => t.id !== task.id);
    window.dispatchEvent(new CustomEvent('refresh-view'));
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'success', title: '已恢复', message: '任务已恢复至任务列表' },
    }));
  } catch (e) {
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'error', title: '恢复失败', message: (e as Error)?.message || '请稍后重试' },
    }));
  } finally {
    restoringId.value = null;
  }
}

function handleEdit(task: Task) {
  window.dispatchEvent(new CustomEvent('open-edit-task', { detail: { task } }));
}

function statusLabelZh(status: Task['status']): string {
  const map: Record<string, string> = {
    todo: '待办',
    doing: '进行中',
    done: '已完成',
    stalled: '搁置',
  };
  return map[status] ?? String(status);
}

function formatTimeOrDash(val?: string): string {
  if (!val) return '';
  return formatTime(val);
}

function assigneeDisplay(t: Task): string {
  const a = t.assignee;
  if (!a) return '';
  return (a.nickname || a.username || String(a.id)).trim();
}

function tagsNamesLine(t: Task): string {
  const tags = t.tags;
  if (!tags?.length) return '';
  return tags.map((g) => g.name).filter(Boolean).join('；');
}

/** 任意值写入 CSV 单元格：字符串直接转义，对象/数组先 JSON */
function csvCell(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return escapeCsv(v);
  if (typeof v === 'number' || typeof v === 'boolean') return escapeCsv(String(v));
  try {
    return escapeCsv(JSON.stringify(v));
  } catch {
    return escapeCsv(String(v));
  }
}

function extraApiFieldsJson(t: Task): string {
  const o = t as unknown as Record<string, unknown>;
  const rest: Record<string, unknown> = {};
  for (const k of Object.keys(o)) {
    if (!KNOWN_TASK_KEYS.has(k)) rest[k] = o[k];
  }
  return Object.keys(rest).length ? csvCell(rest) : '';
}

/** 单行：与 EXPORT_HEADERS 顺序一致 */
function taskToCsvRow(t: Task): string[] {
  const pn = t.projectName ?? projectName(t.projectId);
  const pri =
    typeof t.priority === 'number'
      ? `${t.priority}（${getPriorityLabel(t.priority)}）`
      : `${String(t.priority)}（${getPriorityLabel(t.priority)}）`;

  return [
    csvCell(t.id),
    csvCell(t.title),
    csvCell(t.description ?? ''),
    csvCell(statusLabelZh(t.status)),
    csvCell(t.status),
    csvCell(pri),
    csvCell(formatTimeOrDash(t.startTime)),
    csvCell(formatTimeOrDash(t.dueTime)),
    csvCell(t.projectId ?? ''),
    csvCell(pn),
    csvCell(t.projectColor ?? ''),
    csvCell(t.parentId ?? ''),
    csvCell(t.assigneeId ?? ''),
    csvCell(assigneeDisplay(t)),
    csvCell(t.assigneeIds ?? ''),
    csvCell(t.assignees ?? ''),
    csvCell(tagsNamesLine(t)),
    csvCell(t.tags ?? ''),
    csvCell(t.tagIds ?? ''),
    csvCell(t.subtasks ?? ''),
    csvCell(t.estimateMinutes ?? ''),
    csvCell(t.actualMinutes ?? ''),
    csvCell(t.repeatRule ?? ''),
    csvCell(formatTimeOrDash(t.remindAt)),
    csvCell(t.content ?? ''),
    csvCell(t.attachments ?? ''),
    csvCell(t.comments ?? ''),
    csvCell(formatTimeOrDash(t.createdAt)),
    csvCell(formatTimeOrDash(t.updatedAt)),
    csvCell(t.isOverdue === true ? '是' : t.isOverdue === false ? '否' : ''),
    csvCell(t.sortOrder ?? ''),
    csvCell(formatTimeOrDash(t.completedAt)),
    csvCell(formatTimeOrDash(t.archivedAt)),
    extraApiFieldsJson(t),
  ];
}

const EXPORT_HEADERS = [
  'ID',
  '任务标题',
  '描述',
  '状态',
  '状态代码',
  '优先级',
  '开始时间',
  '截止时间',
  '项目ID',
  '项目名称',
  '项目颜色',
  '父任务ID',
  '负责人ID',
  '负责人',
  '负责人ID列表',
  '负责人列表JSON',
  '标签（名称）',
  '标签JSON',
  '标签ID列表',
  '子任务JSON',
  '预估分钟',
  '实际分钟',
  '重复规则JSON',
  '提醒时间',
  '富文本内容',
  '附件JSON',
  '评论JSON',
  '创建时间',
  '更新时间',
  '是否超期',
  '排序',
  '完成时间',
  '归档时间',
  '接口扩展字段JSON',
] as const;

/** 导出 CSV：当前筛选下的全部字段 + 嵌套结构以 JSON 列呈现 */
function handleExportCsvFull() {
  const list = filteredArchivedTasks.value;
  const rows: string[][] = [[...EXPORT_HEADERS], ...list.map(taskToCsvRow)];
  const BOM = '\uFEFF';
  const csv = BOM + rows.map((r) => r.join(',')).join('\r\n');
  downloadBlob(csv, `归档任务_全字段_${dayjs().format('YYYY-MM-DD_HHmm')}.csv`, 'text/csv;charset=utf-8');
  window.dispatchEvent(
    new CustomEvent('toast', {
      detail: { type: 'success', title: '已导出', message: `已下载 CSV，共 ${list.length} 条` },
    })
  );
}

function triggerCsvImport() {
  csvImportInputRef.value?.click();
}

/** RFC4180 风格 CSV 解析（与导出一致：引号、逗号、换行） */
function parseCsvText(raw: string): string[][] {
  const text = raw.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
          continue;
        }
        quoted = false;
        continue;
      }
      cell += c;
      continue;
    }
    if (c === '"') {
      quoted = true;
      continue;
    }
    if (c === ',') {
      row.push(cell);
      cell = '';
      continue;
    }
    if (c === '\n' || c === '\r') {
      row.push(cell);
      cell = '';
      if (c === '\r' && text[i + 1] === '\n') i++;
      rows.push(row);
      row = [];
      continue;
    }
    cell += c;
  }
  row.push(cell);
  rows.push(row);
  return rows.filter((r) => r.length > 0 && !(r.length === 1 && r[0] === ''));
}

function headerIndexMap(headers: string[]): Map<string, number> {
  const m = new Map<string, number>();
  headers.forEach((h, i) => m.set(h.trim(), i));
  return m;
}

function parseJsonCell<T = unknown>(s: string): T | undefined {
  const t = s.trim();
  if (!t) return undefined;
  try {
    return JSON.parse(t) as T;
  } catch {
    return undefined;
  }
}

function parsePriorityImport(s: string): Task['priority'] {
  const t = s.trim();
  if (!t) return 2;
  const m = t.match(/^(\d+)/);
  if (m) {
    const n = parseInt(m[1], 10);
    if (!Number.isNaN(n)) return Math.min(5, Math.max(1, n)) as Task['priority'];
  }
  const low = t.toLowerCase();
  if (low.includes('high')) return 'high';
  if (low.includes('medium')) return 'medium';
  if (low.includes('low')) return 'low';
  return 2;
}

function parseDateIso(s: string): string | undefined {
  const t = s.trim();
  if (!t) return undefined;
  const d = dayjs(t);
  if (!d.isValid()) return undefined;
  return d.toISOString();
}

const STATUS_ZH: Record<string, Task['status']> = {
  待办: 'todo',
  进行中: 'doing',
  已完成: 'done',
  搁置: 'stalled',
};

function resolveStatusFromRow(rec: Record<string, string>): Task['status'] {
  const code = rec['状态代码']?.trim();
  if (code) {
    if (/^\d+$/.test(code)) return normalizeTaskStatus(parseInt(code, 10));
    return normalizeTaskStatus(code);
  }
  const zh = rec['状态']?.trim();
  if (zh && STATUS_ZH[zh]) return STATUS_ZH[zh];
  return 'todo';
}

function resolveProjectIdFromRow(rec: Record<string, string>): number | undefined {
  const raw = rec['项目ID']?.trim();
  if (raw) {
    const n = parseInt(raw, 10);
    if (!Number.isNaN(n) && n > 0) return n;
  }
  const name = rec['项目名称']?.trim();
  if (name) {
    const p = projects.value.find((x) => x.name === name);
    return p?.id;
  }
  return undefined;
}

/** 由导出列组装创建请求体（新建任务，不传 id） */
function buildCreateBodyFromCsvRow(rec: Record<string, string>): Partial<Task> | null {
  const title = (rec['任务标题'] ?? '').trim();
  if (!title) return null;

  const status = resolveStatusFromRow(rec);
  const body: Partial<Task> = {
    title,
    description: rec['描述']?.trim() || undefined,
    status,
    priority: parsePriorityImport(rec['优先级'] ?? ''),
  };

  const st = parseDateIso(rec['开始时间'] ?? '');
  const due = parseDateIso(rec['截止时间'] ?? '');
  if (st) body.startTime = st;
  if (due) body.dueTime = due;

  const pid = resolveProjectIdFromRow(rec);
  if (pid != null) body.projectId = pid;

  const parentRaw = rec['父任务ID']?.trim();
  if (parentRaw) {
    const p = parseInt(parentRaw, 10);
    if (!Number.isNaN(p)) body.parentId = p;
  }

  const assigneeRaw = rec['负责人ID']?.trim();
  if (assigneeRaw) {
    const a = parseInt(assigneeRaw, 10);
    if (!Number.isNaN(a)) body.assigneeId = a;
  }

  const assigneeIds = parseJsonCell<number[]>(rec['负责人ID列表'] ?? '');
  if (Array.isArray(assigneeIds) && assigneeIds.length) body.assigneeIds = assigneeIds;

  const tagIds = parseJsonCell<number[]>(rec['标签ID列表'] ?? '');
  if (Array.isArray(tagIds) && tagIds.length) body.tagIds = tagIds;

  const est = rec['预估分钟']?.trim();
  if (est) {
    const n = parseInt(est, 10);
    if (!Number.isNaN(n)) body.estimateMinutes = n;
  }
  const act = rec['实际分钟']?.trim();
  if (act) {
    const n = parseInt(act, 10);
    if (!Number.isNaN(n)) body.actualMinutes = n;
  }

  const repeatRule = parseJsonCell<Task['repeatRule']>(rec['重复规则JSON'] ?? '');
  if (repeatRule && typeof repeatRule === 'object') body.repeatRule = repeatRule;

  const remind = parseDateIso(rec['提醒时间'] ?? '');
  if (remind) body.remindAt = remind;

  const content = rec['富文本内容']?.trim();
  if (content) body.content = content;

  const sortRaw = rec['排序']?.trim();
  if (sortRaw) {
    const n = parseInt(sortRaw, 10);
    if (!Number.isNaN(n)) body.sortOrder = n;
  }

  const completed = parseDateIso(rec['完成时间'] ?? '');
  if (completed && status === 'done') body.completedAt = completed;

  if (!body.tagIds?.length) {
    const tagsJson = parseJsonCell<Array<{ id?: number }>>(rec['标签JSON'] ?? '');
    if (Array.isArray(tagsJson) && tagsJson.length) {
      const ids = tagsJson.map((t) => t.id).filter((x): x is number => typeof x === 'number');
      if (ids.length) body.tagIds = ids;
    }
  }

  const extra = parseJsonCell<Record<string, unknown>>(rec['接口扩展字段JSON'] ?? '');
  if (extra && typeof extra === 'object' && !Array.isArray(extra)) {
    for (const [k, v] of Object.entries(extra)) {
      if (KNOWN_TASK_KEYS.has(k)) continue;
      (body as Record<string, unknown>)[k] = v;
    }
  }

  return body;
}

async function importArchivedTasksFromCsv(text: string) {
  const matrix = parseCsvText(text);
  if (matrix.length < 2) {
    window.dispatchEvent(
      new CustomEvent('toast', {
        detail: { type: 'warning', title: '无法导入', message: 'CSV 无数据行或格式不正确' },
      })
    );
    return;
  }
  const headers = matrix[0].map((h) => h.trim());
  const hmap = headerIndexMap(headers);
  if (!hmap.has('任务标题')) {
    window.dispatchEvent(
      new CustomEvent('toast', {
        detail: { type: 'warning', title: '无法导入', message: '缺少「任务标题」列，请使用本页导出的 CSV' },
      })
    );
    return;
  }

  let ok = 0;
  let fail = 0;
  let lastErr = '';
  for (let r = 1; r < matrix.length; r++) {
    const cells = matrix[r];
    const rec: Record<string, string> = {};
    headers.forEach((h, j) => {
      rec[h] = cells[j] ?? '';
    });
    const body = buildCreateBodyFromCsvRow(rec);
    if (!body) continue;
    try {
      const created = await taskApi.createTask(body);
      await taskApi.archiveTask(created.id);
      ok++;
    } catch (e) {
      fail++;
      lastErr = (e as Error)?.message || String(e);
    }
  }

  if (ok === 0 && fail === 0) {
    window.dispatchEvent(
      new CustomEvent('toast', {
        detail: { type: 'warning', title: '未导入', message: '没有可创建的任务（任务标题为空）' },
      })
    );
    return;
  }

  await loadArchived();
  window.dispatchEvent(new CustomEvent('refresh-view'));

  const msg =
    fail === 0
      ? `成功导入并归档 ${ok} 条`
      : `成功 ${ok} 条，失败 ${fail} 条${lastErr ? `（${lastErr}）` : ''}`;
  window.dispatchEvent(
    new CustomEvent('toast', {
      detail: { type: fail === 0 ? 'success' : 'warning', title: '导入结束', message: msg },
    })
  );
}

async function onCsvImportFile(ev: Event) {
  const input = ev.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  importing.value = true;
  try {
    const text = await file.text();
    await importArchivedTasksFromCsv(text);
  } catch (e) {
    window.dispatchEvent(
      new CustomEvent('toast', {
        detail: { type: 'error', title: '读取失败', message: (e as Error)?.message || '无法读取文件' },
      })
    );
  } finally {
    importing.value = false;
  }
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeCsv(val: string): string {
  if (val == null) return '';
  const s = String(val);
  if (/[,\r\n"]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function handleDeleteSelectedClick() {
  if (selectedIds.value.size === 0) return;
  showDeleteConfirm.value = true;
}

async function handleDeleteSelectedConfirm() {
  showDeleteConfirm.value = false;
  const ids = [...selectedIds.value];
  if (!ids.length) return;
  const idSet = new Set(ids);
  const list = archivedTasks.value.filter(t => idSet.has(t.id));
  deletingAll.value = true;
  let failed = 0;
  try {
    const deletedIds = new Set<number>();
    for (const task of list) {
      try {
        await taskApi.deleteTask(task.id);
        deletedIds.add(task.id);
      } catch {
        failed++;
      }
    }
    archivedTasks.value = archivedTasks.value.filter(t => !deletedIds.has(t.id));
    const nextSelected = new Set(selectedIds.value);
    deletedIds.forEach(id => nextSelected.delete(id));
    selectedIds.value = nextSelected;
    window.dispatchEvent(new CustomEvent('refresh-view'));
    const successCount = deletedIds.size;
    if (failed === 0) {
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { type: 'success', title: '已删除', message: `已删除 ${successCount} 条归档任务` },
      }));
    } else {
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { type: 'warning', title: '部分删除失败', message: `成功 ${successCount} 条，失败 ${failed} 条` },
      }));
    }
  } finally {
    deletingAll.value = false;
  }
}

function onRefresh(e: Event) {
  const d = (e as CustomEvent).detail;
  if (!d?.view || d.view === 'Archive') loadArchived();
}

function onTaskArchivedOrDeleted() {
  loadArchived();
}

onMounted(() => {
  loadArchived();
  window.addEventListener('refresh-view', onRefresh);
  window.addEventListener('task-deleted', onTaskArchivedOrDeleted);
});

onUnmounted(() => {
  window.removeEventListener('refresh-view', onRefresh);
  window.removeEventListener('task-deleted', onTaskArchivedOrDeleted);
});
</script>

<style scoped>
@import '../styles/components.css';

.csv-import-input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
  overflow: hidden;
}

.archive-page {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: var(--spacing-lg);
  box-sizing: border-box;
  gap: var(--spacing-lg);
}

.page-header {
  flex-shrink: 0;
  margin-bottom: 0;
}

/* 与主布局 content-main-router 衔接：占满剩余高度并可滚动 */
.archive-body {
  flex: 1;
  min-height: 0;
  overflow-x: auto;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.page-title-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.page-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
}

.page-desc-inline {
  font-size: var(--font-size-base);
  color: var(--text-secondary);
}

.page-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.page-actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

.btn-action {
  padding: 8px 16px;
  border-radius: var(--radius-sm, 8px);
  font-size: var(--font-size-base);
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
  border: 1px solid var(--border-medium);
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.btn-action:hover:not(:disabled) {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

.btn-action:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-export:hover:not(:disabled) {
  border-color: var(--color-status-done, #22c55e);
  color: var(--color-status-done, #22c55e);
}

.btn-delete-all:hover:not(:disabled) {
  border-color: #ef4444;
  color: #ef4444;
}

.archive-filters {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.archive-filters .filter-select,
.archive-filters .filter-input {
  max-width: 100%;
}

.empty-state-filtered {
  padding: 32px 24px;
}

.loading {
  display: flex;
  justify-content: center;
  padding: 48px;
}

.empty-state {
  text-align: center;
  padding: 48px 24px;
}

.empty-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  color: var(--text-tertiary);
}

.empty-icon svg {
  width: 100%;
  height: 100%;
}

.empty-text {
  margin: 0;
  font-size: var(--font-size-base);
  color: var(--text-secondary);
}

.empty-hint {
  margin: 8px 0 16px;
  font-size: var(--font-size-small);
  color: var(--text-tertiary);
}

.empty-state-error .empty-icon {
  color: var(--warning, #f59e0b);
}

.btn-retry {
  padding: 8px 20px;
  font-size: var(--font-size-base);
  border: 1px solid var(--accent-primary);
  background: transparent;
  color: var(--accent-primary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.btn-retry:hover {
  background: var(--accent-primary);
  color: var(--primary-foreground, #fff);
}

.archive-table-wrap {
  border-radius: var(--radius-md, 12px);
  border: 1px solid var(--border-subtle);
  background: var(--bg-secondary);
  overflow-x: auto;
}

.archive-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: auto;
}

.archive-table th,
.archive-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid var(--border-subtle);
  white-space: nowrap;
}

.archive-table thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  font-size: var(--font-size-small);
  font-weight: 600;
  color: var(--text-secondary);
  background: var(--bg-tertiary);
  box-shadow: 0 1px 0 var(--border-subtle);
}

.archive-table tbody tr:last-child td {
  border-bottom: none;
}

.archive-row:hover {
  background: var(--bg-hover, rgba(0, 0, 0, 0.02));
}

[data-theme="dark"] .archive-row:hover {
  background: var(--bg-hover, rgba(255, 255, 255, 0.04));
}

.col-checkbox {
  width: 44px;
  min-width: 44px;
  text-align: center;
  vertical-align: middle;
}

.col-checkbox input[type="checkbox"] {
  cursor: pointer;
}

.col-title {
  min-width: 120px;
  max-width: 40vw;
}

.col-title .row-title {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}
.col-project { min-width: 100px; }
.col-completed { min-width: 140px; }
.col-archived { min-width: 140px; }
.col-actions { min-width: 80px; }

.row-title {
  cursor: pointer;
  color: var(--text-primary);
}

.row-title:hover {
  color: var(--accent-primary);
  text-decoration: underline;
}

.btn-restore {
  padding: 6px 12px;
  border: 1px solid var(--accent-primary);
  border-radius: var(--radius-sm, 8px);
  background: transparent;
  color: var(--accent-primary);
  font-size: var(--font-size-small);
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.btn-restore:hover:not(:disabled) {
  background: var(--accent-primary);
  color: #fff;
}

.btn-restore:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
