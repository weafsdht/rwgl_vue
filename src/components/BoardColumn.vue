<template>
  <div
    class="board-column ref-style"
    :class="[`column-${status}`]"
  >
    <!-- 列头：彩色条 + 图标 + 标题 + 数量 + 下拉箭头 -->
    <div class="column-header" :class="`header-${status}`">
      <span class="column-header-icon" aria-hidden="true">
        <component :is="statusIcon" />
      </span>
      <span class="column-header-title">{{ statusLabel }}</span>
      <span class="column-header-count">{{ tasks.length }}</span>
      <button type="button" class="column-header-dropdown" aria-label="选项">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
      </button>
    </div>
    <!-- 卡片区域 -->
    <div
      ref="columnRef"
      class="column-content"
      :class="{ 'is-dragging': isDragging }"
      :data-status="status"
    >
      <TaskCard
        v-for="task in tasks"
        :key="task.id"
        :task="task"
        :column-status="status"
        :display-tags="taskDisplayTags(task)"
        :data-task-id="task.id"
        @edit="handleEdit"
        @archive="handleArchive"
        @delete="handleDelete"
      />
    </div>
    <!-- + 新建 按钮：始终在任务卡片最下面 -->
    <button type="button" class="column-add-btn" @click="$emit('add-task')">
      + 新建
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, h } from 'vue';
import '../styles/components.css';
import Sortable from 'sortablejs';
import TaskCard from './TaskCard.vue';
import type { Task } from '@/types';
import type { Tag } from '@/types';

interface Props {
  status: 'todo' | 'doing' | 'done' | 'stalled';
  tasks: Task[];
  allTags?: Tag[];
}

const props = withDefaults(defineProps<Props>(), { allTags: () => [] });

/** 任务展示用标签：优先 task.tags，否则用 task.tagIds 从 allTags 解析；id 统一按数字比较 */
function taskDisplayTags(task: Task): Tag[] {
  if (task.tags?.length) return task.tags;
  const raw = task as Task & Record<string, unknown>;
  const ids = task.tagIds ?? (Array.isArray(raw.tag_ids) ? raw.tag_ids : undefined);
  if (!ids?.length || !props.allTags.length) return [];
  return ids.map((id: unknown) => props.allTags.find(t => t.id === Number(id))).filter((t): t is Tag => t != null);
}

const emit = defineEmits<{
  'task-move': [taskId: number, newStatus: string, newIndex?: number];
  'task-edit': [task: Task];
  'task-archive': [task: Task];
  'task-delete': [task: Task];
  'add-task': [];
}>();

const statusConfig: Record<string, { label: string; icon: () => any }> = {
  todo: {
    label: '待办',
    icon: () => h('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
      h('circle', { cx: '12', cy: '12', r: '10' }),
    ]),
  },
  doing: {
    label: '进行中',
    icon: () => h('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2.5', 'stroke-linecap': 'round' }, [
      h('line', { x1: '12', y1: '12', x2: '12', y2: '4' }),
      h('line', { x1: '12', y1: '12', x2: '16.5', y2: '7.5' }),
      h('line', { x1: '12', y1: '12', x2: '20', y2: '12' }),
      h('line', { x1: '12', y1: '12', x2: '16.5', y2: '16.5' }),
      h('line', { x1: '12', y1: '12', x2: '12', y2: '20' }),
      h('line', { x1: '12', y1: '12', x2: '7.5', y2: '16.5' }),
      h('line', { x1: '12', y1: '12', x2: '4', y2: '12' }),
      h('line', { x1: '12', y1: '12', x2: '7.5', y2: '7.5' }),
    ]),
  },
  done: {
    label: '完成',
    icon: () => h('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
      h('path', { d: 'M20 6L9 17l-5-5' }),
    ]),
  },
  stalled: {
    label: '搁置',
    icon: () => h('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
      h('line', { x1: '18', y1: '6', x2: '6', y2: '18' }),
      h('line', { x1: '6', y1: '6', x2: '18', y2: '18' }),
    ]),
  },
};

const statusLabel = computed(() => statusConfig[props.status]?.label ?? props.status);
const statusIcon = computed(() => statusConfig[props.status]?.icon ?? (() => null));

const columnRef = ref<HTMLElement>();
const isDragging = ref(false);
let sortableInstance: Sortable | null = null;

onMounted(() => {
  if (columnRef.value) {
    sortableInstance = new Sortable(columnRef.value, {
      animation: 150,
      group: 'tasks',
      onStart: () => { isDragging.value = true; },
      onEnd: (evt) => {
        isDragging.value = false;
        if (evt.to !== evt.from) {
          const taskId = parseInt(evt.item.getAttribute('data-task-id') || '0', 10);
          const newStatus = evt.to.getAttribute('data-status') || props.status;
          const newIndex = evt.newIndex;
          emit('task-move', taskId, newStatus, newIndex);
        }
      },
    });
  }
});

onUnmounted(() => {
  sortableInstance?.destroy();
});

const handleEdit = (task: Task) => emit('task-edit', task);
const handleArchive = (task: Task) => emit('task-archive', task);
const handleDelete = (task: Task) => emit('task-delete', task);
</script>

<style scoped>
/* 统一第二张图风格：白/浅灰背景、圆角、轻微阴影 */
.board-column.ref-style {
  display: flex;
  flex-direction: column;
  flex: 1 1 0;
  min-width: 200px;
  max-width: 320px;
  background: #ffffff;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  overflow: hidden;
  box-shadow: var(--shadow-soft);
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}

[data-theme="dark"] .board-column.ref-style {
  background: var(--bg-secondary);
  border-color: var(--border-subtle);
}

.board-column.ref-style:hover {
  box-shadow: var(--shadow-elevated);
}

/* 列头：四列分类 待办/进行中/完成/搁置，主题色背景 */
.column-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  color: var(--primary-foreground, #fff);
  font-weight: 600;
  font-size: var(--font-size-base);
  border-radius: var(--radius-md) var(--radius-md) 0 0;
}

.column-header.header-todo {
  background: var(--color-status-todo);
}

.column-header.header-doing {
  background: var(--color-status-doing);
  color: #1a1a1a;
}

.column-header.header-doing .column-header-icon {
  color: #92400e;
}

[data-theme="dark"] .column-header.header-doing {
  color: #1a1a1a;
}

.column-header.header-done {
  background: var(--color-status-done);
}

.column-header.header-stalled {
  background: #E5E7EB;
  color: #374151;
}

[data-theme="dark"] .column-header.header-stalled {
  background: var(--color-status-stalled);
  color: var(--primary-foreground);
}

.column-header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.column-header-title {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.column-header-count {
  flex-shrink: 0;
  opacity: 0.95;
  min-width: 1.25rem;
  text-align: center;
}

.column-header-dropdown {
  flex-shrink: 0;
  padding: 2px;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.9;
  border-radius: 4px;
}

.column-header-dropdown:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.2);
}

[data-theme="dark"] .column-header.header-doing .column-header-dropdown:hover {
  background: rgba(0, 0, 0, 0.1);
}

/* + 新建 按钮：浅灰、虚线边框，统一第二张图 */
.column-add-btn {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  margin: 0;
  border: 2px dashed var(--border-medium);
  border-radius: 0 0 var(--radius-md) var(--radius-md);
  background: transparent;
  color: var(--text-secondary);
  font-size: var(--font-size-base);
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
  flex-shrink: 0;
}

.column-add-btn:hover {
  background: var(--bg-hover, var(--bg-tertiary));
  color: var(--accent-primary);
  border-color: var(--accent-primary);
}

.column-content {
  flex: 0 0 auto;
  padding: var(--spacing-sm);
  background: #fafafa;
  transition: opacity 0.2s ease;
}

.column-content :deep(.task-card.ref-style) {
  margin-bottom: var(--spacing-sm);
  border-radius: var(--radius-md);
}

/* 四列分类：任务卡淡色背景与列头状态色一致（待办/进行中/完成/搁置） */
.column-todo :deep(.task-card.ref-style) {
  background: rgba(49, 83, 237, 0.1);
  border-color: rgba(45, 212, 191, 0.3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.column-doing :deep(.task-card.ref-style) {
  background: rgba(254, 249, 195, 0.6);
  border-color: rgba(234, 179, 8, 0.3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.column-done :deep(.task-card.ref-style) {
  background: rgba(34, 197, 94, 0.12);
  border-color: rgba(34, 197, 94, 0.3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.column-stalled :deep(.task-card.ref-style) {
  background: rgba(148, 163, 184, 0.15);
  border-color: rgba(148, 163, 184, 0.35);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
[data-theme="dark"] .board-column.ref-style .column-content {
  background: var(--bg-tertiary);
}

[data-theme="dark"] .column-todo :deep(.task-card.ref-style) {
  background: rgba(45, 212, 191, 0.15);
  border-color: rgba(45, 212, 191, 0.4);
}
[data-theme="dark"] .column-doing :deep(.task-card.ref-style) {
  background: rgba(234, 179, 8, 0.12);
  border-color: rgba(234, 179, 8, 0.35);
}
[data-theme="dark"] .column-done :deep(.task-card.ref-style) {
  background: rgba(34, 197, 94, 0.12);
  border-color: rgba(34, 197, 94, 0.4);
}
[data-theme="dark"] .column-stalled :deep(.task-card.ref-style) {
  background: rgba(148, 163, 184, 0.15);
  border-color: rgba(148, 163, 184, 0.4);
}

.column-content.is-dragging {
  opacity: 0.9;
}
</style>
