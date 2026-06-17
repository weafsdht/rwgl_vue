<template>
  <div class="projects-page">
    <div class="page-header">
      <div class="view-toggle">
        <button
          type="button"
          class="view-toggle-btn"
          :class="{ active: viewMode === 'grid' }"
          @click="viewMode = 'grid'"
        >
          卡片
        </button>
        <button
          type="button"
          class="view-toggle-btn"
          :class="{ active: viewMode === 'list' }"
          @click="viewMode = 'list'"
        >
          列表
        </button>
      </div>
      <button v-if="canManageProjects" class="btn-primary" @click="openCreate()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          新建项目
      </button>
    </div>

    <div v-if="loading" class="loading">
      <div class="loader-ring"></div>
    </div>
    <div v-else-if="projects.length === 0" class="empty-state">
      <div class="empty-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
          <line x1="12" y1="22.08" x2="12" y2="12"/>
        </svg>
      </div>
      <p class="empty-text">暂无项目</p>
      <button v-if="canManageProjects" class="btn-primary" @click="openCreate()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        创建第一个项目
      </button>
    </div>
    <div v-else class="project-content">
      <!-- 卡片视图 -->
      <div v-if="viewMode === 'grid'" class="project-board">
        <div
          v-for="project in projectsWithStats"
          :key="project.id"
          class="project-card ref-style"
        :style="{ '--project-card-color': project.color || '#667eea' }"
        @click="selectProject(project)"
        @dblclick="goToBoard(project)"
      >
        <div class="project-card-header">
          <div
            class="project-color-bar"
            :style="{ backgroundColor: project.color || '#667eea' }"
          ></div>
          <h3 class="project-card-title">{{ project.name }}</h3>
          <div v-if="canEditProject(project)" class="project-card-actions" @click.stop>
            <button
              type="button"
              class="project-card-btn project-card-btn--edit"
              title="编辑项目"
              aria-label="编辑项目"
              @click="openEdit(project)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button
              type="button"
              class="project-card-btn project-card-btn--delete"
              title="删除项目"
              aria-label="删除项目"
              @click="confirmDelete(project)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            </button>
          </div>
        </div>
        <p class="project-card-desc">{{ project.description || '暂无描述' }}</p>
        <div class="project-card-progress">
          <div class="project-progress-bar-wrap">
            <div
              class="project-progress-bar-fill"
              :style="{ width: `${project.taskProgress}%`, backgroundColor: project.color || '#667eea' }"
            ></div>
          </div>
          <span class="project-progress-pct">{{ project.taskProgress }}%</span>
        </div>
        <div class="project-card-stats">
          <span>{{ project.taskCompletedCount }} / {{ project.taskTotalCount }} 任务</span>
        </div>
        <router-link
          :to="`/projects/${project.id}/progress`"
          class="project-card-progress-link"
          @click.stop
        >
          查看进度与统计
        </router-link>
        <div class="project-card-status-counts">
          <span
            v-for="key in ['todo', 'doing', 'done', 'stalled']"
            :key="key"
            :class="['status-count', 'status-count-' + key]"
          >
            {{ STATUS_LABELS[key] }} {{ project.countByStatus[key] }}
          </span>
        </div>
        <div v-if="displayProjectAssignees(project).length" class="project-card-assignees" :title="displayProjectAssignees(project).map(u => u.nickname || u.username || u.email).filter(Boolean).join('、')">
          <template v-for="(u, idx) in displayProjectAssignees(project).slice(0, 3)" :key="u.id + '-' + idx">
            <img v-if="u.avatar" :src="getAvatarUrl(u.avatar)" class="project-card-avatar project-card-avatar-multi" :alt="(u.nickname || u.username || '')[0]" />
            <span v-else class="project-card-avatar project-card-avatar-initial project-card-avatar-multi">{{ (u.nickname || u.username || u.email || '?')[0].toUpperCase() }}</span>
          </template>
          <span v-if="displayProjectAssignees(project).length > 3" class="project-card-assignees-more">等{{ displayProjectAssignees(project).length }}人</span>
        </div>
      </div>
      </div>

      <!-- 列表视图：可折叠展示任务 -->
      <div v-else class="project-list">
        <div
          v-for="project in projectsWithStats"
          :key="project.id"
          class="project-list-item"
          :class="{ expanded: expandedProjectIds.has(project.id) }"
          :style="expandedProjectIds.has(project.id) ? { borderColor: project.color || '#0d9488' } : {}"
        >
          <div
            class="project-list-row"
            :style="{ background: projectRowBg(project.color) }"
            @click="toggleProjectExpand(project.id)"
          >
            <button
              type="button"
              class="project-list-expand"
              :aria-label="expandedProjectIds.has(project.id) ? '收起' : '展开'"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                width="16"
                height="16"
                :class="{ rotated: expandedProjectIds.has(project.id) }"
              >
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
            <div
              class="project-list-color"
              :style="{ backgroundColor: project.color || '#667eea' }"
            ></div>
            <h3 class="project-list-title">{{ project.name }}</h3>
            <div class="project-list-right">
              <span class="project-list-task-badge">{{ project.taskTotalCount }} 个任务</span>
              <div class="project-list-status-chips">
                <span v-if="project.countByStatus.todo > 0" class="project-list-status-chip status-todo">待办 {{ project.countByStatus.todo }}</span>
                <span v-if="project.countByStatus.doing > 0" class="project-list-status-chip status-doing">进行中 {{ project.countByStatus.doing }}</span>
                <span v-if="project.countByStatus.done > 0" class="project-list-status-chip status-done">已完成 {{ project.countByStatus.done }}</span>
                <span v-if="project.countByStatus.stalled > 0" class="project-list-status-chip status-stalled">搁置 {{ project.countByStatus.stalled }}</span>
              </div>
              <div v-if="project.taskTotalCount > 0" class="project-list-progress-inline">
                <div class="project-list-progress-bar">
                  <div
                    class="project-list-progress-fill"
                    :style="{ width: project.taskProgress + '%', backgroundColor: project.color || '#667eea' }"
                  ></div>
                </div>
                <span class="project-list-pct">{{ project.taskProgress }}%</span>
              </div>
              <div class="project-list-actions" @click.stop>
                <router-link
                  :to="`/projects/${project.id}/progress`"
                  class="project-list-btn-progress"
                  title="进度监控与统计"
                >
                  进度
                </router-link>
                <template v-if="canEditProject(project)">
                  <button
                    type="button"
                    class="project-card-btn project-card-btn--edit"
                    title="编辑项目"
                    @click="openEdit(project)"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button
                    type="button"
                    class="project-card-btn project-card-btn--delete"
                    title="删除项目"
                    @click="confirmDelete(project)"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                  </button>
                </template>
              </div>
            </div>
          </div>
          <div v-if="expandedProjectIds.has(project.id)" class="project-list-tasks">
            <div v-if="projectTasksLoading[project.id]" class="project-list-tasks-loading">
              <div class="loader-ring"></div>
            </div>
            <template v-else>
              <div v-if="projectTasksMap[project.id]?.length === 0" class="project-list-tasks-empty">
                <span class="project-list-tasks-empty-text">暂无任务</span>
                <button type="button" class="project-list-add-task-btn" @click.stop="openAddTaskForProject(project)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  添加任务
                </button>
              </div>
              <template v-else>
                <table class="project-list-task-table">
              <thead>
                <tr>
                  <th class="col-status">状态</th>
                  <th class="col-title">任务名称</th>
                  <th class="col-tags">标签</th>
                  <th class="col-priority">优先级</th>
                  <th class="col-start">开始时间</th>
                  <th class="col-due">截止日期</th>
                  <th class="col-countdown">倒计时</th>
                  <th class="col-assignee">负责人</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="task in projectTasksMap[project.id]"
                  :key="task.id"
                  class="project-list-task-row"
                  :class="'task-status-' + normalizeTaskStatus(task.status)"
                  @click="goToTask(task)"
                >
                  <td class="col-status">
                    <span class="project-list-task-status">
                      {{ STATUS_LABELS[normalizeTaskStatus(task.status)] }}
                    </span>
                  </td>
                  <td class="col-title">
                    <span class="project-list-task-title">{{ task.title }}</span>
                  </td>
                  <td class="col-tags">
                    <span v-if="taskDisplayTags(task).length" class="row-tags">
                      <span
                        v-for="tag in taskDisplayTags(task)"
                        :key="tag.id"
                        class="row-tag-chip"
                        :style="{ background: tag.color || '#e5e7eb', color: tagChipTextColor(tag.color) }"
                        :title="tag.name"
                      >
                        {{ tag.name }}
                      </span>
                    </span>
                    <span v-else class="row-due-empty">—</span>
                  </td>
                  <td class="col-priority">
                    <span
                      class="row-priority-chip"
                      :style="{ background: getPriorityBg(task.priority), color: getPriorityColor(task.priority) }"
                      :title="getPriorityLabel(task.priority)"
                    >
                      {{ getPriorityLabel(task.priority) }}
                    </span>
                  </td>
                  <td class="col-start">
                    <span v-if="task.startTime" class="row-due">{{ formatDate(task.startTime, 'YYYY-MM-DD') }}</span>
                    <span v-else class="row-due-empty">—</span>
                  </td>
                  <td class="col-due">
                    <span v-if="task.dueTime" class="row-due" :class="{ overdue: taskIsOverdue(task) }">
                      {{ formatDue(task.dueTime) }}
                    </span>
                    <span v-else class="row-due-empty">—</span>
                  </td>
                  <td class="col-countdown">
                    <span
                      v-if="task.dueTime"
                      class="row-countdown-chip"
                      :style="countdownStyle(task.dueTime)"
                    >
                      {{ countdownText(task.dueTime) }}
                    </span>
                    <span v-else class="row-due-empty">—</span>
                  </td>
                  <td class="col-assignee">
                    <span v-if="displayAssignees(task).length" class="row-assignee" :title="assigneeNames(task)">
                      <span class="row-assignee-avatars">
                        <template v-for="(u, idx) in displayAssignees(task).slice(0, 2)" :key="u.id + '-' + idx">
                          <span v-if="u.avatar" class="row-avatar-wrap row-avatar-multi">
                            <img :src="getAvatarUrl(u.avatar)" class="row-avatar-img" width="34" height="34" :alt="(u.nickname || u.username || '')[0]" />
                          </span>
                          <span v-else class="row-avatar row-avatar-initial row-avatar-multi">{{ (u.nickname || u.username || u.email || '?')[0].toUpperCase() }}</span>
                        </template>
                      </span>
                    </span>
                    <span v-else class="row-assignee-empty">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
                <div class="project-list-tasks-toolbar">
                  <button type="button" class="project-list-add-task-btn project-list-add-task-btn--inline" @click.stop="openAddTaskForProject(project)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    添加任务
                  </button>
                </div>
              </template>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- 新建/编辑项目弹窗：统一表单与按钮风格 -->
    <n-modal v-model:show="showProjectModal" class="create-project-modal">
      <n-card
        class="create-project-modal__card"
        data-project-form="true"
        style="width: 500px"
        :title="editingProjectId ? '编辑项目' : '新建项目'"
        :bordered="false"
        size="huge"
        role="dialog"
        aria-modal="true"
      >
        <n-form ref="formRef" :model="formData" :rules="rules" class="create-project-modal__form">
          <n-form-item label="项目名称" path="name">
            <input
              v-model="formData.name"
              type="text"
              class="project-form-input"
              placeholder="请输入项目名称"
              autocomplete="off"
            />
          </n-form-item>
          <n-form-item label="描述" path="description">
            <textarea
              v-model="formData.description"
              class="project-form-textarea"
              placeholder="请输入项目描述"
              rows="3"
            />
          </n-form-item>
          <n-form-item label="颜色" path="color">
            <div class="create-project-modal__color-swatches">
              <button
                v-for="c in PROJECT_COLOR_PALETTE"
                :key="c"
                type="button"
                class="color-swatch"
                :class="{ 'color-swatch--selected': formData.color === c }"
                :style="{ backgroundColor: c }"
                :aria-label="'选择颜色 ' + c"
                @click="formData.color = c"
              />
              <div
                class="color-swatch color-swatch--custom"
                :class="{ 'color-swatch--selected': isCustomColor }"
              >
                <n-color-picker
                  v-model:value="formData.color"
                  :show-alpha="false"
                  size="small"
                  :modes="['hex']"
                  class="color-swatch-picker"
                />
              </div>
            </div>
          </n-form-item>
          <n-form-item label="负责人" path="assigneeIds">
            <n-select
              v-model:value="formData.assigneeIds"
              multiple
              clearable
              :to="false"
              placeholder="选择负责人（可选）"
              :options="assigneeOptions"
              :render-label="renderAssigneeLabel"
              class="form-prop-value form-select assignee-select"
            />
          </n-form-item>
          <n-form-item label="关联团队" path="teamIds">
            <n-select
              v-model:value="formData.teamIds"
              multiple
              clearable
              :to="false"
              placeholder="选择团队，同步为只读（可选）"
              :options="teamOptions"
              label-field="name"
              value-field="id"
              class="form-prop-value form-select"
            />
          </n-form-item>
          <n-form-item label="附件">
            <div class="project-modal-attachments">
              <div class="project-modal-attachments__toolbar">
                <button type="button" class="project-modal-attachments__btn" @click="triggerProjectFileInput">
                  添加文件
                </button>
                <button type="button" class="project-modal-attachments__btn" @click="triggerProjectFolderInput">
                  添加文件夹
                </button>
                <input
                  ref="projectFileInputRef"
                  type="file"
                  multiple
                  class="project-modal-attachments__input"
                  @change="onProjectFilesPicked"
                />
                <input
                  ref="projectFolderInputRef"
                  type="file"
                  multiple
                  webkitdirectory
                  class="project-modal-attachments__input"
                  @change="onProjectFolderPicked"
                />
              </div>
              <p v-if="projectAttachmentsLoading" class="project-modal-attachments__hint">加载附件列表…</p>
              <ul v-else-if="projectModalAttachments.length || pendingProjectFiles.length" class="project-modal-attachments__list">
                <li
                  v-for="att in projectModalAttachments"
                  :key="'att-' + att.id"
                  class="project-modal-attachments__row"
                >
                  <span class="project-modal-attachments__name" :title="att.fileName">{{ att.fileName }}</span>
                  <span class="project-modal-attachments__meta">{{ formatProjectFileSize(att.fileSize) }}</span>
                  <span class="project-modal-attachments__actions">
                    <button
                      type="button"
                      class="project-modal-attachments__link"
                      :disabled="projectAttDeletingId === att.id || projectAttDownloadingId === att.id"
                      @click="downloadProjectAttachment(att)"
                    >
                      {{ projectAttDownloadingId === att.id ? '下载中…' : '下载' }}
                    </button>
                    <button
                      type="button"
                      class="project-modal-attachments__link project-modal-attachments__link--danger"
                      :disabled="projectAttDeletingId === att.id || saving"
                      @click="removeSavedProjectAttachment(att)"
                    >
                      删除
                    </button>
                  </span>
                </li>
                <li
                  v-for="(file, idx) in pendingProjectFiles"
                  :key="'pending-' + idx + '-' + pendingFileKey(file)"
                  class="project-modal-attachments__row project-modal-attachments__row--pending"
                >
                  <span class="project-modal-attachments__name" :title="pendingFileLabel(file)">{{ pendingFileLabel(file) }}</span>
                  <span class="project-modal-attachments__meta">{{ formatProjectFileSize(file.size) }} · 待上传</span>
                  <button
                    type="button"
                    class="project-modal-attachments__link project-modal-attachments__link--danger"
                    :disabled="saving"
                    @click="removePendingProjectFile(idx)"
                  >
                    移除
                  </button>
                </li>
              </ul>
            </div>
          </n-form-item>
        </n-form>
        <template #footer>
          <div class="create-project-modal__footer">
            <button type="button" class="create-project-modal__cancel" @click="closeProjectModal">取消</button>
            <button type="button" class="btn-primary" @click="editingProjectId ? handleUpdate() : handleCreate()" :disabled="saving">
              <span v-if="!saving">{{ editingProjectId ? '保存' : '创建' }}</span>
              <span v-else class="loading-spinner"></span>
            </button>
          </div>
        </template>
      </n-card>
    </n-modal>

    <!-- 删除项目确认弹窗 -->
    <ConfirmModal
      v-model="showDeleteModal"
      title="删除项目"
      :content="projectToDelete ? `确定要删除项目「${projectToDelete.name}」吗？删除后该项目及其下属任务将一并删除。` : ''"
      confirm-text="确 定"
      cancel-text="取 消"
      :loading="deleting"
      @confirm="handleDeleteConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, h } from 'vue';
import dayjs from 'dayjs';
import { useRouter } from 'vue-router';
import {
  NCard,
  NModal,
  NForm,
  NFormItem,
  NColorPicker,
  NSelect,
  NAvatar,
} from 'naive-ui';
import ConfirmModal from '@/components/ConfirmModal.vue';
import '../styles/components.css';
import { useProjects } from '@/composables/useProjects';
import { useProjectAssignees } from '@/composables/useProjectAssignees';
import { useUserStore } from '@/stores/user';
import projectApi, {
  type ProjectHttpClient,
  defaultProjectHttpClient,
  fetchProjectApi,
  listProjectAttachmentsSafe,
  uploadProjectAttachment as uploadProjectAttachmentWithClient,
  deleteProjectAttachment as deleteProjectAttachmentWithClient,
} from '@/api/project';
import taskApi from '@/api/task';
import teamApi from '@/api/team';
import tagApi from '@/api/tag';
import { getAvatarUrl } from '@/utils/request';
import { downloadAttachment as downloadAttachmentById, triggerSave } from '@/api/attachmentDownload';
import { formatDate, getCountdownText, isOverdue as checkOverdue } from '@/utils/date';
import { normalizeTaskStatus, getPriorityLabel, getPriorityColor, getPriorityBg } from '@/utils/task';
import { isProjectManagerOrAdmin } from '@/constants/role';
import type { FormInst } from 'naive-ui';
import type { Project, ProjectTaskStats, ProjectAttachment, Task, User, TeamMember, Team, Tag } from '@/types';

const props = withDefaults(
  defineProps<{
    /** 自定义项目 API 客户端（默认使用内置 request 封装） */
    httpClient?: ProjectHttpClient;
    /** 附件下载：需传 apiBaseUrl（跨域直连后端时）与 getToken；不传则相对路径 + 当前登录 token */
    downloadOptions?: { apiBaseUrl?: string; getToken: () => string | null };
  }>(),
  {}
);

const router = useRouter();
const userStore = useUserStore();

const resolvedProjectHttpClient = computed(() => props.httpClient ?? defaultProjectHttpClient);

const canManageProjects = computed(() => isProjectManagerOrAdmin(userStore.user?.role));
/** 仅项目经理/管理员可新建项目；编辑/删除需为项目经理/管理员或该项目负责人 */
function canEditProject(project: Project): boolean {
  if (isProjectManagerOrAdmin(userStore.user?.role)) return true;
  const uid = userStore.user?.id;
  return !!uid && (project.assigneeIds?.includes(uid) ?? (project.assigneeId != null && project.assigneeId === uid));
}
const { projects, loading, fetchProjects, createProject, updateProject, deleteProject, setCurrentProject } = useProjects();
const { ensureMap: ensureProjectAssigneeMap, displayProjectAssignees } = useProjectAssignees();

/** 预设颜色（已去掉最后两个，改为一个自由选择） */
const PROJECT_COLOR_PALETTE = [
  '#E53935',
  '#D81B60',
  '#0d9488',
  '#1890FF',
  '#06b6d4',
  '#22c55e',
  '#84cc16',
  '#eab308',
  '#f97316',
  '#64748b',
];

/** 各项目任务统计（GET /api/projects/{id}/task-stats），无权限或失败为 null 则展示 0 */
const projectStatsMap = ref<Record<number, ProjectTaskStats | null>>({});

/** 视图模式：卡片 | 列表（默认列表以便“有任务的项目”默认展开） */
const viewMode = ref<'grid' | 'list'>('list');

/** 列表视图中展开的项目 ID 集合（支持多项目同时展开） */
const expandedProjectIds = ref<Set<number>>(new Set());

/** 各项目下的任务列表（展开时加载） */
const projectTasksMap = ref<Record<number, import('@/types').Task[]>>({});

/** 各项目任务加载中 */
const projectTasksLoading = ref<Record<number, boolean>>({});

/** 标签列表（用于任务列表展示 tagIds → 标签名/颜色） */
const allTags = ref<Tag[]>([]);

/** 看板状态与中文标签 */
const STATUS_LABELS: Record<string, string> = {
  todo: '待办',
  doing: '进行中',
  done: '已完成',
  stalled: '搁置',
};

/** 带任务统计的项目列表：使用 task-stats 接口，进度条统一为 done/total */
const projectsWithStats = computed(() => {
  return projects.value.map((p) => {
    const stats = projectStatsMap.value[p.id] ?? null;
    const total = stats?.total ?? 0;
    const done = stats?.done ?? 0;
    const taskProgress = total > 0 ? Math.round((done / total) * 100) : 0;
    const countByStatus: Record<string, number> = {
      todo: stats?.todo ?? 0,
      doing: stats?.doing ?? 0,
      done: stats?.done ?? 0,
      stalled: stats?.onHold ?? 0,
    };
    return {
      ...p,
      taskTotalCount: total,
      taskCompletedCount: done,
      taskProgress,
      countByStatus,
    };
  });
});

const showProjectModal = ref(false);
const editingProjectId = ref<number | null>(null);
const saving = ref(false);
const formRef = ref<FormInst | null>(null);

const formData = ref({
  name: '',
  description: '',
  color: '#1890FF',
  assigneeIds: [] as number[],
  teamIds: [] as number[],
});

const isCustomColor = computed(() => {
  const c = formData.value.color;
  return !c || !PROJECT_COLOR_PALETTE.includes(c);
});

/** 项目弹窗：待上传文件、已有关联附件（编辑） */
const projectFileInputRef = ref<HTMLInputElement | null>(null);
const projectFolderInputRef = ref<HTMLInputElement | null>(null);
const pendingProjectFiles = ref<File[]>([]);
const projectModalAttachments = ref<ProjectAttachment[]>([]);
const projectAttachmentsLoading = ref(false);
const projectAttDeletingId = ref<number | null>(null);
const projectAttDownloadingId = ref<number | null>(null);

function formatProjectFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function pendingFileLabel(file: File): string {
  const w = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
  return w && w.trim() ? w : file.name;
}

function pendingFileKey(file: File): string {
  return `${file.name}-${file.size}-${pendingFileLabel(file)}`;
}

function triggerProjectFileInput() {
  projectFileInputRef.value?.click();
}

function triggerProjectFolderInput() {
  projectFolderInputRef.value?.click();
}

function onProjectFilesPicked(e: Event) {
  const input = e.target as HTMLInputElement;
  const files = input.files;
  if (!files?.length) return;
  pendingProjectFiles.value = [...pendingProjectFiles.value, ...Array.from(files)];
  input.value = '';
}

function onProjectFolderPicked(e: Event) {
  const input = e.target as HTMLInputElement;
  const files = input.files;
  if (!files?.length) return;
  pendingProjectFiles.value = [...pendingProjectFiles.value, ...Array.from(files)];
  input.value = '';
}

function removePendingProjectFile(index: number) {
  pendingProjectFiles.value = pendingProjectFiles.value.filter((_, i) => i !== index);
}

async function uploadPendingProjectFiles(projectId: number): Promise<{ ok: number; fail: number }> {
  const list = pendingProjectFiles.value;
  if (!list.length) return { ok: 0, fail: 0 };
  const client = resolvedProjectHttpClient.value;
  let ok = 0;
  let fail = 0;
  for (const file of list) {
    try {
      await uploadProjectAttachmentWithClient(client, projectId, file);
      ok++;
    } catch {
      fail++;
    }
  }
  pendingProjectFiles.value = [];
  return { ok, fail };
}

async function downloadProjectAttachment(att: ProjectAttachment) {
  if (projectAttDownloadingId.value != null) return;
  projectAttDownloadingId.value = att.id;
  try {
    const result = await downloadAttachmentById({
      attachmentId: att.id,
      fileName: att.fileName || '附件',
      apiBaseUrl: props.downloadOptions?.apiBaseUrl,
      getToken: props.downloadOptions?.getToken ?? (() => userStore.token ?? null),
    });
    triggerSave(result);
    window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'success', title: '下载成功', message: '文件已保存' } }));
  } catch (e: unknown) {
    window.dispatchEvent(
      new CustomEvent('toast', {
        detail: { type: 'error', title: '下载失败', message: (e as Error)?.message || '请稍后重试' },
      })
    );
  } finally {
    projectAttDownloadingId.value = null;
  }
}

async function removeSavedProjectAttachment(att: ProjectAttachment) {
  const pid = editingProjectId.value;
  if (pid == null) return;
  projectAttDeletingId.value = att.id;
  try {
    await deleteProjectAttachmentWithClient(resolvedProjectHttpClient.value, pid, att.id);
    projectModalAttachments.value = projectModalAttachments.value.filter((a) => a.id !== att.id);
    window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'success', title: '已删除', message: '附件已移除' } }));
  } catch (e: unknown) {
    window.dispatchEvent(
      new CustomEvent('toast', {
        detail: { type: 'error', title: '删除失败', message: (e as Error)?.message || '请稍后重试' },
      })
    );
  } finally {
    projectAttDeletingId.value = null;
  }
}

const rules = {
  name: {
    required: true,
    message: '请输入项目名称',
    trigger: 'blur',
  },
};

/** 团队成员（用于负责人多选，与 CreateTaskModal 一致） */
const teamMembers = ref<TeamMember[]>([]);
/** 当前用户加入的团队列表（用于关联团队多选） */
const myTeams = ref<Team[]>([]);

const teamOptions = computed(() => myTeams.value);

watch(showProjectModal, (show) => {
  if (show) {
    teamApi.getMyTeams().then((teams) => {
      myTeams.value = teams ?? [];
      const promises = (teams ?? []).map((t) => teamApi.getTeamMembers(t.id));
      Promise.all(promises).then((memberLists) => {
        const byUserId = new Map<number, TeamMember>();
        for (const members of memberLists) {
          for (const m of members ?? []) {
            if (m.status === 'active' && !byUserId.has(m.userId)) byUserId.set(m.userId, m);
          }
        }
        teamMembers.value = Array.from(byUserId.values());
      }).catch(() => { teamMembers.value = []; });
    }).catch(() => { teamMembers.value = []; });
  }
});

type AssigneeOption = { label: string; value: number; avatar?: string; nickname?: string; email?: string; username?: string };

const assigneeOptions = computed(() => {
  const u = userStore.user;
  const list = teamMembers.value;
  const byUserId = new Map<number, TeamMember>();
  for (const m of list) {
    if (m.status === 'active' && !byUserId.has(m.userId)) byUserId.set(m.userId, m);
  }
  const options: AssigneeOption[] = Array.from(byUserId.values()).map((m) => ({
    label: m.nickname || m.email,
    value: Number(m.userId),
    avatar: m.avatar,
    nickname: m.nickname,
    email: m.email,
    username: (m as TeamMember & { username?: string }).username,
  }));
  if (u && !byUserId.has(u.id)) {
    options.unshift({
      label: u.username || u.nickname || u.email || '我',
      value: Number(u.id),
      avatar: u.avatar,
      nickname: u.nickname,
      email: u.email,
      username: u.username,
    });
  }
  return options;
});

/** 去重后的正整数 ID（兼容 n-select 偶发 string） */
function normalizePositiveIntIds(raw: readonly (number | string)[] | undefined): number[] {
  const ids = (raw ?? [])
    .map((x) => (typeof x === 'number' ? x : Number(x)))
    .filter((n) => Number.isFinite(n) && n > 0);
  return [...new Set(ids)];
}

/**
 * 提交项目前规范化负责人：去重、数字类型；下拉已加载时仅保留当前可选用户，避免陈旧/非法 ID 导致后端校验失败。
 */
function sanitizeProjectAssigneeIds(raw: readonly (number | string)[] | undefined): number[] {
  const uniq = normalizePositiveIntIds(raw);
  const allowed = new Set(assigneeOptions.value.map((o) => o.value));
  if (allowed.size === 0) return uniq;
  return uniq.filter((id) => allowed.has(id));
}

function normalizeTeamIdsForProject(raw: readonly (number | string)[] | undefined): number[] {
  return normalizePositiveIntIds(raw);
}

function renderAssigneeLabel(option: AssigneeOption) {
  const u = userStore.user;
  const isCurrentUser = u && option.value === u.id;
  const displayName = option.username ?? option.nickname ?? option.label;
  const initial = (displayName || option.email || '?')[0].toUpperCase();
  const avatarUrl = getAvatarUrl(option.avatar || (isCurrentUser ? u!.avatar : undefined));
  return h('div', { class: 'assignee-option' }, [
    h(NAvatar, { round: true, size: 'small', src: avatarUrl }, () => initial),
    h('span', { class: 'assignee-option-name' }, isCurrentUser ? `${displayName}（当前用户）` : (option.nickname || option.label)),
  ]);
}

let countdownTimer: ReturnType<typeof setInterval> | null = null;

/** 在列表视图下，将“有任务”的项目设为展开并加载任务（用于首次进入或切换到列表时） */
function autoExpandProjectsWithTasks() {
  if (viewMode.value !== 'list') return;
  const toExpand = projects.value.filter((p) => (projectStatsMap.value[p.id]?.total ?? 0) > 0).map((p) => p.id);
  if (toExpand.length === 0) return;
  expandedProjectIds.value = new Set(toExpand);
  toExpand.forEach((id) => loadProjectTasksIfNeeded(id));
}

onMounted(async () => {
  // 刷新当前用户信息（含头像），保证负责人列中「自己」显示真实头像
  userStore.fetchCurrentUser().catch(() => {});
  tagApi.getList().then((list) => { allTags.value = list ?? []; }).catch(() => { allTags.value = []; });
  await fetchProjects();
  await ensureProjectAssigneeMap();
  await refreshAllProjectStatsParallel();
  countdownTimer = setInterval(() => { countdownNow.value = dayjs(); }, 60 * 1000);
  autoExpandProjectsWithTasks();
  window.addEventListener('task-updated', onGlobalTaskChange);
  window.addEventListener('task-deleted', onGlobalTaskChange);
  window.addEventListener('task-created', onGlobalTaskChange);
});

watch(viewMode, (mode) => {
  if (mode === 'list') autoExpandProjectsWithTasks();
});

const selectProject = (project: Project) => {
  setCurrentProject(project.id);
};

async function toggleProjectExpand(projectId: number) {
  const set = new Set(expandedProjectIds.value);
  if (set.has(projectId)) {
    set.delete(projectId);
    expandedProjectIds.value = set;
    return;
  }
  set.add(projectId);
  expandedProjectIds.value = set;
  await loadProjectTasksIfNeeded(projectId);
}

/** 加载某项目的任务列表（未加载过时才请求；[] 表示已加载过空列表） */
async function loadProjectTasksIfNeeded(projectId: number) {
  if (projectTasksMap.value[projectId] !== undefined) return;
  projectTasksLoading.value = { ...projectTasksLoading.value, [projectId]: true };
  try {
    const tasks = await taskApi.getTasks({ projectId }, { skipGlobalError: true });
    const list = Array.isArray(tasks) ? tasks : [];
    projectTasksMap.value = { ...projectTasksMap.value, [projectId]: list };
    await ensureProjectTaskAssigneeMap();
  } catch {
    projectTasksMap.value = { ...projectTasksMap.value, [projectId]: [] };
  } finally {
    projectTasksLoading.value = { ...projectTasksLoading.value, [projectId]: false };
  }
}

/** 负责人 id → 用户信息（项目内任务列表展示用，与 Tasks 页 ensureAssigneeMap 一致） */
const assigneeUserMap = ref<Map<number, User>>(new Map());

async function ensureProjectTaskAssigneeMap() {
  const ids = new Set<number>();
  const rawIds = (t: Task) => {
    if (t.assigneeIds?.length) t.assigneeIds.forEach((id: number) => ids.add(id));
    else if (t.assigneeId != null) ids.add(t.assigneeId);
    else {
      const r = t as Task & Record<string, unknown>;
      if (Array.isArray(r.assignee_ids)) r.assignee_ids.forEach((id: unknown) => ids.add(Number(id)));
      else if (r.assignee_id != null) ids.add(Number(r.assignee_id));
    }
  };
  for (const list of Object.values(projectTasksMap.value)) {
    for (const t of list ?? []) rawIds(t);
  }
  if (ids.size === 0) {
    assigneeUserMap.value = new Map();
    return;
  }
  try {
    const teams = await teamApi.getMyTeams();
    const memberLists = await Promise.all((teams ?? []).map((t) => teamApi.getTeamMembers(t.id)));
    const map = new Map<number, User>();
    const u = userStore.user;
    if (u) map.set(u.id, u);
    for (const members of memberLists) {
      for (const m of members ?? []) {
        if (m.status === 'active' && !map.has(m.userId)) {
          map.set(m.userId, {
            id: m.userId,
            username: (m as TeamMember & { username?: string }).username ?? m.nickname ?? m.email,
            nickname: m.nickname,
            email: m.email,
            avatar: m.avatar,
            createdAt: '',
          });
        }
      }
    }
    assigneeUserMap.value = map;
  } catch {
    assigneeUserMap.value = new Map();
  }
}

function goToTask(task: Task) {
  setCurrentProject(task.projectId ?? null);
  window.dispatchEvent(new CustomEvent('open-edit-task', { detail: { task } }));
}

/** 在列表下为该项目直接添加任务（打开创建任务弹窗并预选当前项目） */
function openAddTaskForProject(project: Project) {
  window.dispatchEvent(new CustomEvent('open-create-task', { detail: { projectId: project.id } }));
}

function formatDue(dueTime: string): string {
  return formatDate(dueTime, 'YYYY-MM-DD');
}

function tagChipTextColor(bgHex: string | undefined): string {
  if (!bgHex || bgHex === '') return 'var(--text-primary)';
  const hex = bgHex.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#1f2937' : '#fff';
}

/** 任务展示用标签：优先 task.tags，否则 task.tagIds/tag_ids + allTags，id 统一 Number 比较 */
function taskDisplayTags(task: Task): Tag[] {
  if (task.tags?.length) return task.tags;
  const raw = task as Task & Record<string, unknown>;
  const ids = task.tagIds ?? (Array.isArray(raw.tag_ids) ? raw.tag_ids : undefined);
  if (!ids?.length || !allTags.value.length) return [];
  return ids.map((id: unknown) => allTags.value.find((t) => t.id === Number(id))).filter((t): t is Tag => t != null);
}

const countdownNow = ref(dayjs());
function countdownText(dueTime: string): string {
  return getCountdownText(dueTime, countdownNow.value);
}

function countdownStyle(dueTime: string): Record<string, string> {
  const remaining = new Date(dueTime).getTime() - Date.now();
  const days = remaining / (1000 * 60 * 60 * 24);
  let color: string;
  let bg: string;
  if (remaining <= 0) {
    color = '#ef4444'; bg = 'rgba(239,68,68,0.1)';
  } else if (days < 3) {
    color = '#eab308'; bg = 'rgba(234,179,8,0.1)';
  } else if (days < 7) {
    color = '#3b82f6'; bg = 'rgba(59,130,246,0.1)';
  } else {
    color = '#22c55e'; bg = 'rgba(34,197,94,0.1)';
  }
  return { color, background: bg };
}

function displayAssignee(task: Task): User | null {
  if (task.assignee) return task.assignee;
  const raw = task as Task & Record<string, unknown>;
  const aid = task.assigneeId ?? (raw.assignee_id != null ? Number(raw.assignee_id) : null);
  if (aid != null && userStore.user?.id === aid) return userStore.user;
  if (aid != null) return assigneeUserMap.value.get(aid) ?? null;
  return null;
}

function projectRowBg(color?: string): string {
  if (!color) return 'rgba(45, 212, 191, 0.06)';
  const hex = color.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, 0.08)`;
}

/** 多负责人列表（用于展示）；无 assignees 时用 assigneeIds/assigneeId（含 snake_case）+ assigneeUserMap，否则显示「用户 xxx」 */
function displayAssignees(task: Task): User[] {
  if (task.assignees?.length) return task.assignees;
  const raw = task as Task & Record<string, unknown>;
  const ids = task.assigneeIds?.length
    ? task.assigneeIds
    : Array.isArray(raw.assignee_ids) && raw.assignee_ids.length
      ? raw.assignee_ids.map((id: unknown) => Number(id))
      : task.assigneeId != null
        ? [task.assigneeId]
        : raw.assignee_id != null
          ? [Number(raw.assignee_id)]
          : [];
  if (ids.length === 0) {
    const single = displayAssignee(task);
    return single ? [single] : [];
  }
  const list: User[] = [];
  for (const id of ids) {
    const u =
      (task.assignee && task.assignee.id === id)
        ? task.assignee
        : userStore.user?.id === id
          ? userStore.user
          : assigneeUserMap.value.get(id);
    if (u) list.push(u);
    else list.push({ id, username: `用户 ${id}`, nickname: `用户 ${id}`, email: '', createdAt: '' });
  }
  return list;
}

/** 负责人列展示文案：昵称/用户名 或「用户 xxx」 */
function assigneeNames(task: Task): string {
  const list = displayAssignees(task);
  if (!list.length) return '';
  return list.map((u) => u.nickname?.trim() || u.username?.trim() || u.email?.trim() || `用户 ${u.id}`).filter(Boolean).join('、') || '负责人';
}

/** 是否逾期：优先用接口返回，否则根据 dueTime 与 status 计算 */
function taskIsOverdue(task: Task): boolean {
  if (task.isOverdue != null) return task.isOverdue;
  if (!task.dueTime || task.status === 'done') return false;
  return checkOverdue(task.dueTime);
}

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer);
  window.removeEventListener('task-updated', onGlobalTaskChange);
  window.removeEventListener('task-deleted', onGlobalTaskChange);
  window.removeEventListener('task-created', onGlobalTaskChange);
});

/** 双击项目卡片：选中该项目并跳转到任务看板 */
const goToBoard = (project: Project) => {
  setCurrentProject(project.id);
  router.push({ name: 'Board' });
};

function openCreate() {
  editingProjectId.value = null;
  pendingProjectFiles.value = [];
  projectModalAttachments.value = [];
  formData.value = {
    name: '',
    description: '',
    color: PROJECT_COLOR_PALETTE[3],
    assigneeIds: userStore.user?.id ? [userStore.user.id] : [],
    teamIds: [],
  };
  showProjectModal.value = true;
}

async function openEdit(project: Project) {
  // 1）同步：用列表数据立刻赋值并打开弹窗
  editingProjectId.value = project.id;
  pendingProjectFiles.value = [];
  projectModalAttachments.value = [];
  const assigneeIds = project.assigneeIds?.length
    ? [...project.assigneeIds]
    : (project.assigneeId != null ? [project.assigneeId] : []);
  const teamIds = project.teamIds?.length ? [...project.teamIds] : [];
  formData.value = {
    name: project.name,
    description: project.description ?? '',
    color: project.color ?? PROJECT_COLOR_PALETTE[3],
    assigneeIds: [...assigneeIds],
    teamIds: [...teamIds],
  };
  showProjectModal.value = true;
  projectAttachmentsLoading.value = true;
  const client = resolvedProjectHttpClient.value;
  try {
    const [detail, attList] = await Promise.all([
      fetchProjectApi(client, project.id).catch(() => null),
      listProjectAttachmentsSafe(client, project.id),
    ]);
    if (editingProjectId.value !== project.id) return;
    if (detail) {
      const nextAssigneeIds = detail.assigneeIds?.length
        ? [...detail.assigneeIds]
        : (detail.assigneeId != null ? [detail.assigneeId] : []);
      const nextTeamIds = detail.teamIds?.length ? [...detail.teamIds] : [];
      formData.value = {
        ...formData.value,
        assigneeIds: nextAssigneeIds,
        teamIds: nextTeamIds,
      };
    }
    projectModalAttachments.value = attList;
  } finally {
    projectAttachmentsLoading.value = false;
  }
}

function closeProjectModal() {
  showProjectModal.value = false;
  editingProjectId.value = null;
  pendingProjectFiles.value = [];
  projectModalAttachments.value = [];
  projectAttachmentsLoading.value = false;
}

async function refreshStatsForProject(id: number) {
  try {
    const stats = await projectApi.getProjectTaskStats(id);
    projectStatsMap.value = { ...projectStatsMap.value, [id]: stats };
  } catch {
    projectStatsMap.value = { ...projectStatsMap.value, [id]: null };
  }
}

/** 强制重拉某项目任务列表（保存后同步用，覆盖缓存） */
async function refetchProjectTasks(projectId: number) {
  projectTasksLoading.value = { ...projectTasksLoading.value, [projectId]: true };
  try {
    const tasks = await taskApi.getTasks({ projectId }, { skipGlobalError: true });
    const list = Array.isArray(tasks) ? tasks : [];
    projectTasksMap.value = { ...projectTasksMap.value, [projectId]: list };
  } catch {
    /* 保留原列表 */
  } finally {
    projectTasksLoading.value = { ...projectTasksLoading.value, [projectId]: false };
  }
}

/** 任务更新后需刷新的项目 id：快照中的 projectId + 当前缓存里仍包含该任务行的项目（处理跨项目移动） */
function collectProjectIdsForTaskRefresh(taskId: number | undefined, snapshot?: Task): number[] {
  const s = new Set<number>();
  const raw = snapshot as (Task & Record<string, unknown>) | undefined;
  const fromSnap =
    snapshot?.projectId ??
    (raw?.project_id != null ? Number(raw.project_id) : NaN);
  if (Number.isFinite(fromSnap)) s.add(fromSnap);
  if (taskId != null) {
    for (const key of Object.keys(projectTasksMap.value)) {
      const pid = Number(key);
      if (projectTasksMap.value[pid]?.some((t) => t.id === taskId)) s.add(pid);
    }
  }
  return [...s];
}

/** 并行拉取所有项目的任务统计（供列表头/进度条使用） */
async function refreshAllProjectStatsParallel() {
  const results = await Promise.all(
    projects.value.map(async (p) => {
      try {
        const stats = await projectApi.getProjectTaskStats(p.id);
        return { id: p.id, stats };
      } catch {
        return { id: p.id, stats: null as ProjectTaskStats | null };
      }
    })
  );
  const map: Record<number, ProjectTaskStats | null> = {};
  for (const { id, stats } of results) map[id] = stats;
  projectStatsMap.value = map;
}

/** 新建/删除：整表统计 + 清空已缓存任务并按展开项重拉 */
async function refreshProjectStatsAndCachedTasks() {
  await refreshAllProjectStatsParallel();
  projectTasksMap.value = {};
  const expanded = [...expandedProjectIds.value];
  await Promise.all(expanded.map((id) => loadProjectTasksIfNeeded(id)));
  await ensureProjectTaskAssigneeMap();
}

function handleTaskUpdated(ev: Event) {
  void (async () => {
    const d = (ev as CustomEvent<{ taskId?: number; task?: Task }>).detail;
    const taskId = d?.taskId;
    await refreshAllProjectStatsParallel();
    const pids = collectProjectIdsForTaskRefresh(taskId, d?.task);
    const expanded = expandedProjectIds.value;
    await Promise.all(
      pids.filter((pid) => expanded.has(pid)).map((pid) => refetchProjectTasks(pid))
    );
    await ensureProjectTaskAssigneeMap();
  })();
}

function handleTaskCreatedOrDeleted() {
  void refreshProjectStatsAndCachedTasks();
}

function onGlobalTaskChange(ev: Event) {
  if (ev.type === 'task-updated') handleTaskUpdated(ev);
  else handleTaskCreatedOrDeleted();
}

const handleCreate = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (errors) => {
    if (!errors) {
      saving.value = true;
      try {
        const assigneeIds = sanitizeProjectAssigneeIds(formData.value.assigneeIds);
        const teamIds = normalizeTeamIdsForProject(formData.value.teamIds);
        const created = await createProject({
          name: formData.value.name.trim(),
          description: (formData.value.description ?? '').trim(),
          color: formData.value.color,
          assigneeIds,
          ...(assigneeIds.length ? { assigneeId: assigneeIds[0] } : {}),
          teamIds,
        });
        const up = await uploadPendingProjectFiles(created.id);
        if (up.fail > 0) {
          window.alert(
            up.ok > 0
              ? `项目已创建，但有 ${up.fail} 个附件上传失败（成功 ${up.ok} 个）。`
              : `项目已创建，但 ${up.fail} 个附件上传均失败。`
          );
        } else {
          window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'success', title: '创建成功', message: '项目创建成功' } }));
        }
        closeProjectModal();
        formData.value = { name: '', description: '', color: PROJECT_COLOR_PALETTE[3], assigneeIds: [], teamIds: [] };
        await ensureProjectAssigneeMap();
        await refreshStatsForProject(created.id);
      } catch (error: any) {
        window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'error', title: '创建失败', message: error.message || '创建失败' } }));
      } finally {
        saving.value = false;
      }
    }
  });
};

const handleUpdate = async () => {
  const id = editingProjectId.value;
  if (!formRef.value || id == null || typeof id !== 'number') return;
  await formRef.value.validate(async (errors) => {
    if (!errors) {
      saving.value = true;
      try {
        const assigneeIds = sanitizeProjectAssigneeIds(formData.value.assigneeIds);
        const teamIds = normalizeTeamIdsForProject(formData.value.teamIds);
        const payload = {
          name: formData.value.name,
          description: formData.value.description ?? '',
          color: formData.value.color,
          assigneeIds,
          ...(assigneeIds.length ? { assigneeId: assigneeIds[0] } : {}),
          teamIds,
        };
        await updateProject(id, payload);
        const up = await uploadPendingProjectFiles(id);
        if (up.fail > 0) {
          window.dispatchEvent(
            new CustomEvent('toast', {
              detail: {
                type: 'warning',
                title: '项目已保存',
                message: up.ok > 0 ? `附件部分上传失败（成功 ${up.ok}，失败 ${up.fail}）` : `附件上传失败 ${up.fail} 个`,
              },
            })
          );
        } else {
          window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'success', title: '保存成功', message: '项目已更新' } }));
        }
        projectModalAttachments.value = await listProjectAttachmentsSafe(resolvedProjectHttpClient.value, id);
        closeProjectModal();
        await ensureProjectAssigneeMap();
        await refreshStatsForProject(id);
      } catch (error: any) {
        window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'error', title: '保存失败', message: error.message || '保存失败' } }));
      } finally {
        saving.value = false;
      }
    }
  });
};

const showDeleteModal = ref(false);
const projectToDelete = ref<Project | null>(null);
const deleting = ref(false);

function confirmDelete(project: Project) {
  projectToDelete.value = project;
  showDeleteModal.value = true;
}

async function handleDeleteConfirm() {
  const project = projectToDelete.value;
  if (!project) return;
  deleting.value = true;
  try {
    const tasks = await taskApi.getTasks({ projectId: project.id }).catch(() => []);
    const list = Array.isArray(tasks) ? tasks : [];
    for (const task of list) {
      await taskApi.deleteTask(task.id);
    }
    await deleteProject(project.id);
    const next = { ...projectStatsMap.value };
    delete next[project.id];
    projectStatsMap.value = next;
    showDeleteModal.value = false;
    projectToDelete.value = null;
    window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'success', title: '已删除', message: '项目及其下属任务已删除' } }));
    window.dispatchEvent(new CustomEvent('refresh-view', { detail: { view: 'Board' } }));
  } catch (err: any) {
    window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'error', title: '删除失败', message: err.message || '删除失败' } }));
  } finally {
    deleting.value = false;
  }
}

defineExpose({
  openCreate,
  openEdit,
});
</script>

<style scoped>
@import '../styles/components.css';

.projects-page {
  height: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.view-toggle {
  display: flex;
  border: 1px solid var(--border-medium);
  border-radius: 8px;
  overflow: hidden;
}

.view-toggle-btn {
  padding: 8px 16px;
  border: none;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: var(--font-size-small);
  cursor: pointer;
  transition: all 0.2s ease;
}

.view-toggle-btn:hover {
  color: var(--text-primary);
}

.view-toggle-btn.active {
  background: var(--accent-primary);
  color: #fff;
}

.page-header h1 {
  margin: 0;
  font-size: var(--font-size-h1);
  color: var(--text-primary);
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-primary svg {
  width: 18px;
  height: 18px;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
}

.loading .loader-ring {
  margin: 0 auto;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl) var(--spacing-lg);
  min-height: 400px;
  text-align: center;
}

.empty-icon {
  width: 80px;
  height: 80px;
  margin-bottom: var(--spacing-md);
  color: var(--text-tertiary);
  opacity: 0.5;
}

.empty-icon svg {
  width: 100%;
  height: 100%;
}

.empty-text {
  font-size: var(--font-size-title);
  color: var(--text-secondary);
  margin-bottom: var(--spacing-lg);
}

.empty-state .btn-primary {
  margin-top: var(--spacing-sm);
}

.project-content {
  min-height: 200px;
}

/* 参考看板卡片：整体颜色为新建/编辑时所选颜色（浅色背景 + 左边框） */
.project-board {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-lg);
}

/* 列表视图 */
.project-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.project-list-item {
  background: var(--card, #fff);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 8px;
}

.project-list-item.expanded {
  border-color: var(--accent-primary, #0d9488);
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.project-list-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: var(--spacing-md) var(--spacing-lg);
  cursor: pointer;
  transition: background 0.2s ease;
}

.project-list-row:hover {
  background: var(--bg-tertiary);
}

.project-list-expand {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
}

.project-list-expand svg.rotated {
  transform: rotate(90deg);
}

.project-list-color {
  width: 4px;
  height: 36px;
  border-radius: 2px;
  flex-shrink: 0;
}

.project-list-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.project-list-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
}

.project-list-task-badge {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  padding: 2px 8px;
  background: var(--bg-tertiary);
  border-radius: 10px;
  flex-shrink: 0;
}

.project-list-progress-inline {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  width: 120px;
}

.project-list-desc {
  margin: 0 0 4px;
  font-size: var(--font-size-small);
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-list-meta {
  display: none; /* replaced by inline progress */
  font-size: var(--font-size-small);
  color: var(--text-tertiary);
}

.project-list-pct {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
}

.project-list-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.project-list-btn-progress {
  font-size: var(--font-size-small);
  color: var(--accent-primary, #0d9488);
  text-decoration: none;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
}
.project-list-btn-progress:hover {
  background: var(--bg-tertiary);
  text-decoration: underline;
}

.project-list-tasks {
  padding: 0;
  border-top: 1px solid var(--border-subtle);
}

.project-list-tasks-loading {
  padding: 24px;
  display: flex;
  justify-content: center;
}

.project-list-tasks-empty {
  padding: 16px 24px;
  font-size: var(--font-size-small);
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.project-list-tasks-empty-text {
  color: var(--text-tertiary);
}

.project-list-add-task-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: var(--font-size-small);
  color: var(--accent-primary);
  background: color-mix(in srgb, var(--accent-primary) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent-primary) 40%, transparent);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 500;
}

.project-list-add-task-btn:hover {
  background: color-mix(in srgb, var(--accent-primary) 20%, transparent);
  border-color: var(--accent-primary);
}

.project-list-add-task-btn--inline {
  margin-top: var(--spacing-sm);
  padding: 4px 10px;
  font-size: 12px;
}

.project-list-tasks-toolbar {
  margin-top: var(--spacing-sm);
  padding-top: var(--spacing-xs);
  border-top: 1px dashed var(--border-subtle);
}

.project-list-task-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.project-list-task-table th {
  text-align: left;
  padding: 8px 12px;
  font-weight: 600;
  font-size: 12px;
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-subtle);
}

.project-list-task-table td {
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-subtle);
  vertical-align: middle;
}

.project-list-task-table tbody tr:last-child td {
  border-bottom: none;
}

.project-list-task-table .col-title .project-list-task-title {
  font-weight: 600;
  color: var(--text-primary);
}

.project-list-task-table .col-status { width: 9%; min-width: 72px; }
.project-list-task-table .col-title { width: 22%; min-width: 100px; }
.project-list-task-table .col-tags { width: 12%; min-width: 80px; }
.project-list-task-table .col-priority { width: 10%; min-width: 72px; }
.project-list-task-table .col-start { width: 11%; min-width: 90px; }
.project-list-task-table .col-due { width: 11%; min-width: 90px; }
.project-list-task-table .col-countdown { width: 12%; min-width: 90px; white-space: nowrap; }
.project-list-task-table .col-assignee { width: 11%; min-width: 100px; }

.project-list-task-row {
  cursor: pointer;
  transition: background 0.2s ease;
}

.project-list-task-row:hover {
  background: rgba(45, 212, 191, 0.04);
}

.project-list-task-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 500;
}

.project-list-task-row.task-status-todo .project-list-task-status {
  background: color-mix(in srgb, var(--color-status-todo) 18%, transparent);
  color: var(--color-status-todo);
}

.project-list-task-row.task-status-doing .project-list-task-status {
  background: color-mix(in srgb, var(--color-status-doing) 22%, transparent);
  color: #92400e;
}

[data-theme="dark"] .project-list-task-row.task-status-doing .project-list-task-status {
  color: var(--color-status-doing);
}

.project-list-task-row.task-status-done .project-list-task-status {
  background: color-mix(in srgb, var(--color-status-done) 18%, transparent);
  color: var(--color-status-done);
}

.project-list-task-row.task-status-stalled .project-list-task-status {
  background: color-mix(in srgb, var(--color-status-stalled) 20%, transparent);
  color: var(--color-status-stalled);
}

.project-list-task-title {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--font-size-base);
  color: var(--text-primary);
}

.row-priority-chip {
  display: inline-block;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 500;
  white-space: nowrap;
}

.row-countdown-chip {
  display: inline-block;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 8px;
  font-weight: 600;
  white-space: nowrap;
}

.project-list-tasks .row-due {
  color: var(--text-secondary);
  font-size: var(--font-size-base, 14px);
}

.project-list-tasks .row-due.overdue {
  color: var(--danger);
}

.project-list-tasks .row-tags {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
}

.project-list-tasks .row-tag-chip {
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.project-list-tasks .row-due-empty {
  color: var(--text-tertiary);
}

.project-list-tasks .row-assignee {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
}

.project-list-tasks .row-assignee-avatars {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}

.project-list-tasks .row-avatar-multi {
  flex-shrink: 0;
  margin-left: -8px;
  border: 2px solid var(--bg-secondary);
  box-sizing: border-box;
  border-radius: 50%;
}
.project-list-tasks .row-avatar-multi:first-child {
  margin-left: 0;
}

.project-list-tasks .row-assignee-names {
  font-size: var(--font-size-small);
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100px;
}

.project-list-tasks .row-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
}

.project-list-tasks .row-avatar-wrap {
  display: inline-block;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.project-list-tasks .row-avatar-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.project-list-tasks .row-avatar-initial {
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

.project-list-tasks .row-assignee-empty {
  color: var(--text-tertiary);
}

.project-card.ref-style {
  --project-card-color: #667eea;
  position: relative;
  background: color-mix(in srgb, var(--project-card-color) 14%, var(--card, #fff));
  border-radius: var(--radius-md);
  border: 1px solid color-mix(in srgb, var(--project-card-color) 28%, var(--border-subtle));
  border-left: 4px solid var(--project-card-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  padding: var(--spacing-md);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}

.project-card.ref-style:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border-color: color-mix(in srgb, var(--project-card-color) 40%, var(--border-medium));
  background: color-mix(in srgb, var(--project-card-color) 20%, var(--card, #fff));
}

[data-theme="dark"] .project-card.ref-style {
  background: color-mix(in srgb, var(--project-card-color) 18%, var(--card));
  border-color: color-mix(in srgb, var(--project-card-color) 35%, var(--border-subtle));
  border-left-color: var(--project-card-color);
}

[data-theme="dark"] .project-card.ref-style:hover {
  background: color-mix(in srgb, var(--project-card-color) 26%, var(--card));
  border-color: color-mix(in srgb, var(--project-card-color) 45%, var(--border-medium));
}

.project-card-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}

.project-color-bar {
  width: 5px;
  height: 22px;
  border-radius: 3px;
  flex-shrink: 0;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.06);
}

.project-card-title {
  margin: 0;
  font-size: var(--font-size-title);
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.3;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-card-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

/* 仅保留一个删除按钮：若有多个删除按钮则只显示第一个 */
.project-card-actions .project-card-btn--delete ~ .project-card-btn--delete {
  display: none;
}

.project-card-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: color 0.2s ease, background 0.2s ease;
}

.project-card-btn:hover {
  color: var(--text-primary);
  background: var(--bg-tertiary);
}

.project-card-btn--edit:hover {
  color: var(--accent-primary);
}

.project-card-btn--delete:hover {
  color: var(--danger, #E53935);
}

.project-card-btn svg {
  width: 16px;
  height: 16px;
}

.project-card-desc {
  color: var(--text-secondary);
  font-size: var(--font-size-small);
  margin: 0 0 var(--spacing-md);
  min-height: 2.5em;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.project-card-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: var(--spacing-sm);
}

.project-progress-bar-wrap {
  flex: 1;
  height: 10px;
  background: var(--bg-tertiary);
  border-radius: 5px;
  overflow: hidden;
}

.project-progress-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.project-progress-pct {
  font-size: var(--font-size-small);
  font-weight: 600;
  color: var(--text-secondary);
  min-width: 36px;
  text-align: right;
}

.project-card-stats {
  font-size: var(--font-size-small);
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xs, 6px);
}

.project-card-progress-link {
  display: inline-block;
  font-size: var(--font-size-small);
  color: var(--accent-primary, #0d9488);
  text-decoration: none;
  margin-bottom: var(--spacing-xs);
}
.project-card-progress-link:hover {
  text-decoration: underline;
}

.project-card-progress .project-progress-pct {
  font-weight: 700;
  color: var(--text-primary);
}

.project-card-status-counts {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 10px;
  font-size: 12px;
}

.project-card-status-counts .status-count {
  white-space: nowrap;
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 600;
}

.project-card-status-counts .status-count-todo {
  background: color-mix(in srgb, var(--color-status-todo) 18%, transparent);
  color: var(--color-status-todo);
}

.project-card-status-counts .status-count-doing {
  background: color-mix(in srgb, var(--color-status-doing) 22%, transparent);
  color: #92400e;
}

[data-theme="dark"] .project-card-status-counts .status-count-doing {
  color: var(--color-status-doing);
}

.project-card-status-counts .status-count-done {
  background: color-mix(in srgb, var(--color-status-done) 18%, transparent);
  color: var(--color-status-done);
}

.project-card-status-counts .status-count-stalled {
  background: color-mix(in srgb, var(--color-status-stalled) 20%, transparent);
  color: var(--color-status-stalled);
}

.project-card-assignees {
  display: inline-flex;
  align-items: center;
  gap: 0;
  margin-top: var(--spacing-xs, 6px);
  font-size: var(--font-size-small);
}
.project-card-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}
.project-card-avatar-multi {
  margin-left: -6px;
  border: 2px solid var(--bg-primary, #fff);
  box-sizing: border-box;
}
.project-card-avatar-multi:first-child {
  margin-left: 0;
}
.project-card-avatar-initial {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-primary);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
}
.project-card-assignees-more {
  color: var(--text-tertiary);
  margin-left: 4px;
  white-space: nowrap;
}
.project-list-progress-bar {
  flex: 1;
  height: 5px;
  border-radius: 3px;
  background: var(--bg-tertiary);
  overflow: hidden;
  min-width: 60px;
}
.project-list-progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.25s ease;
}

.project-list-status-chips {
  display: flex;
  flex-wrap: nowrap;
  gap: 4px;
  flex-shrink: 0;
}
.project-list-status-chip {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 600;
  white-space: nowrap;
}
.project-list-status-chip.status-todo {
  background: color-mix(in srgb, var(--color-status-todo) 18%, transparent);
  color: var(--color-status-todo);
}
.project-list-status-chip.status-doing {
  background: color-mix(in srgb, var(--color-status-doing) 22%, transparent);
  color: #92400e;
}
[data-theme="dark"] .project-list-status-chip.status-doing { color: var(--color-status-doing); }
.project-list-status-chip.status-done {
  background: color-mix(in srgb, var(--color-status-done) 18%, transparent);
  color: var(--color-status-done);
}
.project-list-status-chip.status-stalled {
  background: color-mix(in srgb, var(--color-status-stalled) 20%, transparent);
  color: var(--color-status-stalled);
}

.project-list-assignees {
  display: inline-flex;
  align-items: center;
  gap: 0;
  margin-top: 4px;
}
.project-list-assignees .project-card-avatar {
  width: 22px;
  height: 22px;
}
.project-list-assignees .project-card-avatar-initial {
  font-size: 10px;
}

/* 新建项目弹窗 */
.create-project-modal :deep(.n-card) {
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(45, 212, 191, 0.08);
}

[data-theme="dark"] .create-project-modal :deep(.n-card) { background: #1e1e2e; }

.create-project-modal :deep(.n-card__content) {
  border-radius: 16px;
  background: #fff;
}

[data-theme="dark"] .create-project-modal :deep(.n-card__content) { background: #1e1e2e; }

.create-project-modal :deep(.n-card-header) {
  padding: 16px 24px;
  border-bottom: 1px solid #e5e7eb;
}

[data-theme="dark"] .create-project-modal :deep(.n-card-header) { border-color: rgba(255,255,255,0.1); }

.create-project-modal__form :deep(.n-form-item-label) {
  color: var(--text-primary);
  font-weight: 500;
}

/* 原生输入框：避免 n-input 在 Teleport 下文字不显示 */
.project-form-input,
.project-form-textarea {
  width: 100%;
  padding: 10px 14px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-primary);
  font-family: inherit;
  background-color: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  transition: border-color 0.15s, box-shadow 0.15s;
  box-sizing: border-box;
}

[data-theme="dark"] .project-form-input,
[data-theme="dark"] .project-form-textarea {
  background-color: rgba(255,255,255,0.06);
  border-color: rgba(255,255,255,0.1);
}

.project-form-input::placeholder,
.project-form-textarea::placeholder {
  color: #9ca3af;
}

.project-form-input:hover,
.project-form-textarea:hover {
  border-color: #d1d5db;
}

.project-form-input:focus,
.project-form-textarea:focus {
  outline: none;
  border-color: #2dd4bf;
  box-shadow: 0 0 0 2px rgba(45, 212, 191, 0.2);
}

.project-form-textarea {
  min-height: 80px;
  resize: vertical;
}

/* 项目弹窗附件 */
.project-modal-attachments {
  width: 100%;
}
.project-modal-attachments__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}
.project-modal-attachments__btn {
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-subtle, #e2e8f0);
  background: var(--bg-tertiary, rgba(0, 0, 0, 0.04));
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}
.project-modal-attachments__btn:hover {
  border-color: #2dd4bf;
  color: #2dd4bf;
}
.project-modal-attachments__input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
  overflow: hidden;
}
.project-modal-attachments__hint,
.project-modal-attachments__empty {
  margin: 0;
  font-size: 12px;
  color: var(--text-tertiary, #94a3b8);
}
.project-modal-attachments__list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 200px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.project-modal-attachments__row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  background: var(--bg-tertiary, rgba(0, 0, 0, 0.04));
  border: 1px solid var(--border-subtle, rgba(0, 0, 0, 0.06));
  font-size: 12px;
}
.project-modal-attachments__row--pending {
  border-style: dashed;
}
.project-modal-attachments__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-primary);
}
.project-modal-attachments__meta {
  flex-shrink: 0;
  color: var(--text-tertiary, #94a3b8);
  font-size: 11px;
}
.project-modal-attachments__actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.project-modal-attachments__link {
  padding: 0;
  border: none;
  background: none;
  color: #2dd4bf;
  font-size: 12px;
  cursor: pointer;
}
.project-modal-attachments__link:hover:not(:disabled) {
  text-decoration: underline;
}
.project-modal-attachments__link:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.project-modal-attachments__link--danger {
  color: #ef4444;
}

/* 输入框：轻微填充背景，统一边框与焦点（保留以兼容其他可能的 n-input） */
.create-project-modal :deep(.n-input),
.create-project-modal :deep(.n-input .n-input__state-border),
.create-project-modal :deep(.n-input .n-input__border) {
  border-radius: var(--radius-sm);
  border-color: var(--border-medium);
  background-color: var(--card, #fff);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.create-project-modal :deep(.n-input:hover .n-input__state-border),
.create-project-modal :deep(.n-input:hover .n-input__border) {
  border-color: var(--border-medium);
}

.create-project-modal :deep(.n-input.n-input--focus .n-input__state-border),
.create-project-modal :deep(.n-input.n-input--focus .n-input__border),
.create-project-modal :deep(.n-input:focus .n-input__state-border),
.create-project-modal :deep(.n-input:focus .n-input__border) {
  border-color: #2dd4bf;
  box-shadow: 0 0 0 2px rgba(45, 212, 191, 0.2);
}

.create-project-modal :deep(.n-input--status-success .n-input__state-border),
.create-project-modal :deep(.n-input--status-success .n-input__border) {
  border-color: var(--border-medium);
}

.create-project-modal :deep(.n-input--status-success.n-input--focus .n-input__state-border),
.create-project-modal :deep(.n-input--status-success.n-input--focus .n-input__border) {
  border-color: #2dd4bf;
}

/* 确保输入内容可见：Naive 内部 input/textarea 可能被 teleport 或主题覆盖 */
.create-project-modal :deep(.n-input__input-el),
.create-project-modal :deep(.n-input .n-input__textarea-el) {
  color: var(--text-primary) !important;
  -webkit-text-fill-color: var(--text-primary) !important;
}

.create-project-modal__form :deep(input),
.create-project-modal__form :deep(textarea) {
  color: var(--text-primary) !important;
  -webkit-text-fill-color: var(--text-primary) !important;
  caret-color: var(--text-primary);
}

.create-project-modal :deep(.n-input .n-input__placeholder) {
  color: var(--text-tertiary);
}

/* 颜色：参考图二 - 一排圆形色板，选中项高亮环 */
.create-project-modal__color-swatches {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.create-project-modal__color-swatches .color-swatch {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid transparent;
  padding: 0;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  flex-shrink: 0;
}

.create-project-modal__color-swatches .color-swatch:hover {
  transform: scale(1.1);
}

.create-project-modal__color-swatches .color-swatch--selected {
  border-color: var(--text-primary);
  box-shadow: 0 0 0 2px var(--card, #fff);
  transform: scale(1.05);
}

[data-theme="dark"] .create-project-modal__color-swatches .color-swatch--selected {
  border-color: #2dd4bf;
  box-shadow: 0 0 0 2px var(--bg-secondary);
}

/* 自定义颜色：28px 正圆，绝对定位 + 圆形裁剪保证与预设一致 */
.create-project-modal__color-swatches .color-swatch--custom {
  position: relative;
  width: 28px;
  height: 28px;
  min-width: 28px;
  min-height: 28px;
  max-width: 28px;
  max-height: 28px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  align-self: center;
  clip-path: circle(14px at 14px 14px);
  padding: 0;
  cursor: pointer;
  box-sizing: border-box;
}

.create-project-modal__color-swatches .color-swatch--custom:hover {
  transform: scale(1.1);
}

.create-project-modal__color-swatches .color-swatch-picker {
  position: absolute;
  inset: 0;
  width: 28px !important;
  height: 28px !important;
  border-radius: 50%;
  overflow: hidden;
  clip-path: circle(14px at 14px 14px);
}

/* Naive UI 2.x 取色器触发器为 .n-color-picker / .n-color-picker__fill / .n-color-picker__value（无 -trigger- 前缀） */
.create-project-modal__color-swatches .color-swatch-picker :deep(.n-color-picker),
.create-project-modal__color-swatches .color-swatch-picker :deep(.n-button) {
  width: 28px !important;
  height: 28px !important;
  min-width: 28px !important;
  min-height: 0 !important;
  max-width: 28px !important;
  max-height: 28px !important;
  padding: 0 !important;
  border-radius: 50% !important;
  border: none !important;
  background: transparent !important;
  overflow: hidden !important;
  clip-path: circle(14px at 14px 14px) !important;
  line-height: 0 !important;
  display: block !important;
}

.create-project-modal__color-swatches .color-swatch-picker :deep(.n-color-picker__fill) {
  position: absolute !important;
  inset: 0 !important;
  width: 28px !important;
  height: 28px !important;
  min-width: 28px !important;
  min-height: 28px !important;
  max-width: 28px !important;
  max-height: 28px !important;
  border-radius: 50% !important;
  overflow: hidden !important;
  clip-path: circle(14px at 14px 14px) !important;
}

.create-project-modal__color-swatches .color-swatch-picker :deep(.n-color-picker__fill *) {
  border-radius: 50% !important;
}

.create-project-modal__color-swatches .color-swatch-picker :deep(.n-color-picker__value),
.create-project-modal__color-swatches .color-swatch-picker :deep(.n-button__content) {
  display: none !important;
}

.create-project-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

[data-theme="dark"] .create-project-modal__footer { border-color: rgba(255,255,255,0.1); }

.create-project-modal__cancel {
  padding: 10px 20px;
  border: 1px solid #e2e8f0;
  background: transparent;
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.15s;
}

.create-project-modal__cancel:hover {
  background: rgba(45, 212, 191, 0.06);
  border-color: #2dd4bf;
}

/* 删除项目确认弹窗：美化标题、正文、按钮与字体 */
.delete-project-modal :deep(.n-card) {
  border-radius: var(--radius-lg);
  background: var(--bg-secondary, #F8F6FB);
  box-shadow: var(--shadow-elevated);
}

.delete-project-modal :deep(.n-card__content) {
  border-radius: var(--radius-lg);
  background: var(--bg-secondary, #F8F6FB);
  padding: var(--spacing-md) var(--spacing-lg);
}

.delete-project-modal :deep(.n-card-header) {
  padding: var(--spacing-md) var(--spacing-lg) var(--spacing-sm);
}

.delete-project-modal :deep(.n-card-header__main) {
  font-size: var(--font-size-h1);
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0.02em;
}

.delete-project-modal__message-wrap {
  margin: 0;
  padding: var(--spacing-md) var(--spacing-md);
  background: var(--card, #fff);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  box-sizing: border-box;
}

.delete-project-modal__message {
  margin: 0;
  font-size: var(--font-size-base);
  font-weight: 400;
  color: var(--text-primary);
  line-height: 1.65;
  letter-spacing: 0.01em;
}

.delete-project-modal__message strong {
  color: var(--accent-primary);
  font-weight: 700;
  font-size: 1.05em;
}

.delete-project-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  align-items: center;
  padding-top: var(--spacing-lg);
  margin-top: var(--spacing-sm);
  border-top: 1px solid var(--border-subtle);
}

.delete-project-modal__cancel {
  padding: 10px 20px;
  border: 1px solid var(--border-medium);
  background: var(--card, #fff);
  color: var(--text-secondary);
  font-size: var(--font-size-base);
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: color 0.2s ease, background 0.2s ease, border-color 0.2s ease;
}

.delete-project-modal__cancel:hover {
  color: var(--text-primary);
  background: var(--bg-tertiary);
  border-color: var(--border-medium);
}

.delete-project-modal__confirm {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 22px;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--danger, #E53935);
  color: #fff;
  font-size: var(--font-size-base);
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(229, 57, 53, 0.35);
  transition: opacity 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.delete-project-modal__confirm:hover:not(:disabled) {
  opacity: 0.95;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(229, 57, 53, 0.4);
}

.delete-project-modal__confirm:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}
</style>

<!-- 弹窗被 Teleport 到 body 时 scoped 不生效，用全局样式 + data 属性 + inputProps 三重保证输入框文字可见 -->
<style>
/* 通过 data-project-form 精确命中新建/编辑项目弹窗内的输入（卡片上必有该属性） */
[data-project-form="true"] .n-input__input-el,
[data-project-form="true"] .n-input__textarea-el,
[data-project-form="true"] .n-input .n-input__input-el,
[data-project-form="true"] .n-input .n-input__textarea-el,
[data-project-form="true"] input[type="text"],
[data-project-form="true"] input:not([type]),
[data-project-form="true"] textarea,
.create-project-modal .n-input__input-el,
.create-project-modal .n-input .n-input__textarea-el,
.create-project-modal__card .n-input__input-el,
.create-project-modal__card .n-input .n-input__textarea-el,
.create-project-modal__card input[type="text"],
.create-project-modal__card input:not([type]),
.create-project-modal__card textarea {
  color: #000 !important;
  -webkit-text-fill-color: #000 !important;
  caret-color: #000;
  opacity: 1 !important;
  font-size: 14px !important;
}
[data-theme="dark"] [data-project-form="true"] .n-input__input-el,
[data-theme="dark"] [data-project-form="true"] .n-input__textarea-el,
[data-theme="dark"] [data-project-form="true"] .n-input .n-input__input-el,
[data-theme="dark"] [data-project-form="true"] .n-input .n-input__textarea-el,
[data-theme="dark"] [data-project-form="true"] input,
[data-theme="dark"] [data-project-form="true"] textarea,
[data-theme="dark"] .create-project-modal .n-input__input-el,
[data-theme="dark"] .create-project-modal .n-input .n-input__textarea-el,
[data-theme="dark"] .create-project-modal__card .n-input__input-el,
[data-theme="dark"] .create-project-modal__card .n-input .n-input__textarea-el,
[data-theme="dark"] .create-project-modal__card input,
[data-theme="dark"] .create-project-modal__card textarea {
  color: #fff !important;
  -webkit-text-fill-color: #fff !important;
  caret-color: #fff;
  opacity: 1 !important;
  font-size: 14px !important;
}
</style>
