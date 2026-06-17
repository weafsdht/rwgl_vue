<template>
  <div class="dash">
    <!-- 顶部状态栏 -->
    <header class="dash-header">
      <div class="header-left">
        <span class="header-logo">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#2dd4bf" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-5"/></svg>
        </span>
        <div class="status-dots">
          <span class="status-dot-item"><i class="sd sd--todo"></i>待办</span>
          <span class="status-dot-item"><i class="sd sd--doing"></i>进行中</span>
          <span class="status-dot-item"><i class="sd sd--done"></i>已完成</span>
          <span class="status-dot-item"><i class="sd sd--stalled"></i>搁置</span>
          <span class="status-dot-item"><i class="sd sd--overdue"></i>逾期</span>
        </div>
      </div>
      <div class="header-right">
        <span class="header-time">{{ currentTime }}</span>
        <span class="header-date">{{ currentDate }}</span>
      </div>
    </header>

    <!-- 主体：左侧内容区 + 右侧面板 -->
    <div class="dash-body">
      <!-- ===== 左侧区域 ===== -->
      <div class="dash-main">
        <!-- 统计卡片行 -->
        <div class="stat-row">
          <div class="s-card s-card--total" @click="$router.push('/tasks')">
            <div class="s-card-top">
              <span class="s-card-label">总任务</span>
              <span class="s-card-badge">ALL</span>
            </div>
            <div class="s-card-num">{{ statTotalTasks }}</div>
            <div class="s-card-chart"><v-chart :option="miniLineOpt(statTotalTasks, '#2dd4bf')" style="height:44px;width:100%" /></div>
          </div>
          <div class="s-card s-card--doing" @click="$router.push('/board')">
            <div class="s-card-top">
              <span class="s-card-label">进行中</span>
              <span class="s-card-badge doing-badge">DOING</span>
            </div>
            <div class="s-card-num">{{ doingCount }}</div>
            <div class="s-card-chart"><v-chart :option="miniLineOpt(doingCount, '#f59e0b')" style="height:44px;width:100%" /></div>
          </div>
          <div class="s-card s-card--done">
            <div class="s-card-top">
              <span class="s-card-label">今日完成</span>
              <span class="s-card-badge done-badge">TODAY</span>
            </div>
            <div class="s-card-num">{{ statTodayCompleted }}</div>
            <div class="s-card-chart"><v-chart :option="miniLineOpt(statTodayCompleted, '#22c55e')" style="height:44px;width:100%" /></div>
          </div>
          <div class="s-card s-card--assigned" @click="$router.push('/tasks')">
            <div class="s-card-top">
              <span class="s-card-label">近期指派</span>
              <span class="s-card-badge assigned-badge">3天</span>
            </div>
            <div class="s-card-num">{{ recentAssignedCount }}</div>
            <div class="s-card-chart"><v-chart :option="miniLineOpt(recentAssignedCount, '#8b5cf6')" style="height:44px;width:100%" /></div>
          </div>
        </div>

        <!-- 面板网格：状态分布 + 项目进度 + 最近动态 -->
        <div class="panel-grid">
          <!-- 任务状态 -->
          <div class="panel panel--status">
            <div class="panel-head">
              <h3>任务状态 <span class="panel-head-hint">（最近3天）</span></h3>
              <div class="chart-switch">
                <button v-for="(lb, i) in chartTypeLabels" :key="lb" type="button"
                  class="sw-btn" :class="{ active: chartTypeIndex === i }" @click="setChartType(i)">{{ lb }}</button>
              </div>
            </div>
            <div class="panel-chart"><v-chart :option="statusChartOption" style="height:240px" /></div>
          </div>

          <!-- 临期提醒（移动到中间面板网格） -->
          <div class="panel panel--urgent-grid">
            <div class="panel-head"><h3>临期提醒</h3></div>
            <div v-if="urgentTasks.length === 0" class="overdue-info">
              <span class="overdue-num">0</span>
              <span class="overdue-text">暂无临期任务，保持好状态！</span>
            </div>
            <div v-else class="urgent-list">
              <div v-for="ut in urgentTasks" :key="ut.task.id" class="urgent-item" @click="openTaskDetail(ut.task)">
                <div class="urgent-info">
                  <span class="urgent-title">{{ ut.task.title }}</span>
                  <span class="urgent-due">截止 {{ formatDate(ut.task.dueTime!) }}</span>
                </div>
                <span class="urgent-countdown" :class="{ 'is-overdue': ut.remaining <= 0 }">
                  {{ ut.remaining <= 0 ? '已逾期' : ut.label }}
                </span>
              </div>
            </div>
          </div>

          <!-- 最近动态 -->
          <div class="panel panel--activity">
            <div class="panel-head"><h3>最近动态</h3></div>
            <div class="act-list">
              <div v-for="task in recentTasks" :key="task.id" class="act-item" @click="openTaskDetail(task)">
                <i class="sd act-item-dot" :class="`sd--${normalizeTaskStatus(task.status)}`"></i>
                <div class="act-body">
                  <div class="act-line1">
                    <span class="act-title">{{ task.title }}</span>
                    <span class="act-verb">{{ activityVerb(task) }}</span>
                    <span v-if="activityAssignNote(task)" class="act-assign-note" :title="activityAssignNote(task)">{{
                      activityAssignNote(task)
                    }}</span>
                  </div>
                  <div class="act-line2">
                    <span class="act-status" :class="`act-status--${normalizeTaskStatus(task.status)}`">{{ activityStatusLabel(task) }}</span>
                    <span class="act-sep" aria-hidden="true">·</span>
                    <span class="act-time">{{ formatDate(task.updatedAt) }}</span>
                    <template v-if="activityUpdateSnippet(task)">
                      <span class="act-sep" aria-hidden="true">·</span>
                      <span class="act-update-snippet" :title="activityUpdateFullText(task)">{{ activityUpdateSnippet(task) }}</span>
                    </template>
                  </div>
                </div>
              </div>
              <div v-if="recentTasks.length === 0" class="panel-empty">暂无最近任务</div>
            </div>
          </div>
        </div>

        <!-- 底部：周趋势 + 任务状态速查 -->
        <div class="bottom-row">
          <div class="panel panel--trend">
            <div class="panel-head"><h3>本周完成趋势</h3></div>
            <div class="panel-chart"><v-chart :option="weekTrendOption" style="height:180px" /></div>
          </div>
          <!-- 任务概况（使用类似待处理数据的卡片样式，2x2布局） -->
          <div class="panel panel--quick">
            <div class="panel-head"><h3>任务概况</h3></div>
            <div class="task-overview-grid">
              <!-- 超期任务 -->
              <div class="task-card task-card--red" @click="$router.push({ path: '/tasks', query: { overdue: '1' } })">
                <div class="task-card-icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </div>
                <div class="task-card-body">
                  <div class="task-card-title">超期任务</div>
                  <div class="task-card-count">{{ statOverdueCount }}</div>
                </div>
                <span class="task-card-link">处理 &gt;</span>
              </div>
              <!-- 搁置任务 -->
              <div class="task-card task-card--orange" @click="$router.push({ path: '/tasks', query: { status: 'stalled' } })">
                <div class="task-card-icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4m0 12v4m-7.07-2.93l2.83-2.83m8.48-8.48l2.83-2.83M2 12h4m12 0h4m-2.93 7.07l-2.83-2.83M6.76 6.76L3.93 3.93"/></svg>
                </div>
                <div class="task-card-body">
                  <div class="task-card-title">搁置任务</div>
                  <div class="task-card-count">{{ statusCount.stalled }}</div>
                </div>
                <span class="task-card-link">处理 &gt;</span>
              </div>
              <!-- 待办任务 -->
              <div class="task-card task-card--blue" @click="$router.push({ path: '/tasks', query: { status: 'todo' } })">
                <div class="task-card-icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <div class="task-card-body">
                  <div class="task-card-title">待办任务</div>
                  <div class="task-card-count">{{ statusCount.todo }}</div>
                </div>
                <span class="task-card-link">处理 &gt;</span>
              </div>
              <!-- 已完成 -->
              <div class="task-card task-card--green" @click="$router.push({ path: '/tasks', query: { status: 'done' } })">
                <div class="task-card-icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
                <div class="task-card-body">
                  <div class="task-card-title">已完成</div>
                  <div class="task-card-count">{{ statusCount.done }}</div>
                </div>
                <span class="task-card-link">查看 &gt;</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== 右侧面板 ===== -->
      <aside class="dash-side">
        <!-- 完成率仪表盘 -->
        <div class="side-card side-card--gauge">
          <div class="panel-head"><h3>完成率</h3></div>
          <div class="gauge-wrap">
            <svg viewBox="0 0 120 120" class="gauge-svg">
              <circle cx="60" cy="60" r="52" fill="none" stroke-width="10"
                :stroke="isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'" />
              <circle cx="60" cy="60" r="52" fill="none" stroke-width="10"
                stroke="#2dd4bf" stroke-linecap="round"
                :stroke-dasharray="2 * Math.PI * 52"
                :stroke-dashoffset="2 * Math.PI * 52 * (1 - completionRate / 100)"
                transform="rotate(-90 60 60)" class="gauge-arc" />
              <text x="60" y="56" text-anchor="middle" class="gauge-num">{{ completionRate.toFixed(1) }}<tspan font-size="10">%</tspan></text>
              <text x="60" y="74" text-anchor="middle" class="gauge-sub">完成率</text>
            </svg>
          </div>
          <div class="gauge-legend">
            <span><i class="sd sd--done"></i> 已完成 {{ statusCount.done }}</span>
            <span><i class="sd sd--todo"></i> 待完成 {{ statusCount.todo + statusCount.doing + statusCount.stalled }}</span>
          </div>
        </div>

        <!-- 日程（移动到右侧栏） -->
        <div class="side-card side-card--schedule-side">
          <div class="panel-head"><h3>日程</h3></div>
          <div v-if="scheduleGroups.length" class="schedule-list">
            <div
              v-for="group in scheduleGroups"
              :key="group.key"
              class="schedule-group"
            >
              <div class="schedule-group-header" @click="toggleSchedule(group.key)">
                <div class="sg-left">
                  <span class="sg-date">
                    <span v-if="group.isToday" class="sg-today-badge">今天</span>
                    {{ group.label }} {{ group.weekday }}
                  </span>
                  <span class="sg-count">{{ group.total }} 个任务</span>
                </div>
                <span class="sg-toggle" :class="{ collapsed: !isScheduleExpanded(group.key) }">
                  ▾
                </span>
              </div>
              <div v-if="isScheduleExpanded(group.key)" class="schedule-group-body">
                <div
                  v-for="task in group.tasks"
                  :key="task.id"
                  class="schedule-task"
                  @click="openTaskDetail(task)"
                >
                  <i class="sd" :class="`sd--${task.status}`"></i>
                  <div class="schedule-task-main">
                    <span class="schedule-task-title">{{ task.title }}</span>
                    <span v-if="task.dueTime" class="schedule-task-meta">
                      截止 {{ formatDate(task.dueTime) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="panel-empty">今天及之后暂无安排的任务</div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, shallowRef, onMounted, onUnmounted } from 'vue';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components';
import VChart from 'vue-echarts';
import projectApi from '@/api/project';
import { useTasks } from '@/composables/useTasks';
import { useUserStore } from '@/stores/user';
import type { Project, Task, User } from '@/types';
import dayjs from 'dayjs';
import { formatDate } from '@/utils/date';
import { normalizeTaskStatus } from '@/utils/task';
import {
  buildTaskActivitySnapshot,
  diffActivitySnapshots,
  truncateActivityHint,
  type TaskActivitySnapshot,
} from '@/utils/taskActivityHint';

use([CanvasRenderer, BarChart, LineChart, PieChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent]);

const { allTasks, fetchTasks } = useTasks();
const userStore = useUserStore();

const projects = ref<Project[]>([]);
const isDark = computed(() => document.documentElement.getAttribute('data-theme') === 'dark');

const currentTime = ref(dayjs().format('HH:mm:ss'));
const currentDate = ref(dayjs().format('YYYY / MM / DD'));
let clockTimer: ReturnType<typeof setInterval> | null = null;

const doingCount = computed(() => allTasks.value.filter(t => t.status === 'doing').length);
const statusCount = computed(() => ({
  todo: allTasks.value.filter(t => t.status === 'todo').length,
  doing: allTasks.value.filter(t => t.status === 'doing').length,
  done: allTasks.value.filter(t => t.status === 'done').length,
  stalled: allTasks.value.filter(t => t.status === 'stalled').length,
}));

/** 顶部统计卡片：与任务列表同源（不依赖仅 PM 可见的 /statistics） */
const statTotalTasks = computed(() => allTasks.value.filter((t) => !t.archivedAt).length);

const statTodayCompleted = computed(() => {
  const today = dayjs().startOf('day');
  return allTasks.value.filter((t) => {
    if (t.archivedAt || normalizeTaskStatus(t.status) !== 'done') return false;
    const ts = t.completedAt || t.updatedAt;
    if (!ts) return false;
    return dayjs(ts).startOf('day').isSame(today, 'day');
  }).length;
});

const statOverdueCount = computed(() => {
  const now = Date.now();
  return allTasks.value.filter((t) => {
    if (t.archivedAt || normalizeTaskStatus(t.status) === 'done') return false;
    if (!t.dueTime) return false;
    return new Date(t.dueTime).getTime() < now;
  }).length;
});

/**
 * 任务状态图：以「最晚一条任务的创建日期」为区间终点，向前连续 3 个自然日（含首尾），
 * 仅统计在这 3 天内创建的任务；无创建时间则不计入。
 */
const tasksLast3Days = computed(() => {
  const active = allTasks.value.filter((t) => !t.archivedAt && t.createdAt);
  if (active.length === 0) return [];

  const latestCreate = Math.max(...active.map((t) => dayjs(t.createdAt).valueOf()));
  const endDay = dayjs(latestCreate).startOf('day');
  const startDay = endDay.subtract(2, 'day');

  return active.filter((t) => {
    const d = dayjs(t.createdAt).startOf('day');
    return !d.isBefore(startDay, 'day') && !d.isAfter(endDay, 'day');
  });
});

const statusCountLast3Days = computed(() => ({
  todo: tasksLast3Days.value.filter(t => t.status === 'todo').length,
  doing: tasksLast3Days.value.filter(t => t.status === 'doing').length,
  done: tasksLast3Days.value.filter(t => t.status === 'done').length,
  stalled: tasksLast3Days.value.filter(t => t.status === 'stalled').length,
}));

/** 与右侧图例一致：分母来自当前任务列表状态统计，不依赖 /statistics.totalTasks（非 PM 用户不会拉取统计，totalTasks 恒为 0 会导致完成率一直为 0） */
const completionRate = computed(() => {
  const sc = statusCount.value;
  const total = sc.todo + sc.doing + sc.done + sc.stalled;
  if (total === 0) return 0;
  return (sc.done / total) * 100;
});

interface ScheduleGroup {
  key: string;
  label: string;
  weekday: string;
  isToday: boolean;
  total: number;
  done: number;
  tasks: import('@/types').Task[];
}

const scheduleGroups = computed<ScheduleGroup[]>(() => {
  const now = dayjs();
  const todayStart = now.startOf('day');
  const list = allTasks.value.filter((t) => {
    if (t.archivedAt || !t.dueTime) return false;
    const d = dayjs(t.dueTime);
    return !d.isBefore(todayStart, 'day');
  });

  const byDate = new Map<string, { tasks: import('@/types').Task[]; isToday: boolean }>();

  list.forEach((t) => {
    const d = dayjs(t.dueTime!);
    const key = d.format('YYYY-MM-DD');
    const isToday = d.isSame(todayStart, 'day');
    if (!byDate.has(key)) byDate.set(key, { tasks: [], isToday });
    byDate.get(key)!.tasks.push(t);
  });

  const entries = Array.from(byDate.entries()).sort(([a], [b]) => a.localeCompare(b));
  entries.sort((a, b) => {
    const aToday = a[1].isToday;
    const bToday = b[1].isToday;
    if (aToday && !bToday) return -1;
    if (!aToday && bToday) return 1;
    return a[0].localeCompare(b[0]);
  });

  return entries.slice(0, 14).map(([key, value]) => {
    const d = dayjs(key);
    const total = value.tasks.length;
    const done = value.tasks.filter((t) => t.status === 'done').length;
    const weekday = d.format('ddd');
    const label = d.format('YYYY-MM-DD');
    return {
      key,
      label,
      weekday,
      isToday: value.isToday,
      total,
      done,
      tasks: value.tasks,
    };
  });
});

const expandedScheduleKeys = ref<string[]>([]);

function isScheduleExpanded(key: string): boolean {
  if (expandedScheduleKeys.value.length === 0) {
    const today = scheduleGroups.value.find((g) => g.isToday);
    if (today) {
      expandedScheduleKeys.value = [today.key];
      return today.key === key;
    }
    return true;
  }
  return expandedScheduleKeys.value.includes(key);
}

function toggleSchedule(key: string) {
  if (expandedScheduleKeys.value.includes(key)) {
    expandedScheduleKeys.value = expandedScheduleKeys.value.filter((k) => k !== key);
  } else {
    expandedScheduleKeys.value = [...expandedScheduleKeys.value, key];
  }
}

const recentTasks = computed(() =>
  [...allTasks.value].sort((a, b) => {
    const ta = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const tb = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return tb - ta;
  }).slice(0, 8)
);

/** 最近动态「更新」摘要：对比上次快照得到状态/优先级/负责人/附件/评论等变更；可选后端 activitySummary */
const taskActivitySnapshotById = new Map<number, TaskActivitySnapshot>();
const activityHintByTaskId = shallowRef(new Map<number, string>());

function syncRecentTaskActivityHints(taskList: Task[]) {
  for (const task of taskList) {
    const id = task.id;
    const cur = buildTaskActivitySnapshot(task);
    const prev = taskActivitySnapshotById.get(id);
    if (prev) {
      const msg = diffActivitySnapshots(prev, cur);
      if (msg) {
        const next = new Map(activityHintByTaskId.value);
        next.set(id, msg);
        activityHintByTaskId.value = next;
      }
    }
    taskActivitySnapshotById.set(id, cur);
  }
}

watch(
  () => recentTasks.value,
  (list) => {
    syncRecentTaskActivityHints(list);
  },
  { deep: true }
);

/** 与列表/看板一致的状态文案 */
const STATUS_LABEL: Record<Task['status'], string> = {
  todo: '待办',
  doing: '进行中',
  done: '已完成',
  stalled: '搁置',
};

type ActivityKind = 'archived' | 'created' | 'assigned' | 'updated';

function getCreatorId(task: Task): number | undefined {
  const raw = task as Task & Record<string, unknown>;
  if (task.createdById != null) return task.createdById;
  if (task.creator?.id != null) return task.creator.id;
  if (raw.created_by != null && Number.isFinite(Number(raw.created_by))) return Number(raw.created_by);
  return undefined;
}

function getPrimaryAssigneeId(task: Task): number | undefined {
  if (task.assigneeIds?.length) return task.assigneeIds[0];
  if (task.assigneeId != null) return task.assigneeId;
  return task.assignee?.id;
}

/** 仅一名负责人且与创建人相同时：自建任务，不归类为「指派」。无创建人字段时，若当前用户为唯一负责人也视为自建 */
function creatorAndAssigneeAreSame(task: Task): boolean {
  const cid = getCreatorId(task);
  const me = userStore.user?.id;
  if (task.assigneeIds?.length) {
    const ids = [...new Set(task.assigneeIds)];
    if (ids.length !== 1) return false;
    const only = ids[0];
    if (cid != null) return only === cid;
    if (me != null && only === me) return true;
    return false;
  }
  const aid = task.assigneeId ?? task.assignee?.id;
  if (aid == null) return false;
  if (cid != null) return aid === cid;
  if (me != null && aid === me) return true;
  return false;
}

function activityKind(task: Task): ActivityKind {
  if (task.archivedAt) return 'archived';
  const c = task.createdAt ? dayjs(task.createdAt).valueOf() : 0;
  const u = task.updatedAt ? dayjs(task.updatedAt).valueOf() : 0;
  const delta = c && u ? u - c : 0;
  const hasAssignee = getPrimaryAssigneeId(task) != null;

  if (creatorAndAssigneeAreSame(task)) {
    if (c && u && delta >= 0 && delta < 120000) return 'created';
    return 'updated';
  }
  if (c && u && delta >= 0 && delta < 120000) return 'created';
  const assignWindow = 86400000 * 3;
  if (hasAssignee && delta >= 120000 && delta <= assignWindow) return 'assigned';
  return 'updated';
}

/**
 * 最近动态的操作类型（无单独审计接口时，由创建/更新时间与负责人推断；指派展示指派人→负责人）
 */
function activityVerb(task: Task): string {
  const k = activityKind(task);
  if (k === 'archived') return '已归档';
  if (k === 'created') return '创建';
  if (k === 'assigned') return '指派';
  return '更新';
}

function userBrief(u: User | undefined, id: number | undefined, currentUid: number | undefined): string {
  if (u && currentUid != null && u.id === currentUid) return '我';
  const s = u?.nickname?.trim() || u?.username?.trim() || u?.email?.trim();
  if (s) return s;
  if (id != null) return `用户${id}`;
  return '';
}

const ACTIVITY_UPDATE_SNIPPET_MAX = 56;

function activityUpdateSnippet(task: Task): string {
  if (activityKind(task) !== 'updated') return '';
  const api = task.activitySummary?.trim();
  if (api) return truncateActivityHint(api, ACTIVITY_UPDATE_SNIPPET_MAX);
  const hint = activityHintByTaskId.value.get(task.id);
  if (hint) return truncateActivityHint(hint, ACTIVITY_UPDATE_SNIPPET_MAX);
  return '';
}

function activityUpdateFullText(task: Task): string {
  if (activityKind(task) !== 'updated') return '';
  if (task.activitySummary?.trim()) return task.activitySummary.trim();
  return activityHintByTaskId.value.get(task.id) ?? '';
}

/** 指派时展示：由谁指派给谁（优先接口 assignedBy，否则用创建人作为指派人） */
function activityAssignNote(task: Task): string {
  if (activityKind(task) !== 'assigned') return '';
  const uid = userStore.user?.id;
  const assignerUser = task.assignedBy ?? task.creator;
  const assignerId =
    task.assignedById ?? task.assignedBy?.id ?? task.createdById ?? task.creator?.id ?? getCreatorId(task);
  const assigneeUser = task.assignee ?? task.assignees?.[0];
  const assigneeId = getPrimaryAssigneeId(task);
  const from = userBrief(assignerUser, assignerId, uid);
  const to = userBrief(assigneeUser, assigneeId, uid);
  if (from && to) return `由 ${from} 指派给 ${to}`;
  if (to) return `指派给 ${to}`;
  return '';
}

function activityStatusLabel(task: Task): string {
  return STATUS_LABEL[normalizeTaskStatus(task.status)] ?? '待办';
}

const recentAssignedCount = computed(() => {
  const uid = userStore.user?.id;
  if (!uid) return 0;
  const threeDaysAgo = new Date(Date.now() - 3 * 86400000);
  return allTasks.value.filter(t => {
    if (t.archivedAt) return false;
    const created = t.createdAt ? new Date(t.createdAt) : null;
    if (!created || created < threeDaysAgo) return false;
    const isAssigned = t.assigneeId === uid || (t.assigneeIds?.includes(uid));
    return isAssigned;
  }).length;
});

const urgentTasks = computed(() => {
  const now = Date.now();
  const threeDaysMs = 3 * 86400000;
  return allTasks.value
    .filter(t => {
      if (t.archivedAt || t.status === 'done') return false;
      if (!t.dueTime) return false;
      const remaining = new Date(t.dueTime).getTime() - now;
      return remaining <= threeDaysMs;
    })
    .map(t => {
      const remaining = new Date(t.dueTime!).getTime() - now;
      let label = '';
      if (remaining <= 0) {
        label = '已逾期';
      } else {
        const hours = Math.floor(remaining / 3600000);
        const days = Math.floor(hours / 24);
        const h = hours % 24;
        if (days > 0) label = `${days}天${h}小时`;
        else if (hours > 0) label = `${hours}小时`;
        else label = `${Math.max(1, Math.ceil(remaining / 60000))}分钟`;
      }
      return { task: t, remaining, label };
    })
    .sort((a, b) => a.remaining - b.remaining)
    .slice(0, 8);
});

function openTaskDetail(task: import('@/types').Task) {
  window.dispatchEvent(new CustomEvent('open-edit-task', { detail: { task } }));
}

/* --- Charts --- */
function niceInterval(max: number): number {
  if (max <= 5) return 1;
  if (max <= 10) return 2;
  if (max <= 25) return 5;
  if (max <= 50) return 10;
  if (max <= 100) return 20;
  const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
  const fraction = max / magnitude;
  if (fraction <= 2) return magnitude / 2;
  if (fraction <= 5) return magnitude;
  return magnitude * 2;
}

const chartTypeIndex = ref(0);
const chartTypes = ['bar', 'line', 'pie'];
const chartTypeLabels = ['柱状', '折线', '饼图'];
let chartInterval: ReturnType<typeof setInterval> | null = null;

function startChartInterval() {
  if (chartInterval) clearInterval(chartInterval);
  chartInterval = setInterval(() => { chartTypeIndex.value = (chartTypeIndex.value + 1) % chartTypes.length; }, 15000);
}
function setChartType(i: number) { chartTypeIndex.value = i; startChartInterval(); }

function miniLineOpt(base: number, color: string) {
  const data: number[] = [];
  for (let i = 0; i < 7; i++) data.push(Math.max(0, Math.round(base + (Math.random() - 0.4) * base * 0.5)));
  return {
    animation: false, tooltip: { show: false },
    grid: { left: 0, right: 0, top: 0, bottom: 0 },
    xAxis: { show: false, type: 'category', data: data.map((_, i) => i) },
    yAxis: { show: false, type: 'value', min: 0, max: Math.max(...data, 1) * 1.3 },
    series: [{ type: 'line', data, smooth: true, symbol: 'none', lineStyle: { color, width: 2 },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [{ offset: 0, color: color + '30' }, { offset: 1, color: color + '05' }] } } }],
  };
}

const statusChartOption = computed(() => {
  const dk = isDark.value;
  const sc = statusCountLast3Days.value;
  const cats = ['待办', '进行中', '已完成', '搁置'];
  const vals = [sc.todo, sc.doing, sc.done, sc.stalled];
  const colors = ['#3b82f6', '#f59e0b', '#22c55e', '#94a3b8'];
  const tt = { trigger: 'item' as const, backgroundColor: dk ? '#1e1e22' : '#fff', borderRadius: 8,
    textStyle: { color: dk ? '#e5e5e5' : '#333' } };
  const maxVal = Math.max(...vals, 3);
  const yInterval = niceInterval(maxVal);
  const yMax = Math.ceil(maxVal / yInterval) * yInterval;
  const type = chartTypes[chartTypeIndex.value];

  if (type === 'bar') return {
    tooltip: { ...tt, trigger: 'axis' as const }, backgroundColor: 'transparent', color: colors,
    grid: { left: 40, right: 16, top: 16, bottom: 36 },
    xAxis: {
      type: 'category',
      data: cats,
      axisLine: { lineStyle: { color: dk ? '#444' : '#ddd' } },
      axisLabel: { color: dk ? '#aaa' : '#666', interval: 0 },
    },
    yAxis: { type: 'value', min: 0, max: yMax, interval: yInterval, axisLine: { show: false },
      splitLine: { lineStyle: { color: dk ? '#333' : '#f0f0f0' } }, axisLabel: { color: dk ? '#aaa' : '#999' } },
    series: [{ type: 'bar', data: vals.map((v, i) => ({ value: v, itemStyle: { borderRadius: [6, 6, 0, 0], color: colors[i] } })), barWidth: '50%' }],
  };
  if (type === 'line') return {
    tooltip: { ...tt, trigger: 'axis' as const }, backgroundColor: 'transparent',
    grid: { left: 40, right: 16, top: 16, bottom: 36 },
    xAxis: {
      type: 'category',
      data: cats,
      axisLine: { lineStyle: { color: dk ? '#444' : '#ddd' } },
      axisLabel: { color: dk ? '#aaa' : '#666', interval: 0 },
    },
    yAxis: { type: 'value', min: 0, max: yMax, interval: yInterval, axisLine: { show: false },
      splitLine: { lineStyle: { color: dk ? '#333' : '#f0f0f0' } }, axisLabel: { color: dk ? '#aaa' : '#999' } },
    series: [{ type: 'line', data: vals, smooth: true, symbol: 'circle', symbolSize: 8,
      lineStyle: { color: '#2dd4bf', width: 2.5 }, itemStyle: { color: '#2dd4bf' },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [{ offset: 0, color: 'rgba(45,212,191,0.25)' }, { offset: 1, color: 'rgba(45,212,191,0)' }] } } }],
  };
  return { tooltip: tt, backgroundColor: 'transparent', color: colors,
    series: [{ type: 'pie', radius: ['42%', '70%'], avoidLabelOverlap: false,
      itemStyle: { borderRadius: 6, borderColor: dk ? '#1e1e22' : '#fff', borderWidth: 2 },
      label: { color: dk ? '#ccc' : '#555', fontSize: 12 },
      data: cats.map((n, i) => ({ value: vals[i], name: n, itemStyle: { color: colors[i] } })) }] };
});

/** 本周一 00:00（与「周一…周日」图轴对齐） */
function startOfWeekMonday(base: dayjs.Dayjs) {
  const dow = base.day();
  const offset = dow === 0 ? -6 : 1 - dow;
  return base.add(offset, 'day').startOf('day');
}

/**
 * 本周完成趋势：以「今天」所在自然周（周一 00:00～周日）为横轴，按完成日落点。
 * 完成日取 completedAt，无则取 updatedAt；与任务列表同源。
 */
const weekCompletedFromTasks = computed(() => {
  const monday = startOfWeekMonday(dayjs());
  const counts: number[] = [];
  for (let i = 0; i < 7; i++) {
    const day = monday.add(i, 'day').startOf('day');
    let n = 0;
    for (const t of allTasks.value) {
      if (t.archivedAt || normalizeTaskStatus(t.status) !== 'done') continue;
      const ts = t.completedAt || t.updatedAt;
      if (!ts) continue;
      const d = dayjs(ts).startOf('day');
      if (d.isSame(day, 'day')) n += 1;
    }
    counts.push(n);
  }
  return counts;
});

const weekTrendOption = computed(() => {
  const dk = isDark.value;
  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const data = weekCompletedFromTasks.value;
  const mx = Math.max(...data, 3);
  const yi = niceInterval(mx);
  const ym = Math.ceil(mx / yi) * yi;
  return {
    tooltip: { trigger: 'axis' as const, backgroundColor: dk ? '#1e1e22' : '#fff', borderRadius: 8, textStyle: { color: dk ? '#e5e5e5' : '#333' } },
    backgroundColor: 'transparent',
    grid: { left: 36, right: 12, top: 12, bottom: 30 },
    xAxis: { type: 'category', data: days, axisLine: { lineStyle: { color: dk ? '#444' : '#ddd' } }, axisLabel: { color: dk ? '#aaa' : '#666', fontSize: 11 } },
    yAxis: { type: 'value', min: 0, max: ym, interval: yi, axisLine: { show: false },
      splitLine: { lineStyle: { color: dk ? '#333' : '#f0f0f0' } }, axisLabel: { color: dk ? '#aaa' : '#999', fontSize: 11 } },
    series: [{ type: 'line', data, smooth: true, symbol: 'circle', symbolSize: 6,
      lineStyle: { color: '#2dd4bf', width: 2.5 }, itemStyle: { color: '#2dd4bf' },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [{ offset: 0, color: 'rgba(45,212,191,0.3)' }, { offset: 1, color: 'rgba(45,212,191,0)' }] } } }],
  };
});

/* --- Lifecycle --- */
function doRefresh() {
  fetchTasks(undefined, { skipGlobalError: true }).catch(() => {});
  projectApi.getProjects().then(l => { projects.value = l ?? []; }).catch(() => {});
}

function onTaskCreated() { doRefresh(); }
function onTaskUpdated() { doRefresh(); }
function onRefreshView(e: Event) {
  const d = (e as CustomEvent).detail;
  if (!d?.view || d.view === 'Dashboard') doRefresh();
}

onMounted(async () => {
  doRefresh();
  startChartInterval();
  clockTimer = setInterval(() => {
    currentTime.value = dayjs().format('HH:mm:ss');
    currentDate.value = dayjs().format('YYYY / MM / DD');
  }, 1000);
  window.addEventListener('task-created', onTaskCreated);
  window.addEventListener('task-updated', onTaskUpdated);
  window.addEventListener('task-deleted', onTaskUpdated);
  window.addEventListener('refresh-view', onRefreshView);
});

onUnmounted(() => {
  if (chartInterval) clearInterval(chartInterval);
  if (clockTimer) clearInterval(clockTimer);
  window.removeEventListener('task-created', onTaskCreated);
  window.removeEventListener('task-updated', onTaskUpdated);
  window.removeEventListener('task-deleted', onTaskUpdated);
  window.removeEventListener('refresh-view', onRefreshView);
});
</script>

<style scoped>
/* ===== 全局 ===== */
.dash {
  --teal: #2dd4bf; --teal-light: #99f6e4; --teal-dark: #0d9488;
  padding: 0; height: 100%; display: flex; flex-direction: column;
  background: var(--bg-primary); overflow: hidden;
}

/* ===== 顶部状态栏 ===== */
.dash-header {
  flex-shrink: 0; display: flex; align-items: center; justify-content: space-between;
  padding: 10px 24px; background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-subtle);
}
.header-left { display: flex; align-items: center; gap: 16px; }
.header-logo { display: flex; align-items: center; }
.status-dots { display: flex; gap: 14px; }
.status-dot-item { display: flex; align-items: center; gap: 5px; font-size: 12px; color: var(--text-secondary); }
.sd { width: 10px; height: 10px; border-radius: 50%; display: inline-block; flex-shrink: 0; }
.sd--todo { background: #3b82f6; }
.sd--doing { background: #f59e0b; }
.sd--done { background: #22c55e; }
.sd--stalled { background: #94a3b8; }
.sd--overdue { background: #ef4444; }

.header-right { display: flex; align-items: baseline; gap: 12px; }
.header-time { font-size: 20px; font-weight: 700; color: var(--text-primary); letter-spacing: 0.04em; }
.header-date { font-size: 13px; color: var(--text-secondary); }

/* ===== 主体布局 ===== */
.dash-body {
  flex: 1; min-height: 0; display: grid;
  grid-template-columns: 1fr 280px; gap: 0;
  overflow: hidden;
}
.dash-main {
  padding: 16px 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px;
}
.dash-side {
  padding: 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px;
  border-left: 1px solid var(--border-subtle); background: var(--bg-secondary);
}

/* ===== 统计卡片 ===== */
.stat-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.s-card {
  position: relative; border-radius: 14px; padding: 16px 18px; overflow: hidden;
  cursor: pointer; transition: transform 0.15s, box-shadow 0.15s;
  background: var(--bg-secondary); border: 1px solid var(--border-subtle);
}
.s-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.08); }
.s-card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.s-card-label { font-size: 13px; font-weight: 500; color: var(--text-secondary); }
.s-card-badge {
  font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 10px;
  background: rgba(45,212,191,0.12); color: var(--teal);
}
.doing-badge { background: rgba(245,158,11,0.12); color: #f59e0b; }
.done-badge { background: rgba(34,197,94,0.12); color: #22c55e; }
.overdue-badge { background: rgba(239,68,68,0.12); color: #ef4444; }
.assigned-badge { background: rgba(139,92,246,0.12); color: #8b5cf6; }
.s-card-num { font-size: 32px; font-weight: 700; color: var(--text-primary); line-height: 1.2; }
.s-card-chart { position: absolute; bottom: 0; left: 0; right: 0; height: 44px; opacity: 0.5; pointer-events: none; }

/* ===== 面板通用 ===== */
.panel, .side-card {
  background: var(--bg-secondary); border-radius: 14px; padding: 16px;
  border: 1px solid var(--border-subtle);
}
.panel-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.panel-head h3 { margin: 0; font-size: 15px; font-weight: 600; color: var(--text-primary); }
.panel-head-hint { font-size: 12px; font-weight: 400; color: var(--text-tertiary); }
.panel-empty { text-align: center; padding: 20px; color: var(--text-tertiary); font-size: 13px; }

/* ===== 面板网格 ===== */
.panel-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }

/* ===== 图表切换按钮 ===== */
.chart-switch { display: flex; gap: 4px; }
.sw-btn {
  padding: 3px 10px; font-size: 11px; border: 1px solid var(--border-subtle);
  border-radius: 6px; background: transparent; color: var(--text-tertiary); cursor: pointer;
  transition: all 0.15s;
}
.sw-btn:hover { color: var(--teal); border-color: var(--teal); }
.sw-btn.active { background: var(--teal); color: #fff; border-color: var(--teal); }

/* ===== 日程列表 ===== */
.panel--schedule-list .panel-head {
  margin-bottom: 8px;
}
.schedule-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 260px;
  overflow-y: auto;
}
.schedule-group {
  border-radius: 10px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-secondary);
}
.schedule-group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  cursor: pointer;
}
.sg-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.sg-date {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}
.sg-today-badge {
  display: inline-block;
  margin-right: 4px;
  padding: 1px 6px;
  font-size: 11px;
  border-radius: 999px;
  background: rgba(45,212,191,0.15);
  color: var(--teal);
}
.sg-count {
  font-size: 11px;
  color: var(--text-secondary);
}
.sg-toggle {
  font-size: 14px;
  color: var(--text-tertiary);
  transition: transform 0.15s;
}
.sg-toggle.collapsed {
  transform: rotate(-90deg);
}
.schedule-group-body {
  padding: 0 6px 6px;
}
.schedule-task {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 6px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}
.schedule-task:hover {
  background: var(--bg-tertiary);
}
.schedule-task-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.schedule-task-title {
  font-size: 13px;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.schedule-task-meta {
  font-size: 11px;
  color: var(--text-tertiary);
}

/* ===== 最近动态 ===== */
.act-list { display: flex; flex-direction: column; gap: 2px; max-height: 260px; overflow-y: auto; }
.act-item {
  display: flex; align-items: flex-start; gap: 10px; padding: 6px 10px; border-radius: 8px;
  cursor: pointer; transition: background 0.15s;
}
.act-item:hover { background: var(--bg-tertiary); }
.act-item-dot { flex-shrink: 0; margin-top: 5px; }
.act-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.act-line1 {
  display: flex; align-items: baseline; gap: 6px; min-width: 0;
}
.act-title {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.act-verb {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-tertiary);
}
.act-assign-note {
  flex: 0 1 auto;
  max-width: 40%;
  font-size: 11px;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.act-line2 {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 4px;
  min-width: 0;
}
.act-status {
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 600;
  line-height: 1.2;
  padding: 1px 5px;
  border-radius: 4px;
}
.act-status--todo { background: rgba(59, 130, 246, 0.14); color: #60a5fa; }
.act-status--doing { background: rgba(245, 158, 11, 0.14); color: #fbbf24; }
.act-status--done { background: rgba(34, 197, 94, 0.14); color: #4ade80; }
.act-status--stalled { background: rgba(148, 163, 184, 0.18); color: #94a3b8; }
.act-sep { flex-shrink: 0; font-size: 11px; color: var(--text-tertiary); opacity: 0.7; }
.act-time {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.act-line2 .act-update-snippet {
  flex: 1 1 0%;
  min-width: 0;
  font-size: 11px;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ===== 底部行 ===== */
.bottom-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

/* ===== 任务概况 - 新的卡片样式（类似待处理数据，缩小版2x2） ===== */
.task-overview-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.task-card {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 12px; border-radius: 8px; cursor: pointer;
  border: 1px solid var(--border-subtle); background: var(--bg-primary);
  transition: all 0.15s;
}
.task-card:hover { border-color: #3b82f6; box-shadow: 0 2px 8px rgba(59,130,246,0.1); }
.task-card-icon {
  width: 32px; height: 32px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.task-card-icon svg { width: 16px; height: 16px; }
.task-card--red .task-card-icon { background: rgba(239,68,68,0.12); color: #ef4444; }
.task-card--orange .task-card-icon { background: rgba(249,115,22,0.12); color: #f97316; }
.task-card--blue .task-card-icon { background: rgba(59,130,246,0.12); color: #3b82f6; }
.task-card--green .task-card-icon { background: rgba(34,197,94,0.12); color: #22c55e; }
[data-theme="dark"] .task-card--red .task-card-icon { background: rgba(239,68,68,0.15); }
[data-theme="dark"] .task-card--orange .task-card-icon { background: rgba(249,115,22,0.15); }
[data-theme="dark"] .task-card--blue .task-card-icon { background: rgba(59,130,246,0.15); }
[data-theme="dark"] .task-card--green .task-card-icon { background: rgba(34,197,94,0.15); }
.task-card-body { flex: 1; }
.task-card-title { font-size: 12px; color: var(--text-secondary); }
.task-card-count { font-size: 18px; font-weight: 700; color: var(--text-primary); margin-top: 2px; }
.task-card-link { font-size: 11px; color: #3b82f6; white-space: nowrap; }

/* ===== 右侧 - 仪表盘 ===== */
.gauge-wrap { display: flex; justify-content: center; padding: 8px 0; }
.gauge-svg { width: 140px; height: 140px; }
.gauge-arc { transition: stroke-dashoffset 0.8s ease; }
.gauge-num { font-size: 24px; font-weight: 700; fill: var(--text-primary); }
.gauge-sub { font-size: 11px; fill: var(--text-tertiary); }
.gauge-legend { display: flex; justify-content: center; gap: 16px; font-size: 12px; color: var(--text-secondary); }
.gauge-legend span { display: flex; align-items: center; gap: 5px; }

/* ===== 右侧 - 状态分布 ===== */
.status-bars { display: flex; flex-direction: column; gap: 12px; }
.sb-row { display: flex; align-items: center; gap: 8px; }
.sb-label { width: 48px; font-size: 12px; color: var(--text-secondary); text-align: right; }
.sb-track { flex: 1; height: 10px; border-radius: 5px; background: var(--bg-tertiary, #f1f5f9); overflow: hidden; }
.sb-fill { height: 100%; border-radius: 5px; transition: width 0.5s; }
.sb-fill--todo { background: #3b82f6; }
.sb-fill--doing { background: #f59e0b; }
.sb-fill--done { background: #22c55e; }
.sb-fill--stalled { background: #94a3b8; }
.sb-val { min-width: 20px; font-size: 12px; font-weight: 600; color: var(--text-primary); }

/* ===== 右侧 - 临期提醒 ===== */
.overdue-info { text-align: center; padding: 12px 0; }
.overdue-num { display: block; font-size: 36px; font-weight: 700; color: var(--text-primary); }
.overdue-num.danger { color: #ef4444; }
.overdue-text { font-size: 12px; color: var(--text-secondary); }

.urgent-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 360px;
  overflow-y: auto;
}
.urgent-item {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 8px 10px; border-radius: 8px; cursor: pointer; transition: background 0.15s;
}
.urgent-item:hover { background: var(--bg-tertiary); }
.urgent-info { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.urgent-title { font-size: 13px; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.urgent-due { font-size: 11px; color: var(--text-tertiary); }
.urgent-countdown {
  flex-shrink: 0; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 6px;
  background: rgba(245,158,11,0.1); color: #f59e0b; white-space: nowrap;
}
.urgent-countdown.is-overdue { background: rgba(239,68,68,0.1); color: #ef4444; }

/* ===== 暗色模式微调 ===== */
[data-theme="dark"] .dash-header { background: var(--bg-secondary); border-color: rgba(255,255,255,0.06); }
[data-theme="dark"] .s-card { border-color: rgba(255,255,255,0.06); }
[data-theme="dark"] .s-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.3); }
[data-theme="dark"] .panel, [data-theme="dark"] .side-card { border-color: rgba(255,255,255,0.06); }
[data-theme="dark"] .dash-side { border-color: rgba(255,255,255,0.06); }
[data-theme="dark"] .qi--todo { background: rgba(59,130,246,0.15); }
[data-theme="dark"] .qi--doing { background: rgba(245,158,11,0.15); }
[data-theme="dark"] .qi--done { background: rgba(34,197,94,0.15); }
[data-theme="dark"] .qi--stalled { background: rgba(148,163,184,0.15); }

/* ===== 响应式 ===== */
@media (max-width: 1100px) {
  .dash-body { grid-template-columns: 1fr; }
  .dash-side { border-left: none; border-top: 1px solid var(--border-subtle); flex-direction: row; flex-wrap: wrap; gap: 14px; }
  .side-card { flex: 1; min-width: 200px; }
}
@media (max-width: 900px) {
  .stat-row { grid-template-columns: repeat(2, 1fr); }
  .panel-grid { grid-template-columns: 1fr; }
  .bottom-row { grid-template-columns: 1fr; }
}
@media (max-width: 600px) {
  .stat-row { grid-template-columns: 1fr; }
  .status-dots { display: none; }
}
</style>
