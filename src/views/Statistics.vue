<template>
  <div class="statistics-page">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">统计分析</h1>
      </div>
      <div class="header-right">
        <label class="scope-label">团队</label>
        <select v-model="selectedTeamId" class="scope-select">
          <option :value="null">全部</option>
          <option v-for="t in teams" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select>

        <span class="header-divider"></span>

        <label class="scope-label">时间</label>
        <div class="time-filter">
          <button v-for="btn in timeShortcuts" :key="btn.key" type="button"
            class="time-btn" :class="{ active: timeMode === btn.key }"
            @click="onTimeShortcut(btn.key)">{{ btn.label }}</button>
        </div>
        <n-date-picker
          v-model:value="dateRange"
          type="daterange"
          clearable
          size="small"
          :style="{ width: '240px' }"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          @update:value="onDateRangeChange"
        />

        <button type="button" class="action-link" @click="loadData">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          刷新
        </button>
      </div>
    </div>

    <div v-if="loading" class="stats-loading">
      <div class="loader-ring"></div>
      <span>加载中...</span>
    </div>

    <div v-else class="stats-body">
      <!-- 顶部概览卡片 -->
      <div class="summary-row">
        <div class="summary-card summary-card--blue summary-card--clickable" @click="$router.push('/tasks')">
          <div class="summary-content">
            <span class="summary-label">任务 &gt;</span>
            <div class="summary-number">{{ totalTasks }}</div>
          </div>
          <div class="summary-icon">
            <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#fff" stroke-width="1.5"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg>
          </div>
        </div>
        <div class="summary-card summary-card--cyan summary-card--clickable" @click="$router.push('/projects')">
          <div class="summary-content">
            <span class="summary-label">任务 ({{ projectCount }}个项目) &gt;</span>
            <div class="summary-numbers">
              <span class="num-item"><strong>{{ statusCount.todo }}</strong><small>待办</small></span>
              <span class="num-item"><strong>{{ statusCount.doing }}</strong><small>进行中</small></span>
              <span class="num-item"><strong>{{ statusCount.done }}</strong><small>已完成</small></span>
              <span class="num-item"><strong>{{ statusCount.stalled }}</strong><small>搁置</small></span>
            </div>
          </div>
          <div class="summary-icon">
            <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#fff" stroke-width="1.5"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
          </div>
        </div>
        <div class="summary-card summary-card--purple summary-card--clickable" @click="$router.push('/teams')">
          <div class="summary-content">
            <span class="summary-label">{{ selectedTeamId == null ? '团队' : '成员' }} &gt;</span>
            <div class="summary-number">{{ selectedTeamId == null ? teams.length : memberCount }}</div>
          </div>
          <div class="summary-icon">
            <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#fff" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
        </div>
      </div>

      <!-- 中间三列：饼图 + 柱状图 + 排行 -->
      <div class="charts-row">
        <div class="chart-panel">
          <div class="panel-header">
            <h3>任务状态占比 <small>({{ timeScopeLabel }})</small></h3>
          </div>
          <div class="chart-wrap chart-wrap--pie">
            <v-chart :option="statusDistributionPieOption" class="echart" />
          </div>
        </div>
        <div class="chart-panel">
          <div class="panel-header">
            <h3>项目任务量排行 <small>(Top5)</small></h3>
          </div>
          <div class="chart-wrap chart-wrap--bar">
            <v-chart :option="projectTaskBarOption" class="echart" />
          </div>
        </div>
        <div class="chart-panel">
          <div class="panel-header">
            <h3>{{ selectedTeamId == null ? '团队排行' : '成员排行' }} <small>(Top5)</small></h3>
          </div>
          <div class="rank-table-wrap">
            <table class="rank-table">
              <thead>
                <tr>
                  <th>排行</th>
                  <th>{{ selectedTeamId == null ? '团队' : '成员' }}</th>
                  <th>任务数</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, i) in rankTop5" :key="row.name">
                  <td><span class="rank-badge" :class="'rank-' + (i + 1)">{{ i + 1 }}</span></td>
                  <td>{{ row.name }}</td>
                  <td>{{ row.count }}</td>
                </tr>
                <tr v-if="rankTop5.length === 0">
                  <td colspan="3" class="empty-cell">暂无数据</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 完成率进度条 -->
      <div class="progress-panel">
        <div class="panel-header">
          <h3>任务完成率 <small>{{ timeScopeLabel }}</small></h3>
        </div>
        <!-- 总体完成率 -->
        <div class="progress-item">
          <div class="progress-item-header">
            <span class="progress-item-label">总体</span>
            <span class="progress-item-value">{{ completionRate.toFixed(1) }}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: completionRate + '%' }"></div>
          </div>
        </div>
        <!-- 各项目完成率 -->
        <div v-for="p in projectCompletionRates" :key="p.id" class="progress-item">
          <div class="progress-item-header">
            <span class="progress-item-label">{{ p.name }}</span>
            <span class="progress-item-detail">{{ p.done }}/{{ p.total }}</span>
            <span class="progress-item-value">{{ p.rate.toFixed(1) }}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: p.rate + '%' }"></div>
          </div>
        </div>
        <div v-if="projectCompletionRates.length === 0" class="progress-empty">暂无项目数据</div>
      </div>

      <!-- 下方两列：趋势 + 超期 -->
      <div class="charts-row charts-row--2col">
        <div class="chart-panel">
          <div class="panel-header">
            <h3>本周每日完成趋势 <small>{{ timeScopeLabel }}</small></h3>
          </div>
          <div class="chart-wrap chart-wrap--line">
            <v-chart :option="weekTrendOption" class="echart" />
          </div>
        </div>
        <div class="chart-panel">
          <div class="panel-header">
            <h3>本月每日完成趋势 <small>{{ timeScopeLabel }}</small></h3>
          </div>
          <div class="chart-wrap chart-wrap--line">
            <v-chart :option="monthTrendOption" class="echart" />
          </div>
        </div>
      </div>

      <!-- 团队成员明细（选择团队时） -->
      <div v-if="selectedTeamId != null" class="chart-panel full-width">
        <div class="panel-header">
          <h3>团队成员数据 · {{ selectedTeamName }}</h3>
        </div>
        <div class="rank-table-wrap">
          <table class="rank-table">
            <thead>
              <tr>
                <th>成员</th>
                <th>总任务</th>
                <th>已完成</th>
                <th>超期</th>
                <th>完成率</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in memberStats" :key="row.userId">
                <td>{{ row.displayName }}</td>
                <td>{{ row.total }}</td>
                <td>{{ row.done }}</td>
                <td>{{ row.overdue }}</td>
                <td>{{ row.rate }}%</td>
              </tr>
              <tr v-if="memberStats.length === 0">
                <td colspan="5" class="empty-cell">暂无成员或该范围内无任务</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { PieChart, BarChart, LineChart } from 'echarts/charts';
import {
  TooltipComponent,
  GridComponent,
  LegendComponent,
} from 'echarts/components';
import VChart from 'vue-echarts';
import { useUserStore } from '@/stores/user';
import { useTasks } from '@/composables/useTasks';
import { isProjectManagerOrAdmin } from '@/constants/role';
import statisticsApi from '@/api/statistics';
import teamApi from '@/api/team';
import projectApi from '@/api/project';
import type { Statistics, Task, Team, TeamMember, Project } from '@/types';
import { NDatePicker } from 'naive-ui';
import '../styles/components.css';

use([
  CanvasRenderer,
  PieChart,
  BarChart,
  LineChart,
  TooltipComponent,
  GridComponent,
  LegendComponent,
]);

const router = useRouter();
const userStore = useUserStore();
const canView = computed(() => isProjectManagerOrAdmin(userStore.user?.role));

const { allTasks, fetchTasks } = useTasks();
const loading = ref(true);
const teams = ref<Team[]>([]);
const projects = ref<Project[]>([]);
const selectedTeamId = ref<number | null>(null);
const teamMembers = ref<TeamMember[]>([]);
const allMembers = ref<TeamMember[]>([]);

type TimeMode = 'all' | 'today' | 'last3' | 'last7' | 'month' | 'custom';
const timeMode = ref<TimeMode>('all');
const dateRange = ref<[number, number] | null>(null);

const timeShortcuts = [
  { key: 'all' as TimeMode, label: '全部' },
  { key: 'today' as TimeMode, label: '今天' },
  { key: 'last3' as TimeMode, label: '最近3天' },
  { key: 'last7' as TimeMode, label: '最近7天' },
  { key: 'month' as TimeMode, label: '本月' },
];

function getTimeBounds(): { start: Date; end: Date } | null {
  if (timeMode.value === 'all') return null;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  if (timeMode.value === 'today') return { start: todayStart, end: todayEnd };
  if (timeMode.value === 'last3') return { start: new Date(todayStart.getTime() - 2 * 86400000), end: todayEnd };
  if (timeMode.value === 'last7') return { start: new Date(todayStart.getTime() - 6 * 86400000), end: todayEnd };
  if (timeMode.value === 'month') return { start: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0), end: todayEnd };
  if (timeMode.value === 'custom' && dateRange.value) {
    return { start: new Date(dateRange.value[0]), end: new Date(dateRange.value[1] + 86400000 - 1) };
  }
  return null;
}

function onTimeShortcut(key: TimeMode) {
  timeMode.value = key;
  if (key !== 'custom') dateRange.value = null;
}
function onDateRangeChange(val: [number, number] | null) {
  if (val) { timeMode.value = 'custom'; }
  else { timeMode.value = 'all'; }
}

const statistics = ref<Statistics>({
  todayCompleted: 0,
  weekCompleted: [],
  monthCompleted: [],
  overdueCount: 0,
  totalTasks: 0,
});


const projectIdsInSelectedTeam = computed(() => {
  const tid = selectedTeamId.value;
  if (tid == null) return [];
  return projects.value.filter((p) => p.teamIds && p.teamIds.includes(tid)).map((p) => p.id);
});

const scopeTasks = computed(() => {
  const tid = selectedTeamId.value;
  const pids = projectIdsInSelectedTeam.value;
  let list = allTasks.value.filter((t) => !t.archivedAt);
  if (tid != null && pids.length > 0) {
    list = list.filter((t) => t.projectId != null && pids.includes(t.projectId));
  }
  const bounds = getTimeBounds();
  if (bounds) {
    const { start, end } = bounds;
    list = list.filter((t) => {
      const ref = t.startTime || t.createdAt;
      if (!ref) return true;
      const d = new Date(ref);
      return d >= start && d <= end;
    });
  }
  return list;
});

const scopeLabel = computed(() =>
  selectedTeamId.value != null ? selectedTeamName.value : '全部'
);
const timeScopeLabel = computed(() => {
  const team = scopeLabel.value;
  const timeLabels: Record<TimeMode, string> = {
    all: '', today: '· 今天', last3: '· 最近3天', last7: '· 最近7天', month: '· 本月', custom: '· 自定义',
  };
  return team + ' ' + (timeLabels[timeMode.value] || '');
});
const selectedTeamName = computed(
  () => teams.value.find((t) => t.id === selectedTeamId.value)?.name ?? '该团队'
);

const projectCount = computed(() => projects.value.length);

/** 成员数：选择团队时取该团队活跃成员数；否则取所有团队的不重复活跃成员 */
const memberCount = computed(() => {
  if (selectedTeamId.value != null) return teamMembers.value.filter(m => m.status === 'active').length;
  const ids = new Set<number>();
  allMembers.value.filter(m => m.status === 'active').forEach(m => ids.add(m.userId));
  return ids.size || (userStore.user ? 1 : 0);
});

const statusCount = computed(() => ({
  todo: scopeTasks.value.filter((t) => t.status === 'todo').length,
  doing: scopeTasks.value.filter((t) => t.status === 'doing').length,
  done: scopeTasks.value.filter((t) => t.status === 'done').length,
  stalled: scopeTasks.value.filter((t) => t.status === 'stalled').length,
}));

const totalTasks = computed(() => {
  const t = statistics.value.totalTasks;
  const fromScope = statusCount.value.todo + statusCount.value.doing + statusCount.value.done + statusCount.value.stalled;
  if (selectedTeamId.value != null) return fromScope;
  return t > 0 ? t : fromScope;
});
const doneCount = computed(() => statusCount.value.done);

/** 与「任务状态占比」同一批任务：用四态之和作分母，避免与 statistics.totalTasks 口径不一致 */
const totalTasksInScope = computed(
  () =>
    statusCount.value.todo +
    statusCount.value.doing +
    statusCount.value.done +
    statusCount.value.stalled
);

const completionRate = computed(() => {
  const total = totalTasksInScope.value;
  return total === 0 ? 0 : (doneCount.value / total) * 100;
});

const projectCompletionRates = computed(() => {
  const tasks = scopeTasks.value;
  return projects.value
    .map((p) => {
      const pTasks = tasks.filter((t) => t.projectId === p.id);
      const total = pTasks.length;
      const done = pTasks.filter((t) => t.status === 'done').length;
      const rate = total === 0 ? 0 : (done / total) * 100;
      return { id: p.id, name: p.name, total, done, rate };
    })
    .filter((p) => p.total > 0)
    .sort((a, b) => b.rate - a.rate);
});
const isDark = computed(() => document.documentElement.getAttribute('data-theme') === 'dark');

const thisWeekRange = computed(() => {
  const now = new Date();
  const day = now.getDay();
  const monOffset = day === 0 ? -6 : 1 - day;
  const mon = new Date(now.getFullYear(), now.getMonth(), now.getDate() + monOffset, 0, 0, 0, 0);
  const fmt = (d: Date) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  return { start: fmt(mon), end: fmt(new Date(mon.getTime() + 6 * 24 * 60 * 60 * 1000)), mon };
});

const weekCompletedFromScope = computed(() => {
  const tasks = scopeTasks.value.filter((t) => t.status === 'done');
  const range = thisWeekRange.value;
  const days: number[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(range.mon.getTime() + i * 24 * 60 * 60 * 1000);
    const dateKey = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    days.push(tasks.filter((t) => (t.completedAt || t.updatedAt || '').slice(0, 10) === dateKey).length);
  }
  return days;
});

const thisMonthStart = computed(() => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
});
const daysInMonth = computed(() => {
  const d = thisMonthStart.value;
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
});
const monthCompletedFromScope = computed(() => {
  const tasks = scopeTasks.value.filter((t) => t.status === 'done');
  const days: number[] = [];
  const n = daysInMonth.value;
  for (let i = 1; i <= n; i++) {
    const d = new Date(thisMonthStart.value.getFullYear(), thisMonthStart.value.getMonth(), i);
    const dateKey = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    days.push(tasks.filter((t) => (t.completedAt || t.updatedAt || '').slice(0, 10) === dateKey).length);
  }
  return days;
});

function isTaskAssignedToUser(task: Task, userId: number): boolean {
  if (task.assigneeId === userId) return true;
  if (task.assigneeIds && task.assigneeIds.includes(userId)) return true;
  return false;
}

const memberStats = computed(() => {
  const members = teamMembers.value.filter((m) => m.status === 'active');
  const tasks = scopeTasks.value;
  if (selectedTeamId.value == null || members.length === 0) return [];
  return members.map((m) => {
    const myTasks = tasks.filter((t) => isTaskAssignedToUser(t, m.userId));
    const total = myTasks.length;
    const done = myTasks.filter((t) => t.status === 'done').length;
    const now = new Date();
    const overdue = myTasks.filter((t) => t.status !== 'done' && t.dueTime != null && new Date(t.dueTime) < now).length;
    const rate = total === 0 ? 0 : Math.round((done / total) * 100);
    return { userId: m.userId, displayName: m.nickname || m.email || `用户 ${m.userId}`, total, done, overdue, rate };
  });
});

/** 选择"全部"时按团队排行，选择具体团队时按成员排行 */
const rankTop5 = computed(() => {
  if (selectedTeamId.value == null) {
    return teams.value.map((team) => {
      const pids = projects.value
        .filter((p) => p.teamIds && p.teamIds.includes(team.id))
        .map((p) => p.id);
      const count = allTasks.value.filter(
        (t) => !t.archivedAt && t.projectId != null && pids.includes(t.projectId)
      ).length;
      return { name: team.name, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  }
  const members = teamMembers.value.filter(m => m.status === 'active');
  const seen = new Map<number, { name: string; count: number }>();
  for (const m of members) {
    if (seen.has(m.userId)) continue;
    const name = m.nickname || m.email || `用户 ${m.userId}`;
    const count = scopeTasks.value.filter((t) => isTaskAssignedToUser(t, m.userId)).length;
    seen.set(m.userId, { name, count });
  }
  return Array.from(seen.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
});

// --- ECharts 配置 ---

const statusDistributionPieOption = computed(() => {
  const s = statusCount.value;
  const data = [
    { value: s.todo, name: '待办' },
    { value: s.doing, name: '进行中' },
    { value: s.done, name: '已完成' },
    { value: s.stalled, name: '搁置' },
  ].filter((d) => d.value > 0);
  if (data.length === 0) {
    data.push({ value: 1, name: '暂无任务' } as { value: number; name: string });
  }
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    backgroundColor: 'transparent',
    legend: { bottom: 0, textStyle: { color: isDark.value ? '#aaa' : '#666' } },
    color: ['#3b82f6', '#eab308', '#22c55e', '#94a3b8'],
    series: [{
      type: 'pie',
      radius: ['42%', '70%'],
      center: ['50%', '45%'],
      data,
      label: { show: true, formatter: '{d}%', fontSize: 11 },
      itemStyle: { borderRadius: 6, borderColor: isDark.value ? '#1a1a1e' : '#fff', borderWidth: 2 },
    }],
  };
});

const projectTaskBarOption = computed(() => {
  const list = scopeTasks.value;
  const byProject = new Map<number, number>();
  list.forEach((t) => {
    const pid = t.projectId ?? 0;
    byProject.set(pid, (byProject.get(pid) ?? 0) + 1);
  });
  const projectNames = new Map<number, string>();
  projects.value.forEach((p) => projectNames.set(p.id, p.name || `项目 ${p.id}`));
  const sorted = Array.from(byProject.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const names = sorted.map(([id]) => (id === 0 ? '未分组' : projectNames.get(id) ?? `项目 ${id}`));
  const values = sorted.map(([, v]) => v);
  const maxVal = Math.max(...values, 1);
  return {
    tooltip: { trigger: 'axis' },
    backgroundColor: 'transparent',
    color: ['#3b82f6'],
    grid: { left: '30%', right: 16, top: 8, bottom: 8 },
    xAxis: {
      type: 'value', min: 0, max: maxVal,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: isDark.value ? 'rgba(255,255,255,0.08)' : '#f0f0f0' } },
      axisLabel: { color: isDark.value ? '#aaa' : '#999' },
    },
    yAxis: {
      type: 'category', data: names.reverse(),
      axisLine: { show: false }, axisTick: { show: false },
      axisLabel: { color: isDark.value ? '#ccc' : '#333', fontSize: 12 },
    },
    series: [{
      type: 'bar', data: values.reverse(), barWidth: '55%',
      itemStyle: { borderRadius: [0, 4, 4, 0] },
    }],
  };
});

const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const weekTrendOption = computed(() => {
  const data = weekCompletedFromScope.value;
  const maxVal = Math.max(...data, 1);
  return {
    tooltip: { trigger: 'axis' },
    backgroundColor: 'transparent',
    color: ['#3b82f6'],
    grid: { left: 40, right: 16, top: 16, bottom: 32 },
    xAxis: {
      type: 'category', data: weekDays,
      axisLine: { lineStyle: { color: isDark.value ? 'rgba(255,255,255,0.2)' : '#e2e8f0' } },
      axisLabel: { color: isDark.value ? '#aaa' : '#64748b' },
    },
    yAxis: {
      type: 'value', min: 0, max: maxVal,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: isDark.value ? 'rgba(255,255,255,0.08)' : '#f0f0f0' } },
      axisLabel: { color: isDark.value ? '#aaa' : '#64748b' },
    },
    series: [{
      type: 'line', data, smooth: true, symbol: 'circle', symbolSize: 6, lineStyle: { width: 2 },
      areaStyle: {
        color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: isDark.value ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.15)' },
            { offset: 1, color: 'transparent' },
          ],
        },
      },
    }],
  };
});

const monthTrendOption = computed(() => {
  const data = monthCompletedFromScope.value;
  const n = data.length;
  const xLabels = Array.from({ length: n }, (_, i) => `${i + 1}日`);
  const maxVal = Math.max(...data, 1);
  return {
    tooltip: { trigger: 'axis' },
    backgroundColor: 'transparent',
    color: ['#10b981'],
    grid: { left: 40, right: 16, top: 16, bottom: 32 },
    xAxis: {
      type: 'category', data: xLabels,
      axisLine: { lineStyle: { color: isDark.value ? 'rgba(255,255,255,0.2)' : '#e2e8f0' } },
      axisLabel: { color: isDark.value ? '#aaa' : '#64748b', fontSize: 10, interval: Math.max(0, Math.floor(n / 15)) },
    },
    yAxis: {
      type: 'value', min: 0, max: maxVal,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: isDark.value ? 'rgba(255,255,255,0.08)' : '#f0f0f0' } },
      axisLabel: { color: isDark.value ? '#aaa' : '#64748b' },
    },
    series: [{
      type: 'line', data, smooth: true, symbol: 'circle', symbolSize: 4, lineStyle: { width: 2 },
      areaStyle: {
        color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: isDark.value ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.12)' },
            { offset: 1, color: 'transparent' },
          ],
        },
      },
    }],
  };
});

function loadData() {
  if (!canView.value) return;
  loading.value = true;
  Promise.all([
    fetchTasks(undefined, { skipGlobalError: true }),
    projectApi.getProjects().then((list) => { projects.value = list ?? []; }).catch(() => { projects.value = []; }),
    teamApi.getMyTeams().then(async (list) => {
      teams.value = list ?? [];
      const memberLists = await Promise.all(
        (list ?? []).map((t) => teamApi.getTeamMembers(t.id).catch(() => []))
      );
      const all: TeamMember[] = [];
      for (const ml of memberLists) { all.push(...(ml ?? [])); }
      allMembers.value = all;
    }).catch(() => { teams.value = []; allMembers.value = []; }),
    statisticsApi.getStatistics(undefined, { skipGlobalError: true }).then((s) => { statistics.value = s; }).catch(() => {}),
  ]).finally(() => { loading.value = false; });
}

watch(selectedTeamId, (tid) => {
  if (tid == null) { teamMembers.value = []; return; }
  teamApi.getTeamMembers(tid).then((list) => { teamMembers.value = list ?? []; }).catch(() => { teamMembers.value = []; });
}, { immediate: true });

function onTasksDataSync() {
  loadData();
}

function onRefreshStatsView(e: Event) {
  const d = (e as CustomEvent).detail as { view?: string } | undefined;
  if (d?.view != null && d.view !== 'Statistics') return;
  loadData();
}

onMounted(() => {
  if (!canView.value) { router.replace('/'); return; }
  loadData();
  window.addEventListener('task-updated', onTasksDataSync);
  window.addEventListener('task-created', onTasksDataSync);
  window.addEventListener('task-deleted', onTasksDataSync);
  window.addEventListener('refresh-view', onRefreshStatsView);
});

onUnmounted(() => {
  window.removeEventListener('task-updated', onTasksDataSync);
  window.removeEventListener('task-created', onTasksDataSync);
  window.removeEventListener('task-deleted', onTasksDataSync);
  window.removeEventListener('refresh-view', onRefreshStatsView);
});
</script>

<style scoped>
.statistics-page {
  flex: 1;
  min-height: 0;
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 0 0 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

/* 头部 */
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}
.header-left { flex: 1; }
.page-title { margin: 0; font-size: 1.5rem; font-weight: 700; color: var(--text-primary); }
.page-desc { margin: 4px 0 0; font-size: 13px; color: var(--text-tertiary); }
.header-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.scope-label { font-size: 13px; color: var(--text-secondary); }
.scope-select {
  padding: 5px 10px; border-radius: 6px; border: 1px solid var(--border-medium);
  background: var(--bg-primary); color: var(--text-primary); font-size: 13px; min-width: 120px;
}
.header-divider {
  width: 1px; height: 20px; background: var(--border-subtle); margin: 0 4px;
}
.time-filter {
  display: flex; gap: 4px;
}
.time-btn {
  padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 500;
  border: 1px solid var(--border-subtle); background: transparent; color: var(--text-secondary);
  cursor: pointer; transition: all 0.15s; white-space: nowrap;
}
.time-btn:hover { border-color: #3b82f6; color: #3b82f6; }
.time-btn.active { background: #3b82f6; color: #fff; border-color: #3b82f6; }

.action-link {
  display: inline-flex; align-items: center; gap: 4px;
  background: none; border: none; color: #3b82f6; font-size: 13px; cursor: pointer; padding: 4px 8px; border-radius: 4px;
}
.action-link:hover { background: rgba(59, 130, 246, 0.08); }

.stats-loading {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 12px; min-height: 320px; color: var(--text-secondary);
}

.stats-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1;
  min-height: 0;
}

/* 概览卡片 */
.summary-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }

.summary-card {
  border-radius: 12px; padding: 20px 24px;
  display: flex; align-items: center; justify-content: space-between;
  color: #fff; position: relative; overflow: hidden; min-height: 100px;
}
.summary-card--blue { background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); }
.summary-card--cyan { background: linear-gradient(135deg, #43e97b 0%, #38a3f8 100%); }
.summary-card--purple { background: linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%); }
.summary-card--clickable { cursor: pointer; transition: transform 0.18s, box-shadow 0.18s; }
.summary-card--clickable:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.15); }
.summary-card--clickable:active { transform: translateY(0); }

.summary-content { flex: 1; z-index: 1; }
.summary-label { font-size: 13px; opacity: 0.85; }
.summary-number { font-size: 2.2rem; font-weight: 700; margin-top: 4px; }
.summary-numbers { display: flex; gap: 16px; margin-top: 6px; }
.num-item { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.num-item strong { font-size: 1.3rem; font-weight: 700; }
.num-item small { font-size: 11px; opacity: 0.8; }
.summary-icon { opacity: 0.25; flex-shrink: 0; }

/* 图表面板 */
.charts-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.charts-row--2col { grid-template-columns: repeat(2, 1fr); }
.chart-panel, .progress-panel, .action-panel {
  background: var(--bg-secondary, #fff); border-radius: 12px; padding: 20px;
  border: 1px solid var(--border-subtle); box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}
[data-theme="dark"] .chart-panel,
[data-theme="dark"] .progress-panel,
[data-theme="dark"] .action-panel {
  background: var(--bg-secondary); box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}
.chart-panel.full-width { grid-column: 1 / -1; }

.panel-header { margin-bottom: 12px; }
.panel-header h3 { margin: 0; font-size: 15px; font-weight: 600; color: var(--text-primary); }
.panel-header small { font-size: 12px; color: var(--text-tertiary); font-weight: 400; }

.chart-wrap--pie { height: 260px; }
.chart-wrap--bar { height: 240px; }
.chart-wrap--line { height: 220px; }
.echart { width: 100%; height: 100%; }

/* 排行表 */
.rank-table-wrap { overflow-x: auto; }
.rank-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.rank-table th { text-align: left; padding: 8px 10px; color: var(--text-secondary); font-weight: 600; border-bottom: 1px solid var(--border-subtle); }
.rank-table td { padding: 8px 10px; border-bottom: 1px solid var(--border-subtle); color: var(--text-primary); }
.rank-table .empty-cell { text-align: center; color: var(--text-tertiary); padding: 24px; }

.rank-badge {
  display: inline-flex; align-items: center; justify-content: center;
  width: 22px; height: 22px; border-radius: 50%; font-size: 12px; font-weight: 700; color: #fff;
}
.rank-1 { background: #f59e0b; }
.rank-2 { background: #3b82f6; }
.rank-3 { background: #10b981; }
.rank-4, .rank-5 { background: #94a3b8; }

/* 完成率进度条 */
.progress-item { margin-bottom: 16px; }
.progress-item:last-child { margin-bottom: 0; }
.progress-item-header {
  display: flex; align-items: baseline; gap: 8px; margin-bottom: 6px;
}
.progress-item-label {
  font-size: 14px; font-weight: 600; color: var(--text-primary);
  max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.progress-item-detail { font-size: 12px; color: var(--text-tertiary); }
.progress-item-value {
  margin-left: auto; font-size: 15px; font-weight: 700; color: var(--text-primary);
}
.progress-bar {
  height: 20px; border-radius: 10px;
  background: var(--bg-tertiary, #f1f5f9); overflow: hidden;
}
.progress-fill {
  height: 100%; border-radius: 10px;
  background: linear-gradient(90deg, #3b82f6 0%, #22c55e 100%);
  transition: width 0.6s ease; min-width: 2px;
}
.progress-empty {
  text-align: center; padding: 16px 0; font-size: 13px; color: var(--text-tertiary);
}

/* 待处理数据 */
.action-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.action-card {
  display: flex; align-items: center; gap: 12px;
  padding: 16px; border-radius: 10px; cursor: pointer;
  border: 1px solid var(--border-subtle); background: var(--bg-primary);
  transition: all 0.15s;
}
.action-card:hover { border-color: #3b82f6; box-shadow: 0 2px 8px rgba(59,130,246,0.1); }
.action-card-icon {
  width: 44px; height: 44px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.action-card-icon--red { background: #fef2f2; color: #ef4444; }
.action-card-icon--orange { background: #fff7ed; color: #f97316; }
.action-card-icon--blue { background: #eff6ff; color: #3b82f6; }
.action-card-icon--green { background: #f0fdf4; color: #22c55e; }
[data-theme="dark"] .action-card-icon--red { background: rgba(239,68,68,0.12); }
[data-theme="dark"] .action-card-icon--orange { background: rgba(249,115,22,0.12); }
[data-theme="dark"] .action-card-icon--blue { background: rgba(59,130,246,0.12); }
[data-theme="dark"] .action-card-icon--green { background: rgba(34,197,94,0.12); }

.action-card-body { flex: 1; }
.action-card-title { font-size: 13px; color: var(--text-secondary); }
.action-card-count { font-size: 1.3rem; font-weight: 700; color: var(--text-primary); margin-top: 2px; }
.action-card-link { font-size: 12px; color: #3b82f6; white-space: nowrap; }

@media (max-width: 900px) {
  .summary-row { grid-template-columns: 1fr; }
  .charts-row, .charts-row--2col { grid-template-columns: 1fr; }
  .action-cards { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 600px) {
  .action-cards { grid-template-columns: 1fr; }
}
</style>
