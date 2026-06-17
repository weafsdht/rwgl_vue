<template>
  <div
    class="task-card ref-style"
    :class="{ overdue: task.isOverdue }"
    :data-task-id="task.id"
    :data-priority="task.priority"
    @mouseenter="hover = true"
    @mouseleave="hover = false"
    @click="handleEdit"
  >
    <div class="card-top">
      <span class="card-status-icon" :class="`icon-${columnStatus ?? task.status}`" aria-hidden="true">
        <!-- 已处理：勾选 -->
        <svg v-if="(columnStatus ?? task.status) === 'done'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>
        <!-- 进行中：八射线太阳/星爆图标（实色、加粗） -->
        <svg v-else-if="(columnStatus ?? task.status) === 'doing'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="12" y1="12" x2="12" y2="4"/><line x1="12" y1="12" x2="16.5" y2="7.5"/><line x1="12" y1="12" x2="20" y2="12"/><line x1="12" y1="12" x2="16.5" y2="16.5"/><line x1="12" y1="12" x2="12" y2="20"/><line x1="12" y1="12" x2="7.5" y2="16.5"/><line x1="12" y1="12" x2="4" y2="12"/><line x1="12" y1="12" x2="7.5" y2="7.5"/>
        </svg>
        <!-- 搁置：叉号 -->
        <svg v-else-if="(columnStatus ?? task.status) === 'stalled'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        <!-- 待处理：空心圆 -->
        <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>
      </span>
      <h4 class="card-title">{{ task.title }}</h4>
      <div class="card-top-actions">
        <span v-if="task.dueTime || task.isOverdue" class="card-due" :title="task.dueTime ? formatDate(task.dueTime, 'YYYY-MM-DD') : ''">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          <span v-if="task.isOverdue" class="overdue-label">逾期</span>
          <span v-else>{{ formatDate(task.dueTime!, 'MM-DD') }}</span>
        </span>
        <n-dropdown
          :options="cardMenuOptions"
          trigger="click"
          @select="handleMenuSelect"
        >
          <button type="button" class="card-menu-btn" aria-label="更多操作" @click.stop>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="6" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="18" r="1.5"/></svg>
          </button>
        </n-dropdown>
      </div>
    </div>
    <div class="card-priority" :style="{ color: getPriorityColor(task.priority) }" :title="getPriorityLabel(task.priority)">
      {{ getPriorityLabel(task.priority) }}
    </div>
    <div class="card-bottom">
      <span class="card-meta-icons">
        <span v-if="cardDisplayTags.length > 0" class="card-tags">
          <span
            v-for="tag in cardDisplayTags"
            :key="tag.id"
            class="card-tag-chip"
            :style="{ background: tag.color || '#e5e7eb', color: tagChipTextColor(tag.color) }"
            :title="tag.name"
          >
            {{ tag.name }}
          </span>
        </span>
        <span v-if="commentCount > 0" class="card-meta-icon" title="评论">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span class="card-meta-num">{{ commentCount }}</span>
        </span>
      </span>
      <span class="card-right-group">
        <span v-if="task.projectName || task.projectColor" class="card-project-inline">
          <span
            v-if="task.projectColor"
            class="card-project-dot"
            :style="{ backgroundColor: task.projectColor }"
            aria-hidden="true"
          />
          <span class="card-project-name">{{ task.projectName?.trim() || '未分组' }}</span>
        </span>
        <span class="card-assignee" title="负责人">
        <template v-if="displayAssignees.length">
          <template v-for="(u, idx) in displayAssignees.slice(0, 3)" :key="`${u.id}-${idx}`">
            <span class="assignee-avatar" :class="{ 'assignee-avatar--stack': idx > 0 }" :title="u.nickname || u.username || u.email || ''">
              <img v-if="u.avatar" :src="getAvatarUrl(u.avatar)" :alt="(u.nickname || u.username || '?')[0]" />
              <span v-else class="assignee-initial">{{ (u.nickname || u.username || '?')[0] }}</span>
            </span>
          </template>
          <span v-if="displayAssignees.length > 3" class="assignee-more">等{{ displayAssignees.length }}人</span>
        </template>
        <span v-else class="assignee-avatar assignee-empty" title="未分配">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </span>
      </span>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { NDropdown } from 'naive-ui';
import { formatDate } from '@/utils/date';
import { getPriorityLabel, getPriorityColor } from '@/utils/task';
import { useUserStore } from '@/stores/user';
import { useProjectAssignees, resolveTaskAssigneeUser } from '@/composables/useProjectAssignees';
import { getAvatarUrl } from '@/utils/request';
import type { Task, User } from '@/types';
import type { Tag } from '@/types';

function tagChipTextColor(bgHex: string | undefined): string {
  if (!bgHex || bgHex === '') return 'var(--text-primary)';
  const hex = bgHex.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#1f2937' : '#fff';
}

interface Props {
  task: Task;
  columnStatus?: 'todo' | 'doing' | 'done' | 'stalled';
  /** 若后端只返回 tagIds，可由父级解析后传入 */
  displayTags?: Tag[];
}

const props = withDefaults(defineProps<Props>(), { columnStatus: undefined, displayTags: undefined });

const cardDisplayTags = computed(() => props.displayTags ?? props.task.tags ?? []);

const emit = defineEmits<{
  edit: [task: Task];
  archive: [task: Task];
  delete: [task: Task];
}>();

const userStore = useUserStore();
const { assigneeUserMap } = useProjectAssignees();
const hover = ref(false);

/** 看板卡片负责人：合并 assignees、assignee、当前用户与团队成员映射中的头像 */
const displayAssignees = computed((): User[] => {
  const task = props.task;
  const map = assigneeUserMap.value;
  const me = userStore.user;
  if (task.assignees?.length) {
    return task.assignees.map((u) => resolveTaskAssigneeUser(task, u.id, map, me));
  }
  const ids = task.assigneeIds?.length
    ? task.assigneeIds
    : task.assigneeId != null
      ? [task.assigneeId]
      : [];
  if (ids.length) {
    return ids
      .map((raw) => Number(raw))
      .filter((id) => Number.isFinite(id))
      .map((id) => resolveTaskAssigneeUser(task, id, map, me));
  }
  if (task.assignee) return [resolveTaskAssigneeUser(task, task.assignee.id, map, me)];
  if (task.assigneeId != null && userStore.user?.id === task.assigneeId) {
    return [resolveTaskAssigneeUser(task, task.assigneeId, map, me)];
  }
  return [];
});

const commentCount = computed(() => props.task.comments?.length ?? 0);

const isDone = computed(() => (props.columnStatus ?? props.task.status) === 'done');

const cardMenuOptions = computed(() => {
  const opts: { label: string; key: string }[] = [
    { label: '编辑', key: 'edit' },
  ];
  if (isDone.value) opts.push({ label: '归档', key: 'archive' });
  opts.push({ label: '删除', key: 'delete' });
  return opts;
});

function handleMenuSelect(key: string) {
  if (key === 'edit') emit('edit', props.task);
  else if (key === 'archive') emit('archive', props.task);
  else if (key === 'delete') emit('delete', props.task);
}

const handleEdit = () => emit('edit', props.task);
</script>

<style scoped>
/* 统一第二张图风格：圆角、轻微阴影、抬升感 */
.task-card.ref-style {
  position: relative;
  background: var(--card, #ffffff);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

[data-theme="dark"] .task-card.ref-style {
  background: var(--bg-secondary);
  border-color: var(--border-subtle);
}

.task-card.ref-style:hover {
  box-shadow: var(--shadow-elevated);
  border-color: var(--border-medium);
}

.task-card.ref-style.overdue .card-due {
  color: var(--danger);
}

.card-right-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-shrink: 0;
}

.card-project-inline {
  display: flex;
  align-items: center;
  gap: 6px;
  max-width: 100px;
}

.card-project-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.card-project-name {
  font-size: var(--font-size-small);
  color: var(--text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.card-tags {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  margin-right: var(--spacing-sm);
}
.card-tag-chip {
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-top {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
}

.card-status-icon {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
}

.card-status-icon.icon-todo {
  color: var(--color-status-todo);
}

.card-status-icon.icon-doing {
  color: var(--color-status-doing, #eab308);
}

.card-status-icon.icon-done {
  color: var(--color-status-done);
}

.card-status-icon.icon-stalled {
  color: var(--color-status-stalled);
}

.card-title {
  margin: 0;
  font-size: var(--font-size-base);
  font-weight: 500;
  color: var(--text-primary);
  flex: 1;
  min-width: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.45;
}

.card-top-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.card-due {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-small);
  color: var(--text-tertiary);
}

.card-due svg {
  flex-shrink: 0;
  opacity: 0.8;
}

.card-menu-btn {
  padding: 4px;
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s, color 0.2s;
}

.card-menu-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.card-priority {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-bottom: var(--spacing-sm);
  font-weight: 600;
  font-size: var(--font-size-small);
}
/* 五角星：最多 5 个，未填充为灰色描边，已填充为金色实心 */
.priority-star {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--border-medium, #d1d5db);
  transition: color 0.2s;
}
.priority-star svg {
  display: block;
}
.priority-star .star-path {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linejoin: round;
}
.priority-star.filled {
  color: #f59e0b;
}
.priority-star.filled .star-path {
  fill: currentColor;
  stroke: none;
}
[data-theme="dark"] .priority-star.filled {
  color: #fbbf24;
}

.card-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-xs);
  padding-top: var(--spacing-xs);
  border-top: 1px solid var(--border-subtle);
}

.card-meta-icons {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.card-meta-icon {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: var(--text-tertiary);
}

.card-meta-num {
  font-size: 11px;
  color: var(--text-tertiary);
}

.card-assignee {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.assignee-more {
  font-size: 11px;
  color: var(--text-tertiary);
}

.assignee-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-primary);
  color: var(--primary-foreground, #fff);
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
  box-sizing: border-box;
}
.assignee-avatar--stack {
  margin-left: -8px;
  border: 2px solid var(--card, #ffffff);
}
[data-theme='dark'] .assignee-avatar--stack {
  border-color: var(--bg-secondary, #1e1e1e);
}

.assignee-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.assignee-empty {
  background: var(--bg-tertiary);
  color: var(--text-tertiary);
  font-size: 10px;
}
.assignee-empty svg {
  display: block;
}
</style>
