<template>
  <div class="calendar-page" @click="closeUndatedMenu">
    <aside class="calendar-sidebar" :class="{ collapsed: undatedPanelCollapsed }">
      <button
        type="button"
        class="sidebar-toggle"
        @click="undatedPanelCollapsed = !undatedPanelCollapsed"
        :aria-label="undatedPanelCollapsed ? '展开无日期任务' : '收起无日期任务'"
      >
        <svg class="sidebar-toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline :points="undatedPanelCollapsed ? '9 6 15 12 9 18' : '15 6 9 12 15 18'" />
        </svg>
      </button>
      <div
        v-if="!undatedPanelCollapsed"
        class="sidebar-content"
        :class="{ 'undated-drop-active': undatedDropActive }"
        @dragover.prevent="onUndatedDragover"
        @dragenter.prevent="undatedDropActive = true"
        @dragleave="onUndatedDragleave"
        @drop="onUndatedDrop"
      >
        <div class="sidebar-title-row">
          <h3 class="sidebar-title">待规划任务</h3>
          <span class="sidebar-count" :style="sidebarCountStyle">{{ sortedFilteredUndatedTasks.length }}</span>
        </div>
        <div class="undated-toolbar" @click.stop>
          <div class="undated-dropdown">
            <button type="button" class="undated-toolbar-btn undated-toolbar-btn--arrow" @click="toggleUndatedMenu('project')">
              {{ undatedProjectLabel }}
            </button>
            <div v-if="openUndatedMenu === 'project'" class="undated-dropdown-menu">
              <button type="button" class="undated-dropdown-item" :class="{ active: undatedFilterProject === '' }" @click="selectUndatedProject('')">项目</button>
              <button
                v-for="opt in undatedProjectOptions"
                :key="`project-${opt.value}`"
                type="button"
                class="undated-dropdown-item"
                :class="{ active: undatedFilterProject === String(opt.value) }"
                @click="selectUndatedProject(String(opt.value))"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>
          <div class="undated-dropdown">
            <button type="button" class="undated-toolbar-btn undated-toolbar-btn--arrow" @click="toggleUndatedMenu('priority')">
              {{ undatedPriorityLabel }}
            </button>
            <div v-if="openUndatedMenu === 'priority'" class="undated-dropdown-menu">
              <button type="button" class="undated-dropdown-item" :class="{ active: undatedFilterPriority === '' }" @click="selectUndatedPriority('')">状态</button>
              <button
                v-for="opt in undatedPriorityOptions"
                :key="`priority-${opt.value}`"
                type="button"
                class="undated-dropdown-item"
                :class="{ active: undatedFilterPriority === String(opt.value) }"
                @click="selectUndatedPriority(String(opt.value))"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>
          <div class="undated-dropdown">
            <button type="button" class="undated-toolbar-btn undated-toolbar-btn--arrow" @click="toggleUndatedMenu('tag')">
              {{ undatedTagLabel }}
            </button>
            <div v-if="openUndatedMenu === 'tag'" class="undated-dropdown-menu">
              <button type="button" class="undated-dropdown-item" :class="{ active: undatedFilterTag === '' }" @click="selectUndatedTag('')">标签</button>
              <button
                v-for="opt in undatedTagOptions"
                :key="`tag-${opt.value}`"
                type="button"
                class="undated-dropdown-item"
                :class="{ active: undatedFilterTag === String(opt.value) }"
                @click="selectUndatedTag(String(opt.value))"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>
        </div>
        <div v-if="sortedFilteredUndatedTasks.length" class="undated-task-panel">
          <div class="undated-task-scroll">
            <div
              v-for="task in sortedFilteredUndatedTasks"
              :key="task.id"
              class="undated-task-item"
              :class="`status-${task.status}`"
              :style="pillStyle(task)"
              draggable="true"
              @click.stop="openEditTask(task)"
              @dragstart="onTaskDragStart($event, task)"
            >
              {{ task.title }}
            </div>
          </div>
        </div>
        <div v-else class="undated-empty-wrap" aria-hidden="true">
          <svg class="undated-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 7h16v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7z" />
            <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <path d="M9 12h6M9 16h4" opacity="0.55" />
          </svg>
        </div>
      </div>
    </aside>
    <div class="calendar-main">
    <div class="page-header calendar-header">
      <div class="calendar-header-left">
        <h1 class="page-title">日历</h1>
        <div class="calendar-view-tabs">
          <button
            v-for="m in viewModes"
            :key="m.value"
            type="button"
            class="view-tab"
            :class="{ active: viewMode === m.value }"
            @click="viewMode = m.value"
          >
            {{ m.label }}
          </button>
        </div>
      </div>
      <div class="calendar-nav">
        <button type="button" class="btn-icon" @click="prev" :aria-label="prevLabel">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span class="calendar-month-label">{{ rangeLabel }}</span>
        <button type="button" class="btn-icon" @click="next" :aria-label="nextLabel">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
        <button type="button" class="btn-secondary btn-small" @click="goToday">今天</button>
      </div>
    </div>

    <!-- 月视图 -->
    <div v-show="viewMode === 'month'" class="calendar-card">
      <div class="calendar-weekdays">
        <span v-for="d in weekdays" :key="d" class="weekday">{{ d }}</span>
      </div>
      <div class="calendar-grid">
        <div
          v-for="(day, index) in calendarDays"
          :key="index"
          class="calendar-day"
          :style="dayGridStyle(index)"
          :class="{
            'other-month': !day.isCurrentMonth,
            'today': day.isToday,
            'hovered': hoveredDate === day.dateKey,
            'has-tasks': (tasksByDate[day.dateKey]?.length ?? 0) > 0,
          }"
          @click="onMonthDayClick(day.dateKey)"
          @dblclick="onMonthDayDblClick(day.dateKey)"
          @mouseenter="setHoveredDate(day.dateKey)"
          @mouseleave="clearHoveredDate"
          @dragover.prevent="onDayDragover"
          @drop="onDayDrop($event, day.dateKey)"
        >
          <div class="day-header">
            <span class="day-num">{{ day.day }}</span>
            <span v-if="getLunarLabel(day.dateKey)" class="day-lunar">{{ getLunarLabel(day.dateKey) }}</span>
            <span
              v-if="(singleDayTasksByDate[day.dateKey]?.length ?? 0) > 2"
              class="day-task-overflow"
            >+{{ (singleDayTasksByDate[day.dateKey]?.length ?? 0) - 2 }}</span>
          </div>
          <div v-if="(singleDayTasksByDate[day.dateKey]?.length ?? 0) > 0" class="day-tasks">
            <span
              v-for="item in singleDayTasksByDate[day.dateKey].slice(0, 2)"
              :key="item.task.id"
              class="day-task-pill"
              :class="[`status-${item.task.status}`]"
              :style="pillStyle(item.task)"
              draggable="true"
              @click.stop="openEditTask(item.task)"
              @dragstart="onTaskDragStart($event, item.task)"
            >
              {{ item.task.title }}
            </span>
          </div>
        </div>
        <div
          v-for="seg in monthSpanSegments"
          :key="seg.segmentKey"
          class="month-span-bar"
          :class="[
            `status-${seg.task.status}`,
            seg.isFirstSegment && 'span-bar-start',
            seg.isLastSegment && 'span-bar-end',
          ]"
          :style="{
            gridRow: seg.row + 1,
            gridColumn: `${seg.colStart + 1} / ${seg.colEnd + 2}`,
            ...pillStyle(seg.task),
          }"
          draggable="true"
          @click.stop="openEditTask(seg.task)"
          @dragstart="onTaskDragStart($event, seg.task)"
        >
          <span class="month-span-bar__text">{{ seg.isFirstSegment ? seg.task.title : '\u00A0' }}</span>
        </div>
      </div>
    </div>

    <!-- 周视图：24 小时逐小时网格，参考图二 -->
    <div v-show="viewMode === 'week'" class="calendar-card calendar-card--week calendar-card--week-hourly">
      <div class="week-hourly-body">
      <div class="week-hourly-grid" :style="weekHourlyGridRowsStyle">
        <!-- 表头行 -->
        <div class="week-hourly-cell week-hourly-time" style="grid-row: 1; grid-column: 1">时间</div>
        <div
          v-for="(day, di) in weekDays"
          :key="day.dateKey"
          class="week-hourly-cell week-hourly-day week-hourly-day--clickable"
          :class="{ today: day.isToday, hovered: hoveredDate === day.dateKey }"
          :style="{ gridRow: 1, gridColumn: di + 2 }"
          @click="goToDayView(day.dateKey)"
          @mouseenter="setHoveredDate(day.dateKey)"
          @mouseleave="clearHoveredDate"
        >
          {{ day.weekdayLabel }} {{ day.day }}
        </div>
        <!-- 全天行：时间列「全天」合并为一块并纵向跨所有全天行，随行数自动扩大 -->
        <div
          class="week-hourly-cell week-hourly-time week-hourly-time--allday"
          :style="{ gridRow: `2 / span ${weekAllDayRowCount}`, gridColumn: 1 }"
        >
          全天
        </div>
        <template v-for="alldayRowIndex in weekAllDayRowIndices" :key="'allday-row-' + alldayRowIndex">
          <div
            v-for="(day, di) in weekDays"
            :key="'allday-' + day.dateKey + '-' + alldayRowIndex"
            class="week-hourly-cell week-hourly-slot week-hourly-slot--allday"
            :class="{ today: day.isToday, hovered: hoveredDate === day.dateKey }"
            :style="{ gridRow: 2 + alldayRowIndex, gridColumn: di + 2 }"
            @dragover.prevent="onDayDragover"
            @drop="onDayDrop($event, day.dateKey)"
            @click="onDayClick(day.dateKey)"
            @mouseenter="setHoveredDate(day.dateKey)"
            @mouseleave="clearHoveredDate"
          >
            <div
              v-if="weekAllDayTasks(day.dateKey)[alldayRowIndex]"
              class="week-hourly-event"
              :class="`status-${weekAllDayTasks(day.dateKey)[alldayRowIndex].task.status}`"
              :style="pillStyle(weekAllDayTasks(day.dateKey)[alldayRowIndex].task)"
              draggable="true"
              @click.stop="openEditTask(weekAllDayTasks(day.dateKey)[alldayRowIndex].task)"
              @dragstart="onTaskDragStart($event, weekAllDayTasks(day.dateKey)[alldayRowIndex].task)"
            >
              {{ weekAllDayTasks(day.dateKey)[alldayRowIndex].task.title }}
            </div>
          </div>
        </template>
        <!-- 24 小时行 -->
        <template v-for="(hour, hi) in hourLabels" :key="hour">
          <div
            class="week-hourly-cell week-hourly-time"
            :class="{ 'current-hour': isCurrentHour(hi) }"
            :style="{ gridRow: 2 + weekAllDayRowCount + hi, gridColumn: 1 }"
          >
            {{ hour }}
          </div>
          <div
            v-for="(day, di) in weekDays"
            :key="`${day.dateKey}-${hi}`"
            class="week-hourly-cell week-hourly-slot"
            :class="{ today: day.isToday, hovered: hoveredDate === day.dateKey, 'current-hour': isCurrentHour(hi) }"
            :style="{ gridRow: 2 + weekAllDayRowCount + hi, gridColumn: di + 2 }"
            @dragover.prevent="onDayDragover"
            @drop="onHourDrop($event, day.dateKey, hi)"
            @click="onWeekSlotClick(day.dateKey, hi)"
            @dblclick="onWeekSlotDblClick(day.dateKey)"
            @mouseenter="setHoveredDate(day.dateKey)"
            @mouseleave="clearHoveredDate"
          />
        </template>
        <!-- 带时间的任务块（跨行叠在格子上方） -->
        <div
          v-for="ev in weekTimedEvents"
          :key="ev.task.id"
          class="week-hourly-event week-hourly-event--timed"
          :class="`status-${ev.task.status}`"
          :style="{
            ...pillStyle(ev.task),
            gridRow: `${ev.startRow} / span ${ev.span}`,
            gridColumn: ev.dayCol + 2,
          }"
          draggable="true"
          @click.stop="openEditTask(ev.task)"
          @dragstart="onTaskDragStart($event, ev.task)"
        >
          <span class="week-hourly-event-title">{{ ev.task.title }}</span>
          <span class="week-hourly-event-time">{{ ev.timeLabel }}</span>
        </div>
      </div>
      <div v-if="currentTimeLineVisible" class="week-hourly-now-line" :style="currentTimeLineStyle" />
      <div v-if="currentTimeLineVisible" class="week-hourly-now-label" :style="currentTimeLabelStyle">{{ currentTimeLabel }}</div>
      </div>
    </div>

    <!-- 日视图：当日全部任务列表，展示时间段、优先级等；无任务时显示空状态 -->
    <div v-show="viewMode === 'day'" class="calendar-card calendar-card--day">
      <div class="day-view-header">
        <h2 class="day-view-title">{{ dayViewTitle }}</h2>
      </div>
      <div class="day-view-body">
        <template v-if="(tasksByDate[currentDateKey] ?? []).length">
          <div class="day-view-task-list">
            <div
              v-for="item in (tasksByDate[currentDateKey] ?? [])"
              :key="item.task.id"
              class="day-view-task-card"
              :class="`status-${item.task.status}`"
              :style="pillStyle(item.task)"
              draggable="true"
              @click.stop="openEditTask(item.task)"
              @dragstart="onTaskDragStart($event, item.task)"
              @dragover.prevent="onDayDragover"
              @drop="onDayDrop($event, currentDateKey)"
            >
              <div class="day-view-task-time">{{ formatTaskTimeRange(item.task) }}</div>
              <div class="day-view-task-main">
                <span class="day-view-task-title">{{ item.task.title }}</span>
                <div class="day-view-task-meta">
                  <span class="day-view-task-status" :class="`status-${item.task.status}`">{{ statusLabel(item.task.status) }}</span>
                  <span
                    class="day-view-task-priority"
                    :style="{ background: getPriorityBg(item.task.priority), color: getPriorityColor(item.task.priority) }"
                    :title="getPriorityLabel(item.task.priority)"
                  >{{ getPriorityLabel(item.task.priority) }}</span>
                </div>
                <p v-if="item.task.description?.trim()" class="day-view-task-desc">{{ item.task.description.trim() }}</p>
              </div>
            </div>
          </div>
        </template>
        <div v-else class="day-view-empty-state">
          <svg class="day-view-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <p class="day-view-empty-text">当日暂无任务</p>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import '../styles/components.css';

dayjs.extend(utc);
dayjs.extend(timezone);

/** 用系统本地时间（与系统时钟一致，红线与标签用此保证落在正确的小时格） */
function getLocalNow() {
  const d = new Date();
  const hourOnly = d.getHours();
  const hour = hourOnly + d.getMinutes() / 60 + d.getSeconds() / 3600;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return { dateKey: `${y}-${m}-${day}`, hour, hourOnly };
}

/** 今日日期键（与系统本地时间一致，保证红线与“今天”对应系统时钟） */
const todayDateKey = computed(() => {
  void nowTick.value;
  return getLocalNow().dateKey;
});
import { useTasks } from '@/composables/useTasks';
import tagApi from '@/api/tag';
import { getLunarLabel } from '@/utils/lunar';
import { getPriorityLabel, getPriorityColor, getPriorityBg } from '@/utils/task';
import type { Task, Tag } from '@/types';

const { allTasks, fetchTasks, updateTask, fetchTasksInRange } = useTasks();

/** 日历视图内展示的任务（按可见时间范围拉取，减少请求量；未拉取前回退到 allTasks） */
const calendarTasks = ref<Task[]>([]);
const calendarTaskList = computed(() =>
  calendarTasks.value.length > 0 ? calendarTasks.value : allTasks.value
);
/** 无开始/截止日期且未完成的任务（已完成的不出现在待规划侧栏） */
const undatedTasks = computed(() =>
  calendarTaskList.value.filter(
    (task) => !task.startTime && !task.dueTime && task.status !== 'done'
  )
);
const undatedFilterProject = ref('');
const undatedFilterTag = ref('');
const undatedFilterPriority = ref('');
const openUndatedMenu = ref<'' | 'project' | 'priority' | 'tag'>('');
const allTags = ref<Tag[]>([]);
const tagNameById = computed(() => {
  const map = new Map<number, string>();
  for (const tag of allTags.value) map.set(Number(tag.id), tag.name);
  return map;
});

function taskDisplayTags(task: Task): { id: number; name: string }[] {
  if (task.tags?.length) return task.tags.map((t) => ({ id: t.id, name: t.name }));
  const raw = task as Task & { tag_ids?: unknown };
  const ids = task.tagIds ?? (Array.isArray(raw.tag_ids) ? raw.tag_ids.map((id) => Number(id)) : undefined);
  if (ids?.length) {
    return ids.map((id) => ({
      id: Number(id),
      name: tagNameById.value.get(Number(id)) ?? `标签 #${id}`,
    }));
  }
  return [];
}

const undatedProjectOptions = computed(() => {
  const map = new Map<number, string>();
  for (const task of undatedTasks.value) {
    if (task.projectId == null) continue;
    map.set(task.projectId, task.projectName?.trim() || `项目 #${task.projectId}`);
  }
  return [...map.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label, 'zh-CN'));
});

const undatedTagOptions = computed(() => {
  const map = new Map<number, string>();
  for (const task of undatedTasks.value) {
    for (const tag of taskDisplayTags(task)) map.set(tag.id, tag.name);
  }
  return [...map.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label, 'zh-CN'));
});

const undatedPriorityOptions = computed(() => {
  const map = new Map<string, string>();
  for (const task of undatedTasks.value) {
    const value = String(task.priority);
    map.set(value, getPriorityLabel(task.priority));
  }
  return [...map.entries()].map(([value, label]) => ({ value, label }));
});

const undatedProjectLabel = computed(() =>
  undatedFilterProject.value
    ? undatedProjectOptions.value.find((o) => String(o.value) === undatedFilterProject.value)?.label ?? '项目'
    : '项目'
);
const undatedPriorityLabel = computed(() =>
  undatedFilterPriority.value
    ? undatedPriorityOptions.value.find((o) => o.value === undatedFilterPriority.value)?.label ?? '状态'
    : '状态'
);
const undatedTagLabel = computed(() =>
  undatedFilterTag.value
    ? undatedTagOptions.value.find((o) => String(o.value) === undatedFilterTag.value)?.label ?? '标签'
    : '标签'
);

const filteredUndatedTasks = computed(() =>
  undatedTasks.value.filter((task) => {
    if (undatedFilterProject.value && String(task.projectId ?? '') !== undatedFilterProject.value) return false;
    if (undatedFilterPriority.value && String(task.priority) !== undatedFilterPriority.value) return false;
    if (undatedFilterTag.value) {
      const tags = taskDisplayTags(task);
      if (!tags.some((tag) => String(tag.id) === undatedFilterTag.value)) return false;
    }
    return true;
  })
);

const sortedFilteredUndatedTasks = computed(() => {
  return [...filteredUndatedTasks.value].sort(
    (a, b) => dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf()
  );
});

const SIDEBAR_COUNT_COLORS = [
  { bg: 'rgba(45, 212, 191, 0.24)', color: '#5eead4', border: 'rgba(45, 212, 191, 0.6)' },
  { bg: 'rgba(96, 165, 250, 0.24)', color: '#93c5fd', border: 'rgba(96, 165, 250, 0.6)' },
  { bg: 'rgba(251, 191, 36, 0.22)', color: '#fcd34d', border: 'rgba(251, 191, 36, 0.55)' },
  { bg: 'rgba(244, 114, 182, 0.22)', color: '#f9a8d4', border: 'rgba(244, 114, 182, 0.55)' },
  { bg: 'rgba(167, 139, 250, 0.22)', color: '#c4b5fd', border: 'rgba(167, 139, 250, 0.55)' },
];
const sidebarCountColorIndex = ref(Math.floor(Math.random() * SIDEBAR_COUNT_COLORS.length));
const sidebarCountStyle = computed(() => {
  const c = SIDEBAR_COUNT_COLORS[sidebarCountColorIndex.value];
  return {
    background: c.bg,
    color: c.color,
    borderColor: c.border,
  };
});

watch(() => sortedFilteredUndatedTasks.value.length, () => {
  sidebarCountColorIndex.value = Math.floor(Math.random() * SIDEBAR_COUNT_COLORS.length);
});

function toggleUndatedMenu(menu: '' | 'project' | 'priority' | 'tag') {
  openUndatedMenu.value = openUndatedMenu.value === menu ? '' : menu;
}

function closeUndatedMenu() {
  openUndatedMenu.value = '';
}

function selectUndatedProject(value: string) {
  undatedFilterProject.value = value;
  closeUndatedMenu();
}

function selectUndatedPriority(value: string) {
  undatedFilterPriority.value = value;
  closeUndatedMenu();
}

function selectUndatedTag(value: string) {
  undatedFilterTag.value = value;
  closeUndatedMenu();
}

/** 当前视图可见时间范围（yyyy-MM-dd HH:mm:ss），用于 GET /api/tasks 时间参数；月视图与网格首尾日一致以便跨天/跨月任务能显示 */
const visibleTimeRange = computed(() => {
  const c = current.value;
  if (viewMode.value === 'month') {
    const first = c.startOf('month');
    const last = c.endOf('month');
    const gridStart = first.subtract((first.day() + 6) % 7, 'day');
    const gridEnd = last.add((7 - last.day()) % 7, 'day');
    return {
      startTimeFrom: gridStart.format('YYYY-MM-DD 00:00:00'),
      startTimeTo: gridEnd.format('YYYY-MM-DD 23:59:59'),
      dueTimeFrom: gridStart.format('YYYY-MM-DD 00:00:00'),
      dueTimeTo: gridEnd.format('YYYY-MM-DD 23:59:59'),
    };
  }
  if (viewMode.value === 'week') {
    const start = c.subtract((c.day() + 6) % 7, 'day').startOf('day');
    const end = start.add(6, 'day').endOf('day');
    return {
      startTimeFrom: start.format('YYYY-MM-DD HH:mm:ss'),
      startTimeTo: end.format('YYYY-MM-DD HH:mm:ss'),
      dueTimeFrom: start.format('YYYY-MM-DD HH:mm:ss'),
      dueTimeTo: end.format('YYYY-MM-DD HH:mm:ss'),
    };
  }
  const start = c.startOf('day');
  const end = c.endOf('day');
  return {
    startTimeFrom: start.format('YYYY-MM-DD HH:mm:ss'),
    startTimeTo: end.format('YYYY-MM-DD HH:mm:ss'),
    dueTimeFrom: start.format('YYYY-MM-DD HH:mm:ss'),
    dueTimeTo: end.format('YYYY-MM-DD HH:mm:ss'),
  };
});

async function loadCalendarTasks() {
  try {
    const list = await fetchTasksInRange(visibleTimeRange.value);
    calendarTasks.value = list ?? [];
  } catch {
    calendarTasks.value = [];
  }
}

const current = ref(dayjs());
const viewMode = ref<'month' | 'week' | 'day'>('month');

const viewModes = [
  { label: '月', value: 'month' as const },
  { label: '周', value: 'week' as const },
  { label: '日', value: 'day' as const },
];

/** 周一至周日 */
const weekdays = ['一', '二', '三', '四', '五', '六', '日'];

/** 当前焦点日期键（日视图用） */
const currentDateKey = computed(() => current.value.format('YYYY-MM-DD'));
const undatedPanelCollapsed = ref(true);

/** 导航标题：月/周/日 不同展示 */
const rangeLabel = computed(() => {
  if (viewMode.value === 'month') return current.value.format('YYYY年M月');
  if (viewMode.value === 'week') {
    const start = current.value.subtract((current.value.day() + 6) % 7, 'day');
    const end = start.add(6, 'day');
    return `${start.format('M月D日')} - ${end.format('M月D日')}`;
  }
  return current.value.format('YYYY年M月D日');
});

/** 周视图：本周一至周日 7 天 */
const weekDays = computed(() => {
  const start = current.value.subtract((current.value.day() + 6) % 7, 'day');
  const today = todayDateKey.value;
  const days: { dateKey: string; day: number; weekdayLabel: string; isToday: boolean }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = start.add(i, 'day');
    const dateKey = d.format('YYYY-MM-DD');
    days.push({
      dateKey,
      day: d.date(),
      weekdayLabel: '周' + weekdays[i],
      isToday: dateKey === today,
    });
  }
  return days;
});

const dayViewTitle = computed(() => {
  const d = current.value;
  return `${d.format('M月D日')} 周${weekdays[(d.day() + 6) % 7]}`;
});

/** 24 小时标签 */
const hourLabels = computed(() =>
  Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)
);

/** 带时间任务 id 集合（用于全天去重） */
const weekTimedEventIds = computed(() => new Set(weekTimedEvents.value.map((ev) => ev.task.id)));

/** 是否为“整天”时间段（同一天 00:00 到 23:59），此类在周/日视图按全天显示 */
function isFullDayRange(task: Task): boolean {
  const start = task.startTime ? dayjs(task.startTime) : null;
  const end = task.dueTime ? dayjs(task.dueTime) : null;
  if (!start?.isValid() || !end?.isValid()) return false;
  if (start.format('YYYY-MM-DD') !== end.format('YYYY-MM-DD')) return false;
  const startOfDay = start.hour() === 0 && start.minute() === 0;
  const endOfDay = end.hour() >= 23 && end.minute() >= 59;
  return startOfDay && endOfDay;
}

/** 是否跨天任务（开始日与截止日不同） */
function isCrossDayTask(task: Task): boolean {
  const [startKey, endKey] = taskDateRange(task);
  return !!(startKey && endKey && startKey !== endKey);
}

/** 全天任务：该日期的任务且未在小时格中展示。无时间/整天/跨天任务均显示在全天栏 */
function weekAllDayTasks(dateKey: string): DayTaskItem[] {
  const list = tasksByDate.value[dateKey] ?? [];
  const timedIds = weekTimedEventIds.value;
  return list.filter((item) => {
    if (timedIds.has(item.task.id)) return false;
    const t = item.task;
    if (isCrossDayTask(t)) return true;
    const hasTime = (s: string | undefined) => s && s.length > 10 && (s.includes('T') || s.includes(' '));
    const startHasTime = hasTime(t.startTime);
    const dueHasTime = hasTime(t.dueTime);
    if (!startHasTime || !dueHasTime) return true;
    return isFullDayRange(t);
  });
}

/** 周视图：全天区域行数（取本周内某日全天任务数最大值，至少 1） */
const weekAllDayRowCount = computed(() => {
  let max = 0;
  for (const day of weekDays.value) {
    const n = weekAllDayTasks(day.dateKey).length;
    if (n > max) max = n;
  }
  return Math.max(1, max);
});

/** 周视图：全天行索引 0..N-1，用于 v-for */
const weekAllDayRowIndices = computed(() =>
  Array.from({ length: weekAllDayRowCount.value }, (_, i) => i)
);

interface WeekTimedEvent {
  task: Task;
  dayCol: number;
  startRow: number;
  span: number;
  timeLabel: string;
}

/** 带时间的任务：落在本周且在网格中按小时放置（排除整天 00:00-23:59、跨天任务，二者均显示在全天栏） */
const weekTimedEvents = computed(() => {
  const weekKeys = weekDays.value.map((d) => d.dateKey);
  const result: WeekTimedEvent[] = [];
  for (const task of calendarTaskList.value) {
    const start = task.startTime ? dayjs(task.startTime) : task.dueTime ? dayjs(task.dueTime) : null;
    const end = task.dueTime ? dayjs(task.dueTime) : task.startTime ? dayjs(task.startTime) : null;
    if (!start || !start.isValid()) continue;
    const dateKey = start.format('YYYY-MM-DD');
    const dayCol = weekKeys.indexOf(dateKey);
    if (dayCol === -1) continue;
    const startHasTime = !!(task.startTime && task.startTime.length > 10 && (task.startTime.includes('T') || task.startTime.includes(' ')));
    const endHasTime = !!(task.dueTime && task.dueTime.length > 10 && (task.dueTime.includes('T') || task.dueTime.includes(' ')));
    if (!startHasTime || !endHasTime) continue;
    if (isFullDayRange(task)) continue;
    /** 跨天任务不放入小时格，统一在全天栏展示 */
    if (end?.isValid() && start.format('YYYY-MM-DD') !== end.format('YYYY-MM-DD')) continue;
    const startHour = start.hour() + start.minute() / 60;
    const endHour = end && end.isValid() ? end.hour() + end.minute() / 60 : startHour + 1;
    const span = Math.max(1, Math.min(24, Math.ceil(endHour - startHour)));
    const allDayRows = weekAllDayRowCount.value;
    let startRow = 2 + allDayRows + Math.floor(startHour);
    if (startRow < 2 + allDayRows) startRow = 2 + allDayRows;
    if (startRow + span > 2 + allDayRows + 24) startRow = 2 + allDayRows + 24 - span;
    result.push({
      task,
      dayCol,
      startRow,
      span,
      timeLabel: start.format('HH:mm') + (end && end.isValid() && endHour > startHour ? ' - ' + end.format('HH:mm') : ''),
    });
  }
  return result;
});

function isCurrentHour(hi: number): boolean {
  const b = getLocalNow();
  if (!weekDays.value.some((d) => d.dateKey === b.dateKey)) return false;
  return b.hourOnly === hi;
}

/** 与后端/表单一致：使用 YYYY-MM-DD HH:mm:ss 便于正确持久化与回显 */
function toDateTimeString(d: dayjs.Dayjs): string {
  return d.format('YYYY-MM-DD HH:mm:ss');
}

function applyCalendarTaskOptimistic(taskId: number, payload: Partial<Task>): () => void {
  if (calendarTasks.value.length === 0) return () => {};
  const idx = calendarTasks.value.findIndex((t) => t.id === taskId);
  if (idx < 0) return () => {};
  const prevTask = { ...calendarTasks.value[idx] };
  const next = [...calendarTasks.value];
  next[idx] = { ...next[idx], ...payload };
  calendarTasks.value = next;
  return () => {
    const rollbackList = [...calendarTasks.value];
    const rollbackIdx = rollbackList.findIndex((t) => t.id === taskId);
    if (rollbackIdx < 0) return;
    rollbackList[rollbackIdx] = prevTask;
    calendarTasks.value = rollbackList;
  };
}

async function onHourDrop(e: DragEvent, dateKey: string, hourIndex: number) {
  e.preventDefault();
  const raw = e.dataTransfer?.getData('application/json') || e.dataTransfer?.getData('text/plain');
  if (!raw) return;
  let taskId: number;
  try {
    const data = JSON.parse(raw);
    taskId = data.taskId;
  } catch {
    taskId = Number(raw);
  }
  if (!taskId) return;
  const day = dayjs(dateKey);
  const start = day.hour(hourIndex).minute(0).second(0).millisecond(0);
  const end =
    hourIndex < 23
      ? day.hour(hourIndex + 1).minute(0).second(0).millisecond(0)
      : day.hour(23).minute(59).second(59).millisecond(999);
  const payload = {
    startTime: toDateTimeString(start),
    dueTime: toDateTimeString(end),
  };
  const rollback = applyCalendarTaskOptimistic(taskId, payload);
  try {
    await updateTask(taskId, payload);
  } catch (err) {
    rollback();
    console.warn('[calendar] onHourDrop update failed', err);
  }
}

/** 用于当前时间红线随实时更新（定时刷新以驱动 computed） */
const nowTick = ref(0);

/** 当前时间红线：仅当本周包含今天时显示（按系统本地时间） */
const currentTimeLineVisible = computed(() => {
  void nowTick.value;
  return weekDays.value.some((d) => d.dateKey === getLocalNow().dateKey);
});

/** 周视图网格行动态行高：表头 + 全天多行 + 24 小时 */
const weekHourlyGridRowsStyle = computed(() => {
  const n = weekAllDayRowCount.value;
  return {
    gridTemplateRows: `32px repeat(${n}, 36px) repeat(24, 40px)`,
  };
});

/** 时间网格起始偏移：表头 32px + 全天行(动态行数×36px)，与 grid-template-rows 一致 */
const timeGridTopPx = computed(() => 32 + weekAllDayRowCount.value * 36);

const currentTimeLineStyle = computed(() => {
  void nowTick.value;
  const { hour } = getLocalNow();
  const topPx = timeGridTopPx.value + hour * 40;
  return { top: `${topPx}px` };
});

/** 红线时间标签：显示在对应小时下方，不遮挡时间列整点 */
const currentTimeLabelStyle = computed(() => {
  void nowTick.value;
  const { hour } = getLocalNow();
  const topPx = timeGridTopPx.value + hour * 40 + 6;
  return { top: `${topPx}px` };
});

/** 当前时间文案（系统本地 HH:mm），显示在红线左侧 */
const currentTimeLabel = computed(() => {
  void nowTick.value;
  const { hour } = getLocalNow();
  const h = Math.floor(hour);
  const m = Math.floor((hour - h) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
});

/** 日历格：按周一到周日排列，首列为周一 */
const calendarDays = computed(() => {
  const first = current.value.startOf('month');
  const last = current.value.endOf('month');
  const start = first.subtract((first.day() + 6) % 7, 'day');
  const end = last.add((7 - last.day()) % 7, 'day');
  const days: { day: number; dateKey: string; isCurrentMonth: boolean; isToday: boolean }[] = [];
  let d = start;
  const today = todayDateKey.value;
  while (d.isBefore(end) || d.isSame(end, 'day')) {
    const dateKey = d.format('YYYY-MM-DD');
    days.push({
      day: d.date(),
      dateKey,
      isCurrentMonth: d.month() === current.value.month(),
      isToday: dateKey === today,
    });
    d = d.add(1, 'day');
  }
  return days;
});

/** 日视图：任务时间段文案（如 "09:00 - 10:30" 或 "全天"） */
function formatTaskTimeRange(task: Task): string {
  const hasTime = (s: string | undefined) => s && s.length > 10 && (s.includes('T') || s.includes(' '));
  const startHasTime = hasTime(task.startTime);
  const dueHasTime = hasTime(task.dueTime);
  if (!startHasTime && !dueHasTime) return '全天';
  if (isFullDayRange(task)) return '全天';
  const start = task.startTime ? dayjs(task.startTime) : task.dueTime ? dayjs(task.dueTime) : null;
  const end = task.dueTime ? dayjs(task.dueTime) : task.startTime ? dayjs(task.startTime) : null;
  if (!start?.isValid()) return '全天';
  if (!end?.isValid()) return start.format('HH:mm');
  return `${start.format('HH:mm')} - ${end.format('HH:mm')}`;
}

const STATUS_LABELS: Record<Task['status'], string> = {
  todo: '待办',
  doing: '进行中',
  done: '已完成',
  stalled: '搁置',
};
function statusLabel(status: Task['status']): string {
  return STATUS_LABELS[status] ?? status;
}

/** 任务日期范围：按开始/截止中最早与最晚的日期作为跨天展示区间 */
function taskDateRange(task: Task): [string, string] {
  const dates: string[] = [];
  if (task.startTime) dates.push(dayjs(task.startTime).format('YYYY-MM-DD'));
  if (task.dueTime) dates.push(dayjs(task.dueTime).format('YYYY-MM-DD'));
  if (dates.length === 0) return ['', ''];
  if (dates.length === 1) return [dates[0], dates[0]];
  const startKey = dates[0] <= dates[1] ? dates[0] : dates[1];
  const endKey = dates[0] <= dates[1] ? dates[1] : dates[0];
  return [startKey, endKey];
}

interface DayTaskItem {
  task: Task;
  spanStart: boolean;
  spanEnd: boolean;
  spanMid: boolean;
}

const tasksByDate = computed(() => {
  const map: Record<string, DayTaskItem[]> = {};
  for (const task of calendarTaskList.value) {
    const [startKey, endKey] = taskDateRange(task);
    if (!startKey) continue;
    let d = dayjs(startKey);
    const end = dayjs(endKey);
    while (d.isBefore(end) || d.isSame(end, 'day')) {
      const key = d.format('YYYY-MM-DD');
      if (!map[key]) map[key] = [];
      map[key].push({
        task,
        spanStart: key === startKey,
        spanEnd: key === endKey,
        spanMid: key !== startKey && key !== endKey,
      });
      d = d.add(1, 'day');
    }
  }
  return map;
});

function isSingleDayTask(task: Task): boolean {
  const [s, e] = taskDateRange(task);
  return !!s && s === e;
}

/** 仅单日任务，用于月视图格子内的 pill 展示（跨天任务用下方 span bar 展示） */
const singleDayTasksByDate = computed(() => {
  const map: Record<string, DayTaskItem[]> = {};
  for (const [dateKey, items] of Object.entries(tasksByDate.value)) {
    const single = items.filter((i) => isSingleDayTask(i.task));
    if (single.length) map[dateKey] = single;
  }
  return map;
});

/** 月视图：日期在网格中的下标 (0..length-1)，用于计算跨天条的行列 */
const dateKeyToIndex = computed(() => {
  const days = calendarDays.value;
  const map: Record<string, number> = {};
  days.forEach((d, i) => { map[d.dateKey] = i; });
  return map;
});

interface MonthSpanSegment {
  task: Task;
  row: number;
  colStart: number;
  colEnd: number;
  isFirstSegment: boolean;
  isLastSegment: boolean;
  segmentKey: string;
}

/** 月视图：跨天任务按「周行 + 列范围」拆成的连续条段，用于一条横条画到结束日；起止超出当月网格时截断到可见范围 */
const monthSpanSegments = computed(() => {
  const days = calendarDays.value;
  const keyToIndex = dateKeyToIndex.value;
  const segments: MonthSpanSegment[] = [];
  const maxIndex = days.length - 1;
  for (const task of calendarTaskList.value) {
    const [startKey, endKey] = taskDateRange(task);
    if (!startKey || startKey === endKey) continue;
    let startIndex = keyToIndex[startKey];
    let endIndex = keyToIndex[endKey];
    if (startIndex == null && endIndex == null) continue;
    if (startIndex == null) startIndex = 0;
    if (endIndex == null) endIndex = maxIndex;
    if (startIndex > endIndex) continue;
    const startRow = Math.floor(startIndex / 7);
    const startCol = startIndex % 7;
    const endRow = Math.floor(endIndex / 7);
    const endCol = endIndex % 7;
    for (let r = startRow; r <= endRow; r++) {
      const c0 = r === startRow ? startCol : 0;
      const c1 = r === endRow ? endCol : 6;
      segments.push({
        task,
        row: r,
        colStart: c0,
        colEnd: c1,
        isFirstSegment: r === startRow,
        isLastSegment: r === endRow,
        segmentKey: `span-${task.id}-${r}`,
      });
    }
  }
  return segments;
});

function dayGridStyle(index: number): { gridRow: string; gridColumn: string } {
  const r = Math.floor(index / 7) + 1;
  const c = (index % 7) + 1;
  return { gridRow: String(r), gridColumn: String(c) };
}

/** 按任务 id 生成稳定随机颜色（浅色背景 + 深色左边框） */
const TASK_COLORS = [
  { bg: 'rgba(45, 212, 191, 0.25)', border: '#0d9488' },
  { bg: 'rgba(34, 197, 94, 0.25)', border: '#22c55e' },
  { bg: 'rgba(234, 179, 8, 0.25)', border: '#eab308' },
  { bg: 'rgba(239, 68, 68, 0.2)', border: '#ef4444' },
  { bg: 'rgba(168, 85, 247, 0.25)', border: '#a855f7' },
  { bg: 'rgba(236, 72, 153, 0.2)', border: '#ec4899' },
  { bg: 'rgba(20, 184, 166, 0.25)', border: '#14b8a6' },
  { bg: 'rgba(249, 115, 22, 0.25)', border: '#f97316' },
];

function taskColor(taskId: number): { bg: string; border: string } {
  return TASK_COLORS[Math.abs(taskId) % TASK_COLORS.length];
}

function pillStyle(task: Task): Record<string, string> {
  if (task.status === 'done') return {};
  const { bg, border } = taskColor(task.id);
  return { backgroundColor: bg, borderLeftColor: border };
}

function onDayClick(dateKey: string) {
  selectedDate.value = dateKey;
  window.dispatchEvent(new CustomEvent('open-create-task', { detail: { dueTime: dateKey } }));
}

/** 周视图：点击某一小时时间段新建任务，开始/截止默认在该时段内（如 02:00–03:00） */
function onHourSlotClick(dateKey: string, hourIndex: number) {
  selectedDate.value = dateKey;
  const day = dayjs(dateKey);
  const start = day.hour(hourIndex).minute(0).second(0).millisecond(0);
  const end = start.add(1, 'hour');
  window.dispatchEvent(new CustomEvent('open-create-task', {
    detail: {
      startTime: toDateTimeString(start),
      dueTime: toDateTimeString(end),
    },
  }));
}

function openEditTask(task: Task) {
  window.dispatchEvent(new CustomEvent('open-edit-task', { detail: { task } }));
}

function onTaskDragStart(e: DragEvent, task: Task) {
  if (!e.dataTransfer) return;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('application/json', JSON.stringify({ taskId: task.id }));
  e.dataTransfer.setData('text/plain', String(task.id));
}

function onDayDragover(e: DragEvent) {
  e.dataTransfer && (e.dataTransfer.dropEffect = 'move');
}

function getTaskIdFromDragEvent(e: DragEvent): number {
  const raw = e.dataTransfer?.getData('application/json') || e.dataTransfer?.getData('text/plain');
  if (!raw) return 0;
  try {
    const data = JSON.parse(raw) as { taskId?: number };
    return Number(data.taskId ?? 0);
  } catch {
    return Number(raw);
  }
}

/** 拖动到某日期：月视图中始终整条任务移到该日（不跨天）；周/日视图中若在终点之后则延长 dueTime，在起点之前则延长 startTime，否则整条移到该日。 */
async function onDayDrop(e: DragEvent, dateKey: string) {
  e.preventDefault();
  const taskId = getTaskIdFromDragEvent(e);
  if (!taskId) return;
  const task = calendarTaskList.value.find(t => t.id === taskId);
  const dropDate = dateKey;
  const payload: { dueTime?: string; startTime?: string } = {};
  if (task) {
    if (viewMode.value === 'month') {
      payload.startTime = toDateTimeString(dayjs(dropDate).startOf('day'));
      payload.dueTime = toDateTimeString(dayjs(dropDate).endOf('day'));
    } else {
      const [startKey, endKey] = taskDateRange(task);
      if (startKey && endKey) {
        const isSingleDay = startKey === endKey;
        if (dropDate > endKey) {
          payload.dueTime = toDateTimeString(dayjs(dropDate).endOf('day'));
          if (isSingleDay) payload.startTime = toDateTimeString(dayjs(startKey).startOf('day'));
        } else if (dropDate < startKey) {
          payload.startTime = toDateTimeString(dayjs(dropDate).startOf('day'));
          if (isSingleDay) payload.dueTime = toDateTimeString(dayjs(endKey).endOf('day'));
        } else {
          payload.startTime = toDateTimeString(dayjs(dropDate).startOf('day'));
          payload.dueTime = toDateTimeString(dayjs(dropDate).endOf('day'));
        }
      } else {
        payload.dueTime = toDateTimeString(dayjs(dropDate).endOf('day'));
      }
    }
  }
  if (Object.keys(payload).length === 0) {
    payload.dueTime = toDateTimeString(dayjs(dropDate).endOf('day'));
  }
  const rollback = applyCalendarTaskOptimistic(taskId, payload);
  try {
    await updateTask(taskId, payload);
  } catch (err) {
    rollback();
    console.warn('[calendar] onDayDrop update failed', err);
  }
}

const undatedDropActive = ref(false);

function onUndatedDragover(e: DragEvent) {
  undatedDropActive.value = true;
  onDayDragover(e);
}

function onUndatedDragleave(e: DragEvent) {
  const next = e.relatedTarget as Node | null;
  if (!next || !(e.currentTarget as HTMLElement | null)?.contains(next)) {
    undatedDropActive.value = false;
  }
}

async function onUndatedDrop(e: DragEvent) {
  e.preventDefault();
  undatedDropActive.value = false;
  const taskId = getTaskIdFromDragEvent(e);
  if (!taskId) return;
  const optimisticPayload = { startTime: '', dueTime: '' } as unknown as Partial<Task>;
  const rollback = applyCalendarTaskOptimistic(taskId, optimisticPayload);
  try {
    let updated = await updateTask(taskId, { startTime: null, dueTime: null } as unknown as Partial<Task>);
    const stillScheduled = !!(updated?.startTime || updated?.dueTime);
    if (stillScheduled) {
      updated = await updateTask(taskId, {
        startTime: '',
        dueTime: '',
        start_time: null,
        due_time: null,
      } as unknown as Partial<Task>);
    }
  } catch (err) {
    rollback();
    console.warn('[calendar] onUndatedDrop update failed', err);
  }
}

const selectedDate = ref(dayjs().format('YYYY-MM-DD'));
const hoveredDate = ref('');

function setHoveredDate(dateKey: string) {
  hoveredDate.value = dateKey;
}

function clearHoveredDate() {
  hoveredDate.value = '';
}

/** 月视图日期格：单击延迟打开新建任务，双击则取消打开并跳转周视图 */
let monthDayClickTimer: ReturnType<typeof setTimeout> | null = null;
function onMonthDayClick(dateKey: string) {
  if (monthDayClickTimer != null) {
    clearTimeout(monthDayClickTimer);
    monthDayClickTimer = null;
  }
  monthDayClickTimer = setTimeout(() => {
    monthDayClickTimer = null;
    onDayClick(dateKey);
  }, 250);
}
function onMonthDayDblClick(dateKey: string) {
  if (monthDayClickTimer != null) {
    clearTimeout(monthDayClickTimer);
    monthDayClickTimer = null;
  }
  goToWeekView(dateKey);
}

/** 周视图小时格：单击延迟打开新建，双击则取消打开并跳转日视图 */
let weekSlotClickTimer: ReturnType<typeof setTimeout> | null = null;
function onWeekSlotClick(dateKey: string, hi: number) {
  if (weekSlotClickTimer != null) {
    clearTimeout(weekSlotClickTimer);
    weekSlotClickTimer = null;
  }
  weekSlotClickTimer = setTimeout(() => {
    weekSlotClickTimer = null;
    onHourSlotClick(dateKey, hi);
  }, 250);
}
function onWeekSlotDblClick(dateKey: string) {
  if (weekSlotClickTimer != null) {
    clearTimeout(weekSlotClickTimer);
    weekSlotClickTimer = null;
  }
  goToDayView(dateKey);
}

function prev() {
  if (viewMode.value === 'month') current.value = current.value.subtract(1, 'month');
  else if (viewMode.value === 'week') current.value = current.value.subtract(1, 'week');
  else current.value = current.value.subtract(1, 'day');
}

function next() {
  if (viewMode.value === 'month') current.value = current.value.add(1, 'month');
  else if (viewMode.value === 'week') current.value = current.value.add(1, 'week');
  else current.value = current.value.add(1, 'day');
}

const prevLabel = computed(() =>
  viewMode.value === 'month' ? '上一月' : viewMode.value === 'week' ? '上一周' : '上一天'
);
const nextLabel = computed(() =>
  viewMode.value === 'month' ? '下一月' : viewMode.value === 'week' ? '下一周' : '下一天'
);

function goToday() {
  current.value = dayjs();
  selectedDate.value = dayjs().format('YYYY-MM-DD');
}

/** 月视图双击某日：切换到周视图并定位到该日所在周 */
function goToWeekView(dateKey: string) {
  current.value = dayjs(dateKey);
  selectedDate.value = dateKey;
  viewMode.value = 'week';
}

/** 点击周视图表头某日：切换到日视图并定位到该日；周视图双击某一小时格也会跳转该日 */
function goToDayView(dateKey: string) {
  current.value = dayjs(dateKey);
  selectedDate.value = dateKey;
  viewMode.value = 'day';
}

async function onTaskChanged() {
  await Promise.all([
    fetchTasks(undefined, { skipGlobalError: true }).catch(() => {}),
    loadCalendarTasks(),
  ]);
}

/** store 内 update/move 后也会派发 task-updated，与 task-created / task-deleted 一并刷新日历数据 */
function onTaskUpdatedSync() {
  void onTaskChanged();
}

/** 响应全局刷新按钮：在日历的月/周/日任一界面点击刷新时，按当前时间范围重新拉取任务 */
function onRefreshView(e: Event) {
  const d = (e as CustomEvent).detail as { view?: string } | undefined;
  const targetView = d?.view;
  if (targetView !== 'Calendar' && targetView != null) return;
  loadCalendarTasks();
}

let nowTickTimer: ReturnType<typeof setInterval> | null = null;
onMounted(() => {
  tagApi.getList({ skipGlobalError: true }).then((list) => { allTags.value = list ?? []; }).catch(() => { allTags.value = []; });
  loadCalendarTasks();
  fetchTasks(undefined, { skipGlobalError: true }).catch(() => {});
  window.addEventListener('task-created', onTaskChanged);
  window.addEventListener('task-updated', onTaskUpdatedSync);
  window.addEventListener('task-deleted', onTaskChanged);
  window.addEventListener('refresh-view', onRefreshView);
  nowTickTimer = setInterval(() => {
    nowTick.value = Date.now();
  }, 10000);
});

watch([current, viewMode], () => {
  loadCalendarTasks();
});

onUnmounted(() => {
  window.removeEventListener('task-created', onTaskChanged);
  window.removeEventListener('task-updated', onTaskUpdatedSync);
  window.removeEventListener('task-deleted', onTaskChanged);
  window.removeEventListener('refresh-view', onRefreshView);
  if (nowTickTimer) clearInterval(nowTickTimer);
});
</script>

<style scoped>
@import '../styles/components.css';

.calendar-page {
  padding: var(--spacing-md) var(--spacing-lg) var(--spacing-md) 0;
  flex: 1;
  min-height: 0;
  height: 100%;
  display: flex;
  flex-direction: row;
  gap: var(--spacing-lg);
  background: var(--bg-primary);
  overflow: hidden;
}

.calendar-main {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  overflow: auto;
}

.calendar-sidebar {
  position: relative;
  width: 220px;
  min-width: 220px;
  background: var(--card, var(--bg-secondary));
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-soft);
  transition: width 0.2s ease, min-width 0.2s ease;
  overflow: hidden;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* 收起：无卡片条、无边框，仅保留与展开时同尺寸的箭头按钮 */
.calendar-sidebar.collapsed {
  width: auto;
  min-width: 0;
  background: transparent;
  border: none;
  box-shadow: none;
  justify-content: center;
}

.calendar-sidebar.collapsed .sidebar-toggle {
  position: relative;
  top: auto;
  right: auto;
  transform: none;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
}

.sidebar-toggle {
  position: absolute;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
  width: 100%;
  height: 34px;
  border: none;
  border-radius: 0;
  background: transparent;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
}

.sidebar-toggle:hover {
  color: var(--accent-primary);
}

.sidebar-toggle-icon {
  display: block;
  flex-shrink: 0;
}

/* 收起时箭头固定像素，避免随窄条拉伸；展开时仍铺满 34×34 按钮（与改前一致） */
.calendar-sidebar.collapsed .sidebar-toggle-icon {
  width: 24px;
  height: 24px;
}

.calendar-sidebar:not(.collapsed) .sidebar-toggle-icon {
  width: 100%;
  height: 100%;
}

.calendar-sidebar:not(.collapsed) .sidebar-toggle {
  width: 34px;
}

.sidebar-content {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-height: 0;
}

.sidebar-content.undated-drop-active {
  outline: 1px dashed rgba(45, 212, 191, 0.8);
  outline-offset: -4px;
  background: rgba(45, 212, 191, 0.08);
}

.sidebar-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.sidebar-title {
  margin: 0;
  font-size: var(--font-size-base);
  color: var(--text-primary);
}

.sidebar-count {
  font-size: 12px;
  color: var(--text-primary);
  background: var(--bg-tertiary);
  border: 1px solid transparent;
  border-radius: 999px;
  padding: 1px 8px;
  font-weight: 700;
}

.undated-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.undated-toolbar-btn {
  height: 32px;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  background: linear-gradient(180deg, rgba(14, 32, 55, 0.95), rgba(7, 20, 36, 0.95));
  color: var(--text-primary);
  font-size: 12px;
  padding: 0 10px;
}

.undated-toolbar-btn {
  cursor: pointer;
  position: relative;
}

.undated-toolbar-btn--arrow {
  padding-right: 24px;
}

.undated-toolbar-btn--arrow::after {
  content: '';
  position: absolute;
  right: 9px;
  top: 50%;
  width: 7px;
  height: 7px;
  border-right: 1.5px solid currentColor;
  border-bottom: 1.5px solid currentColor;
  transform: translateY(-65%) rotate(45deg);
}

.undated-dropdown {
  position: relative;
}

.undated-dropdown-menu {
  position: absolute;
  top: 36px;
  left: 0;
  z-index: 20;
  min-width: 140px;
  padding: 4px;
  border-radius: 10px;
  border: 1px solid rgba(45, 212, 191, 0.35);
  background: linear-gradient(180deg, rgba(10, 26, 44, 0.98), rgba(6, 16, 29, 0.98));
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
}

.undated-dropdown-item {
  width: 100%;
  height: 30px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--text-primary);
  text-align: left;
  padding: 0 10px;
  font-size: 12px;
  cursor: pointer;
}

.undated-dropdown-item:hover,
.undated-dropdown-item.active {
  background: rgba(0, 140, 255, 0.35);
}

.undated-toolbar-btn:hover {
  border-color: rgba(45, 212, 191, 0.5);
}

/* 截断侧栏高度链，避免列表被内容无限撑高导致无法出现滚动 */
.undated-task-panel {
  display: flex;
  flex-direction: column;
  flex: 1 1 0%;
  min-height: 0;
  overflow: hidden;
}

/* 独立滚动层：仅内容超出时显示滚动条；不要用内部 flex 列包任务（易触发 min-height:auto 撑开） */
.undated-task-scroll {
  flex: 1 1 0%;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  padding-right: 4px;
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.65) rgba(30, 41, 59, 0.85);
}

.undated-task-scroll::-webkit-scrollbar {
  width: 10px;
}

.undated-task-scroll::-webkit-scrollbar-track {
  background: rgba(30, 41, 59, 0.6);
  border-radius: 6px;
}

.undated-task-scroll::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.55);
  border-radius: 6px;
  border: 2px solid transparent;
  background-clip: padding-box;
}

.undated-task-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.85);
  border: 2px solid transparent;
  background-clip: padding-box;
}

.undated-task-item + .undated-task-item {
  margin-top: 6px;
}

.undated-task-item {
  font-size: 12px;
  padding: 6px 8px;
  border-radius: 8px;
  border-left: 3px solid var(--accent-primary);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}

.undated-task-item:hover {
  filter: brightness(0.97);
}

.undated-task-item.status-done {
  background: var(--bg-tertiary) !important;
  border-left-color: var(--text-tertiary) !important;
  color: var(--text-tertiary);
  text-decoration: line-through;
}

/* 无任务 / 筛选无结果：仅展示居中放大空状态图标，不显示说明文案 */
.undated-empty-wrap {
  flex: 1 1 0%;
  min-height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 8px;
}

.undated-empty-icon {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  color: var(--text-tertiary);
  opacity: 0.45;
}

.page-header.calendar-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
}

.calendar-header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.page-title {
  margin: 0;
  font-size: var(--font-size-h1);
  font-weight: 600;
  color: var(--text-primary);
}

.calendar-view-tabs {
  display: flex;
  gap: 2px;
  background: var(--bg-tertiary);
  padding: 2px;
  border-radius: var(--radius-md);
}

.view-tab {
  padding: 6px 14px;
  border: none;
  border-radius: 6px;
  font-size: var(--font-size-base);
  font-weight: 500;
  color: var(--text-secondary);
  background: transparent;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.view-tab:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.view-tab.active {
  color: var(--text-primary);
  background: var(--card, var(--bg-secondary));
  box-shadow: var(--shadow-soft);
}

.calendar-nav {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.calendar-month-label {
  min-width: 160px;
  text-align: center;
  font-weight: 600;
  color: var(--text-primary);
}

.calendar-card {
  background: var(--card, var(--bg-secondary));
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-soft);
  border: 1px solid var(--border-subtle);
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 4px;
  margin-bottom: var(--spacing-sm);
  font-size: var(--font-size-small);
  font-weight: 600;
  color: var(--text-secondary);
}

.weekday {
  text-align: center;
  padding: var(--spacing-xs) 0;
}

.calendar-grid {
  display: grid;
  /* minmax(0,1fr) 防止长单词/长标题撑开列宽 */
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 4px;
  flex: 1;
  min-height: 320px;
  min-width: 0;
}

.calendar-day {
  position: relative;
  min-width: 0;
  min-height: 72px;
  padding: var(--spacing-xs);
  border-radius: var(--radius-md);
  background: var(--bg-tertiary);
  border: 1px solid transparent;
  transition: background 0.2s, border-color 0.2s;
  overflow: visible;
}

.day-task-overflow {
  position: absolute;
  top: 0;
  right: 0;
  font-size: 10px;
  font-weight: 600;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  padding: 1px 6px;
  border-radius: 999px;
}

.calendar-day.other-month {
  opacity: 0.5;
}

.calendar-day.today {
  border-color: var(--accent-primary);
  background: var(--accent-neon-soft, rgba(45, 212, 191, 0.08));
}

.calendar-day.selected {
  border-color: var(--accent-primary);
  background: rgba(45, 212, 191, 0.15);
  box-shadow: 0 0 0 2px rgba(45, 212, 191, 0.2);
}

.calendar-day.hovered {
  border-color: var(--accent-primary);
  background: rgba(45, 212, 191, 0.12);
  box-shadow: 0 0 0 1px rgba(45, 212, 191, 0.2);
}

.calendar-day.has-tasks:hover {
  background: var(--bg-hover);
}

/* 月视图跨天任务：一条横条连续跨格，仅首段显示标题；z-index 确保压在日期格上方 */
.month-span-bar {
  position: relative;
  z-index: 1;
  align-self: end;
  min-width: 0;
  width: 100%;
  max-width: 100%;
  min-height: 24px;
  margin-bottom: 4px;
  padding: 3px 8px;
  font-size: 11px;
  color: var(--text-primary);
  border-left: 3px solid var(--accent-primary);
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.month-span-bar__text {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.month-span-bar:hover {
  filter: brightness(0.97);
}
.month-span-bar.span-bar-start {
  border-radius: 8px 0 0 8px;
}
.month-span-bar.span-bar-end {
  border-radius: 0 8px 8px 0;
}
.month-span-bar:not(.span-bar-start):not(.span-bar-end) {
  border-radius: 0;
}
.month-span-bar.status-done {
  background: var(--bg-tertiary) !important;
  border-left-color: var(--text-tertiary) !important;
  color: var(--text-tertiary);
  opacity: 0.9;
  text-decoration: line-through;
}

.day-header {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0;
  margin-bottom: 2px;
  min-height: 20px;
}

.day-num {
  font-size: var(--font-size-small);
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.2;
}

.day-lunar {
  font-size: 11px;
  color: var(--text-secondary);
  line-height: 1.2;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.day-tasks {
  margin-top: 4px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.day-task-pill {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 8px;
  min-width: 0;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-primary);
  border-left: 3px solid var(--accent-primary);
  cursor: pointer;
  display: block;
  text-align: left;
}

.day-task-pill:hover {
  filter: brightness(0.97);
}

/* 已完成任务：该任务在日历上显示的每一天均置灰 */
.day-task-pill.status-done {
  background: var(--bg-tertiary) !important;
  border-left-color: var(--text-tertiary) !important;
  color: var(--text-tertiary);
  opacity: 0.9;
  text-decoration: line-through;
}

/* 跨天连续条：首日圆角在左，末日在右，中间无圆角；负 margin 与 grid gap 抵消，视觉连成一条 */
.day-task-pill.span-start {
  border-radius: 8px 0 0 8px;
}

.day-task-pill.span-end {
  border-radius: 0 8px 8px 0;
  margin-right: -4px;
}

.day-task-pill.span-mid {
  border-radius: 0;
  margin-left: -4px;
  margin-right: -4px;
}

/* 周视图 */
.calendar-card--week {
  display: flex;
  flex-direction: column;
  min-height: 280px;
}

.week-header {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 4px;
  margin-bottom: var(--spacing-sm);
  padding-bottom: var(--spacing-xs);
  border-bottom: 1px solid var(--border-subtle);
}

.week-day-col {
  text-align: center;
  padding: var(--spacing-xs);
  border-radius: var(--radius-md);
}

.week-day-col.today {
  background: var(--accent-neon-soft, rgba(45, 212, 191, 0.08));
  color: var(--accent-primary);
}

.week-day-label {
  display: block;
  font-size: var(--font-size-small);
  color: var(--text-secondary);
  margin-bottom: 2px;
}

.week-day-num {
  display: block;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
}

.week-day-num:hover {
  color: var(--accent-primary);
}

.week-body {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 4px;
  flex: 1;
  min-height: 0;
  min-width: 0;
  align-content: start;
}

.week-day-col--tasks {
  min-width: 0;
  padding: var(--spacing-xs);
  border-radius: var(--radius-md);
  background: var(--bg-tertiary);
  border: 1px solid transparent;
  min-height: 120px;
}

.week-day-col--tasks.today {
  border-color: var(--accent-primary);
  background: var(--accent-neon-soft, rgba(45, 212, 191, 0.06));
}

.week-day-col--tasks .day-task-pill {
  margin-bottom: 4px;
}

.week-overflow {
  position: relative;
  top: 0;
  right: 0;
  margin-top: 4px;
}

/* 周视图：24 小时逐小时网格 */
.calendar-card--week-hourly {
  overflow: auto;
}

.week-hourly-body {
  position: relative;
}

.week-hourly-grid {
  display: grid;
  grid-template-columns: 56px repeat(7, minmax(0, 1fr));
  /* 全天行固定 36px，保证红线 top 偏移与时间格一致 */
  grid-template-rows: 32px 36px repeat(24, 40px);
  gap: 0;
  min-width: 600px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  overflow: visible;
}

.week-hourly-cell {
  border-right: 1px solid var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
  min-height: 0;
}

.week-hourly-cell:last-of-type,
.week-hourly-cell[style*="grid-column: 8"] {
  border-right: none;
}

.week-hourly-time {
  padding: 6px 8px;
  font-size: var(--font-size-small);
  color: var(--text-secondary);
  background: var(--bg-tertiary);
  text-align: right;
}

.week-hourly-time--allday {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.week-hourly-time-row.current-hour {
  color: var(--accent-primary);
  font-weight: 600;
}

.week-hourly-day {
  padding: 6px 8px;
  font-size: var(--font-size-small);
  font-weight: 600;
  color: var(--text-primary);
  background: var(--bg-tertiary);
  text-align: center;
}

.week-hourly-day.today {
  background: var(--accent-neon-soft, rgba(45, 212, 191, 0.12));
  color: var(--accent-primary);
}

.week-hourly-day--clickable {
  cursor: pointer;
}

.week-hourly-day--clickable:hover {
  background: var(--bg-hover, rgba(0, 0, 0, 0.04));
}

.week-hourly-day.hovered {
  background: rgba(45, 212, 191, 0.12);
}

.week-hourly-slot {
  padding: 4px;
  background: var(--card, #fff);
  cursor: pointer;
  min-height: 40px;
  overflow: visible;
}

.week-hourly-slot--allday {
  min-height: 0;
  max-height: 36px;
  overflow-y: auto;
  overflow-x: hidden;
}

.week-hourly-slot.today {
  background: var(--accent-neon-soft, rgba(45, 212, 191, 0.04));
}

.week-hourly-slot.current-hour {
  background: rgba(45, 212, 191, 0.08);
}

.week-hourly-slot:hover {
  background: var(--bg-hover);
}

.week-hourly-slot.hovered {
  background: rgba(45, 212, 191, 0.08);
}

.week-hourly-event {
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  margin-bottom: 2px;
  border-left: 3px solid var(--accent-primary);
}

.week-hourly-event--timed {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  min-width: 0;
  min-height: 0;
  padding: 5px 6px;
  overflow: hidden;
  z-index: 1;
  line-height: 1.35;
}

/* 周视图：已完成任务置灰 */
.week-hourly-event.status-done {
  background: var(--bg-tertiary) !important;
  border-left-color: var(--text-tertiary) !important;
  color: var(--text-tertiary);
  opacity: 0.9;
}
.week-hourly-event.status-done .week-hourly-event-title,
.week-hourly-event.status-done .week-hourly-event-time {
  color: var(--text-tertiary);
}
.week-hourly-event.status-done .week-hourly-event-title {
  text-decoration: line-through;
}

.week-hourly-event-title {
  display: block;
  min-width: 0;
  font-weight: 500;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  line-height: 1.35;
  min-height: 1.35em;
}

.week-hourly-event-time {
  font-size: 10px;
  color: var(--text-secondary);
  margin-top: 2px;
  line-height: 1.35;
}

.week-hourly-now-line {
  position: absolute;
  left: 57px;
  right: 0;
  height: 2px;
  background: var(--danger, #ef4444);
  pointer-events: none;
  z-index: 2;
}

.week-hourly-now-line::after {
  content: '';
  position: absolute;
  right: 0;
  top: -4px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--danger, #ef4444);
}

.week-hourly-now-label {
  position: absolute;
  left: 0;
  width: 56px;
  height: 20px;
  font-size: var(--font-size-small);
  font-weight: 600;
  color: var(--danger, #ef4444);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 6px;
  box-sizing: border-box;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  pointer-events: none;
  z-index: 2;
}

/* 日视图 */
.calendar-card--day {
  min-height: 200px;
}

.day-view-body {
  position: relative;
}

.day-view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--border-subtle);
}

.day-view-title {
  margin: 0;
  font-size: var(--font-size-title);
  font-weight: 600;
  color: var(--text-primary);
}

.day-view-task-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.day-view-task-card {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
  border-left-width: 4px;
  background: var(--card, #fff);
  cursor: pointer;
  transition: background-color 0.15s, border-left-color 0.15s;
}

.day-view-task-card:hover {
  filter: brightness(0.98);
}

/* 日视图：已完成任务置灰 */
.day-view-task-card.status-done {
  opacity: 0.9;
  background: var(--bg-tertiary) !important;
  border-left-color: var(--text-tertiary) !important;
}
.day-view-task-card.status-done .day-view-task-title {
  color: var(--text-tertiary);
  text-decoration: line-through;
}
.day-view-task-card.status-done .day-view-task-time,
.day-view-task-card.status-done .day-view-task-meta {
  color: var(--text-tertiary);
}

.day-view-task-time {
  flex-shrink: 0;
  font-size: var(--font-size-small);
  font-weight: 600;
  color: var(--text-secondary);
  min-width: 5em;
}

.day-view-task-main {
  flex: 1;
  min-width: 0;
}

.day-view-task-title {
  font-weight: 600;
  color: var(--text-primary);
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.day-view-task-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-xs);
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-secondary);
}

.day-view-task-status {
  padding: 3px 8px;
  border-radius: 999px;
  color: #fff;
}

.day-view-task-status.status-todo {
  background: var(--color-status-todo);
}

.day-view-task-status.status-doing {
  background: var(--color-status-doing);
  color: #1a1a1a;
}

.day-view-task-status.status-done {
  background: var(--color-status-done);
}

.day-view-task-status.status-stalled {
  background: var(--color-status-stalled);
}

.day-view-task-priority {
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.day-view-task-desc {
  margin: 6px 0 0;
  font-size: var(--font-size-small);
  color: var(--text-secondary);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.day-view-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  color: var(--text-tertiary);
  min-height: 80px;
}

.day-view-empty-icon {
  width: 48px;
  height: 48px;
  margin-bottom: var(--spacing-sm);
  opacity: 0.6;
}

.day-view-empty-text {
  margin: 0;
  font-size: var(--font-size-small);
  text-align: center;
}
</style>
