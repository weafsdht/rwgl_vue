<template>
  <div class="project-progress-page">
    <div class="page-header">
      <div class="header-left">
        <router-link to="/projects" class="back-btn">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          返回
        </router-link>
        <h1 class="page-title">{{ project?.name ?? '项目进度' }}</h1>
      </div>
    </div>

    <div v-if="loading" class="progress-loading">
      <div class="loader-ring"></div>
      <span>加载中...</span>
    </div>

    <div v-else-if="!project" class="progress-empty">
      <p>项目不存在或暂无权限</p>
      <router-link to="/projects" class="back-btn" style="margin-top: 12px;">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        返回项目列表
      </router-link>
    </div>

    <template v-else>
      <!-- 一、进度监控 -->
      <section class="progress-section">
        <h2 class="section-title">进度监控</h2>
        <div class="progress-cards">
          <div class="stats-card progress-overview">
            <h3 class="stats-card-title">整体进度</h3>
            <div class="progress-bar-block">
              <div class="progress-bar-wrap">
                <div
                  class="progress-bar-fill"
                  :style="{ width: `${completionRate}%`, backgroundColor: project.color || '#667eea' }"
                ></div>
              </div>
              <div class="progress-bar-meta">
                <span class="progress-pct">{{ completionRate.toFixed(1) }}%</span>
                <span class="progress-count">已完成 {{ stats.done }} / {{ stats.total }} 任务</span>
              </div>
            </div>
          </div>
          <div class="stats-card status-pie-card">
            <h3 class="stats-card-title">任务状态</h3>
            <div class="chart-wrap">
              <v-chart :option="statusPieOption" class="chart" />
            </div>
          </div>
        </div>
      </section>

      <!-- 二、项目统计分析 -->
      <section class="progress-section">
        <h2 class="section-title">项目统计分析</h2>
        <div class="progress-cards analytics-grid">
          <div class="stats-card">
            <h3 class="stats-card-title">完成率</h3>
            <div class="completion-value" :class="{ warn: completionRate < 80 }">
              {{ completionRate.toFixed(1) }}%
            </div>
            <p class="stats-card-hint">预警：&lt;80%</p>
          </div>
          <div class="stats-card">
            <h3 class="stats-card-title">资源利用率</h3>
            <div class="completion-value">{{ assignedTaskRate }}%</div>
            <p class="stats-card-desc">已分配负责人的任务占比</p>
          </div>
          <div class="stats-card member-workload full-width">
            <h3 class="stats-card-title">成员工作量</h3>
            <div class="member-table-wrap">
              <table class="member-table">
                <thead>
                  <tr>
                    <th>负责人</th>
                    <th>总任务</th>
                    <th>已完成</th>
                    <th>进行中</th>
                    <th>完成率</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in memberWorkload" :key="row.userId">
                    <td>
                      <span class="member-name">{{ row.displayName }}</span>
                    </td>
                    <td>{{ row.total }}</td>
                    <td>{{ row.done }}</td>
                    <td>{{ row.doing }}</td>
                    <td>{{ row.rate }}%</td>
                  </tr>
                  <tr v-if="memberWorkload.length === 0">
                    <td colspan="5" class="empty-cell">暂无负责人或任务数据</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { PieChart } from 'echarts/charts';
import { TooltipComponent } from 'echarts/components';
import VChart from 'vue-echarts';
import projectApi from '@/api/project';
import taskApi from '@/api/task';
import { useUserStore } from '@/stores/user';
import type { Project, ProjectTaskStats, Task } from '@/types';
import '../styles/components.css';

use([CanvasRenderer, PieChart, TooltipComponent]);

const route = useRoute();
const userStore = useUserStore();

const projectId = computed(() => Number(route.params.id));
const project = ref<Project | null>(null);
const stats = ref<ProjectTaskStats>({ todo: 0, doing: 0, done: 0, onHold: 0, total: 0 });
const tasks = ref<Task[]>([]);
const loading = ref(true);

const completionRate = computed(() => {
  const total = stats.value.total;
  return total === 0 ? 0 : (stats.value.done / total) * 100;
});

const isDark = computed(() => document.documentElement.getAttribute('data-theme') === 'dark');

const statusPieOption = computed(() => {
  const s = stats.value;
  const data = [
    { value: s.todo, name: '待办' },
    { value: s.doing, name: '进行中' },
    { value: s.done, name: '已完成' },
    { value: s.onHold, name: '搁置' },
  ].filter((d) => d.value > 0);
  if (data.length === 0) {
    data.push({
      value: 1,
      name: '暂无任务',
      itemStyle: { color: isDark.value ? 'rgba(255,255,255,0.2)' : '#e2e8f0' },
    } as { value: number; name: string; itemStyle?: Record<string, unknown> });
  }
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    backgroundColor: 'transparent',
    color: isDark.value
      ? ['#3b82f6', '#eab308', '#22c55e', '#94a3b8']
      : ['#3b82f6', '#eab308', '#22c55e', '#94a3b8'],
    series: [{
      type: 'pie',
      radius: '65%',
      center: ['50%', '50%'],
      data,
      label: { show: true, formatter: '{b}: {c}' },
      itemStyle: { borderRadius: 6, borderColor: isDark.value ? '#1a1a1e' : '#fff', borderWidth: 2 },
    }],
  };
});

/** 已分配负责人的任务占比 */
const assignedTaskRate = computed(() => {
  const list = tasks.value;
  if (list.length === 0) return 0;
  const assigned = list.filter((t) => t.assigneeId != null || (t.assigneeIds?.length ?? 0) > 0).length;
  return Math.round((assigned / list.length) * 100);
});

/** 成员工作量：按负责人汇总（每个任务只计入其负责人一次） */
const memberWorkload = computed(() => {
  const list = tasks.value;
  const byUserId = new Map<number, { total: number; done: number; doing: number; displayName: string }>();
  list.forEach((t) => {
    const uids = t.assigneeIds?.length ? t.assigneeIds : (t.assigneeId != null ? [t.assigneeId] : []);
    const displayName = (t.assignees?.[0]?.nickname || t.assignees?.[0]?.username || t.assignees?.[0]?.email)
      ?? (t.assigneeId === userStore.user?.id ? '我' : `用户${t.assigneeId ?? ''}`);
    uids.forEach((uid) => {
      if (!byUserId.has(uid)) byUserId.set(uid, { total: 0, done: 0, doing: 0, displayName });
      const r = byUserId.get(uid)!;
      r.total += 1;
      if (t.status === 'done') r.done += 1;
      if (t.status === 'doing') r.doing += 1;
    });
  });
  return Array.from(byUserId.entries()).map(([userId, r]) => ({
    userId,
    displayName: r.displayName || `用户 ${userId}`,
    total: r.total,
    done: r.done,
    doing: r.doing,
    rate: r.total === 0 ? 0 : Math.round((r.done / r.total) * 100),
  }));
});

async function load() {
  const id = projectId.value;
  if (!id || Number.isNaN(id)) {
    loading.value = false;
    return;
  }
  loading.value = true;
  try {
    const [proj, stat, taskList] = await Promise.all([
      projectApi.getProject(id).catch(() => null),
      projectApi.getProjectTaskStats(id).catch(() => ({ todo: 0, doing: 0, done: 0, onHold: 0, total: 0 })),
      taskApi.getTasks({ projectId: id }, { skipGlobalError: true }).catch(() => []),
    ]);
    project.value = proj ?? null;
    stats.value = stat ?? { todo: 0, doing: 0, done: 0, onHold: 0, total: 0 };
    tasks.value = Array.isArray(taskList) ? taskList : [];
  } finally {
    loading.value = false;
  }
}

watch(projectId, () => load(), { immediate: false });
onMounted(() => load());
</script>

<style scoped>
.project-progress-page {
  padding: var(--spacing-lg);
  width: 100%;
  max-width: none;
  margin: 0;
  box-sizing: border-box;
}

.page-header {
  margin-bottom: var(--spacing-lg);
}
.header-left {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}
.back-btn {
  display: inline-flex; align-items: center; gap: 4px; padding: 6px 16px 6px 10px;
  border-radius: 20px; background: var(--accent-primary); color: #fff; font-size: var(--font-size-small);
  font-weight: 500; text-decoration: none; cursor: pointer; transition: opacity 0.2s; align-self: flex-start;
}
.back-btn:hover { opacity: 0.85; }
.back-btn svg { flex-shrink: 0; }
.page-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
}
.page-desc {
  margin: 0;
  font-size: var(--font-size-base);
  color: var(--text-secondary);
}

.progress-loading,
.progress-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  min-height: 280px;
  color: var(--text-secondary);
}

.section-title {
  margin: 0 0 var(--spacing-md) 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}
.progress-section {
  margin-bottom: var(--spacing-xl);
}

.progress-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-lg);
}
.analytics-grid {
  grid-template-columns: repeat(2, 1fr);
}
.stats-card.full-width {
  grid-column: 1 / -1;
}

.stats-card {
  background: var(--panel-bg, var(--bg-secondary));
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  border: 1px solid var(--border-light);
}
[data-theme="dark"] .stats-card {
  background: var(--bg-secondary);
}

.stats-card-title {
  margin: 0 0 var(--spacing-md) 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.progress-bar-block {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}
.progress-bar-wrap {
  height: 12px;
  border-radius: 999px;
  background: var(--bg-tertiary);
  overflow: hidden;
}
.progress-bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.3s ease;
}
.progress-bar-meta {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-small);
  color: var(--text-secondary);
}
.progress-pct {
  font-weight: 600;
  color: var(--text-primary);
}

.completion-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--success, #22c55e);
}
.completion-value.warn {
  color: var(--warning, #eab308);
}
.stats-card-hint,
.stats-card-desc {
  margin: var(--spacing-xs) 0 0 0;
  font-size: var(--font-size-small);
  color: var(--text-tertiary);
}

.chart-wrap {
  min-height: 220px;
}
.chart {
  width: 100%;
  height: 100%;
  min-height: 220px;
}

.member-table-wrap {
  overflow-x: auto;
}
.member-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-small);
}
.member-table th,
.member-table td {
  padding: var(--spacing-sm) var(--spacing-md);
  text-align: left;
  border-bottom: 1px solid var(--border-subtle);
}
.member-table th {
  color: var(--text-secondary);
  font-weight: 600;
}
.member-table td.empty-cell {
  color: var(--text-tertiary);
  text-align: center;
  padding: var(--spacing-lg);
}

@media (max-width: 768px) {
  .progress-cards,
  .analytics-grid {
    grid-template-columns: 1fr;
  }
}
</style>
