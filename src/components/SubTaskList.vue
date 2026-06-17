<template>
  <div class="subtask-list">
    <div class="header">
      <span class="title">子任务</span>
      <n-progress
        v-if="subtasks.length > 0"
        :percentage="completionRate"
        :height="4"
        type="line"
        status="success"
        style="width: 100px"
      />
      <button class="btn-secondary btn-small" @click="showAddInput = true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        添加
      </button>
    </div>

    <div v-if="showAddInput" class="add-subtask">
      <div class="input-wrapper">
        <n-input
          v-model:value="newSubtaskTitle"
          placeholder="输入子任务标题"
          class="input-field-custom"
          @keyup.enter="handleAddSubtask"
          @blur="handleAddSubtask"
        />
      </div>
    </div>

    <div v-if="subtasks.length > 0" class="subtask-items">
      <div v-for="subtask in sortedSubtasks" :key="subtask.id" class="subtask-item">
        <label class="subtask-checkbox">
          <input
            type="checkbox"
            :checked="subtask.isDone"
            @change="handleToggle(subtask.id)"
            class="custom-checkbox"
          />
          <span class="checkmark"></span>
          <span class="subtask-title" :class="{ 'done': subtask.isDone }">{{ subtask.title }}</span>
        </label>
        <button class="action-btn delete" @click="handleDelete(subtask.id)" title="删除">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    </div>
    <div v-else class="empty">暂无子任务</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { NInput, NProgress } from 'naive-ui';
import '../styles/components.css';
import { useSubTasks } from '@/composables/useSubTasks';

interface Props {
  taskId: number;
}

const props = defineProps<Props>();

const {
  subtasks,
  completionRate,
  fetchSubtasks,
  createSubtask,
  toggleSubtask,
  deleteSubtask,
} = useSubTasks(props.taskId);

const showAddInput = ref(false);
const newSubtaskTitle = ref('');

const sortedSubtasks = computed(() => {
  return [...subtasks.value].sort((a, b) => a.sortOrder - b.sortOrder);
});

const handleAddSubtask = async () => {
  if (!newSubtaskTitle.value.trim()) {
    showAddInput.value = false;
    return;
  }
  
  try {
    await createSubtask(newSubtaskTitle.value.trim());
    newSubtaskTitle.value = '';
    showAddInput.value = false;
  } catch (error) {
    console.error('创建子任务失败:', error);
  }
};

const handleToggle = async (subtaskId: number) => {
  try {
    await toggleSubtask(subtaskId);
  } catch (error) {
    console.error('切换子任务状态失败:', error);
  }
};

const handleDelete = async (subtaskId: number) => {
  try {
    await deleteSubtask(subtaskId);
  } catch (error) {
    console.error('删除子任务失败:', error);
  }
};

// 初始化加载
fetchSubtasks();
</script>

<style scoped>
@import '../styles/components.css';

.subtask-list {
  margin-top: var(--spacing-md);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-md);
  border-bottom: 2px solid var(--border-subtle);
}

.title {
  font-weight: 600;
  font-size: var(--font-size-title);
  color: var(--text-primary);
}

.btn-small {
  padding: 6px 12px;
  font-size: var(--font-size-small);
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-small svg {
  width: 16px;
  height: 16px;
}

.add-subtask {
  margin-bottom: var(--spacing-sm);
}

.input-wrapper {
  width: 100%;
}

:deep(.n-input) {
  border-radius: 8px;
}

:deep(.n-input:focus) {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.done {
  text-decoration: line-through;
  color: var(--text-tertiary);
}

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg);
  color: var(--text-tertiary);
  font-size: var(--font-size-small);
  opacity: 0.6;
  min-height: 60px;
}

.subtask-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.subtask-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: var(--spacing-sm);
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.subtask-item:hover {
  background: var(--bg-tertiary);
  border-color: var(--border-subtle);
}

.action-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  padding: 0;
}

.action-btn svg {
  width: 14px;
  height: 14px;
}

.action-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border-color: var(--border-subtle);
  transform: translateY(-2px);
}

.action-btn:active {
  transform: translateY(-2px) scale(0.98);
}

.action-btn.delete:hover {
  color: var(--danger);
  background: rgba(239, 68, 68, 0.1);
  border-color: var(--danger);
}

.subtask-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  flex: 1;
}

.custom-checkbox {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 2px solid var(--border-subtle);
  appearance: none;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.custom-checkbox:checked {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
}

.custom-checkbox:checked::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.custom-checkbox:hover {
  border-color: var(--accent-primary);
}

.subtask-title {
  flex: 1;
  color: var(--text-primary);
  transition: all 0.2s ease;
}

.subtask-title.done {
  text-decoration: line-through;
  color: var(--text-tertiary);
}
</style>
