<template>
  <div class="board-page">
    <header v-if="currentProject" class="board-header">
      <h1 class="board-title">{{ currentProject.name }}</h1>
      <div v-if="displayProjectAssignees(currentProject).length" class="board-assignees" :title="displayProjectAssignees(currentProject).map(u => u.nickname || u.username || u.email).filter(Boolean).join('、')">
        <template v-for="(u, idx) in displayProjectAssignees(currentProject).slice(0, 4)" :key="u.id + '-' + idx">
          <img v-if="u.avatar" :src="getAvatarUrl(u.avatar)" class="board-avatar board-avatar-multi" :alt="(u.nickname || u.username || '')[0]" />
          <span v-else class="board-avatar board-avatar-initial board-avatar-multi">{{ (u.nickname || u.username || u.email || '?')[0].toUpperCase() }}</span>
        </template>
        <span v-if="displayProjectAssignees(currentProject).length > 4" class="board-assignees-more">等{{ displayProjectAssignees(currentProject).length }}人</span>
      </div>
    </header>
    <div v-if="loading" class="loading">
      <div class="loader-ring"></div>
    </div>
    <TaskBoard v-else @add-task="onAddTask" @task-edit="onTaskEdit" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import '../styles/components.css';
import TaskBoard from '@/components/TaskBoard.vue';
import { useTasks } from '@/composables/useTasks';
import { useProjects } from '@/composables/useProjects';
import { useProjectAssignees } from '@/composables/useProjectAssignees';
import { getAvatarUrl } from '@/utils/request';
import { runAutoArchive } from '@/composables/useAutoArchive';

const { loading, fetchBoard, tasks, archiveTask } = useTasks();
const { currentProjectId, currentProject, fetchProjects } = useProjects();
const { ensureMap: ensureProjectAssigneeMap, displayProjectAssignees } = useProjectAssignees();

function onAddTask(status: string) {
  window.dispatchEvent(new CustomEvent('open-create-task', { detail: { status } }));
}

function onTaskEdit(task: import('@/types').Task) {
  window.dispatchEvent(new CustomEvent('open-edit-task', { detail: { task } }));
}

async function loadBoard() {
  const id = currentProjectId.value ?? undefined;
  await fetchBoard({
    ...(id != null ? { projectId: id } : {}),
    getCurrentBoard: () => tasks.value,
    /** 不在此弹 Toast：GET /tasks 已 skipGlobalError；失败时保持/清空看板由 store 处理，避免与网络错误重复打扰 */
  });
  const archived = await runAutoArchive(tasks.value.done ?? [], archiveTask);
  if (archived > 0) {
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'info', title: '自动归档', message: `${archived} 个已完成任务已移入归档` },
    }));
  }
}

function onRefreshView(e: Event) {
  const d = (e as CustomEvent).detail;
  if (!d?.view || d.view === 'Board') loadBoard();
}

function onTaskSync() {
  loadBoard();
}

onMounted(() => {
  ensureProjectAssigneeMap().then(() => fetchProjects().then(() => loadBoard()));
  window.addEventListener('refresh-view', onRefreshView);
  window.addEventListener('task-updated', onTaskSync);
  window.addEventListener('task-deleted', onTaskSync);
});

onUnmounted(() => {
  window.removeEventListener('refresh-view', onRefreshView);
  window.removeEventListener('task-updated', onTaskSync);
  window.removeEventListener('task-deleted', onTaskSync);
});
</script>

<style scoped>
@import '../styles/components.css';

.board-page {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-primary);
  width: 100%;
  min-width: 0;
}

.board-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  flex-shrink: 0;
}
.board-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}
.board-assignees {
  display: inline-flex;
  align-items: center;
  gap: 0;
}
.board-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  object-fit: cover;
}
.board-avatar-multi {
  margin-left: -10px;
  border: 2px solid var(--bg-primary, #fff);
  box-sizing: border-box;
}
.board-avatar-multi:first-child {
  margin-left: 0;
}
.board-avatar-initial {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-primary);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
}
.board-assignees-more {
  font-size: var(--font-size-small);
  color: var(--text-tertiary);
  margin-left: 4px;
  white-space: nowrap;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.loading .loader-ring {
  margin: 0 auto;
}
</style>
