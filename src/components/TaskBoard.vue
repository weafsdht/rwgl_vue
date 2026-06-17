<template>
  <div class="task-board ref-style">
    <BoardColumn
      v-for="status in statuses"
      :key="status"
      :status="status"
      :tasks="(tasks[status] ?? []) as Task[]"
      :all-tags="allTags"
      @task-move="handleTaskMove"
      @task-edit="handleTaskEdit"
      @task-archive="handleTaskArchive"
      @task-delete="requestDelete"
      @add-task="onAddTask(status)"
    />
  </div>

  <ConfirmModal
    v-model="showDeleteConfirm"
    title="删除提示"
    :content="deleteTarget ? `确定要删除任务「${deleteTarget.title}」吗？删除后不可恢复。` : ''"
    confirm-text="确 定"
    cancel-text="取 消"
    @confirm="doDelete"
  />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import BoardColumn from './BoardColumn.vue';
import ConfirmModal from '@/components/ConfirmModal.vue';
import { useTasks } from '@/composables/useTasks';
import tagApi from '@/api/tag';
import type { Task } from '@/types';
import type { Tag } from '@/types';

const allTags = ref<Tag[]>([]);

const emit = defineEmits<{
  'task-edit': [task: Task];
  'add-task': [status: string];
}>();

const { tasks, moveTask, deleteTask, archiveTask } = useTasks();

function onAddTask(status: string) {
  emit('add-task', status);
}

onMounted(() => {
  tagApi.getList().then(list => { allTags.value = list ?? []; }).catch(() => { allTags.value = []; });
});

const statuses = ['todo', 'doing', 'done', 'stalled'] as const;

const handleTaskMove = async (taskId: number, newStatus: string, newIndex?: number) => {
  try {
    await moveTask(taskId, newStatus, newIndex);
  } catch (e) {
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'error', title: '移动失败', message: (e as Error)?.message || '请检查网络或稍后重试' },
    }));
  }
};

const handleTaskEdit = (task: Task) => emit('task-edit', task);

const handleTaskArchive = async (task: Task) => {
  try {
    await archiveTask(task.id);
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'success', title: '已归档', message: '任务已移入归档' },
    }));
  } catch (e) {
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'error', title: '归档失败', message: (e as Error)?.message || '请稍后重试' },
    }));
  }
};

const deleteTarget = ref<Task | null>(null);
const showDeleteConfirm = ref(false);

function requestDelete(task: Task) {
  deleteTarget.value = task;
  showDeleteConfirm.value = true;
}

async function doDelete() {
  const task = deleteTarget.value;
  if (!task) return;
  showDeleteConfirm.value = false;
  try {
    await deleteTask(task.id);
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'success', title: '已删除', message: '任务已删除' },
    }));
  } catch (e) {
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'error', title: '删除失败', message: (e as Error)?.message || '请稍后重试' },
    }));
  } finally {
    deleteTarget.value = null;
  }
}
</script>

<style scoped>
/* 四列分类：待办 / 进行中 / 完成 / 搁置，统一第二张图风格 */
.task-board.ref-style {
  display: flex;
  gap: var(--spacing-md);
  align-items: flex-start;
  overflow-x: auto;
  overflow-y: visible;
  padding-bottom: 0;
  padding-right: 0;
  flex: 0 0 auto;
  width: 100%;
}

.task-board.ref-style::-webkit-scrollbar {
  height: 8px;
}

.task-board.ref-style::-webkit-scrollbar-track {
  background: var(--bg-tertiary);
  border-radius: 4px;
}

.task-board.ref-style::-webkit-scrollbar-thumb {
  background: var(--border-medium);
  border-radius: 4px;
}

.task-board.ref-style::-webkit-scrollbar-thumb:hover {
  background: var(--text-tertiary);
}

@media (max-width: 1024px) {
  .task-board.ref-style {
    flex-wrap: nowrap;
    overflow-x: auto;
  }
}

@media (max-width: 768px) {
  .task-board.ref-style {
    gap: var(--spacing-md);
    flex-direction: column;
    overflow-x: hidden;
    overflow-y: auto;
    align-items: stretch;
  }
}
</style>
