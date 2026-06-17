<template>
  <n-modal
    :show="modelValue"
    class="create-task-modal"
    preset="card"
    :bordered="false"
    size="huge"
    style="width: 720px; max-width: 95vw"
    role="dialog"
    aria-modal="true"
    :mask-closable="true"
    :closable="false"
    @update:show="(v: boolean) => $emit('update:modelValue', v)"
    @after-leave="resetForm"
  >
    <template #header>
      <div class="task-modal-header">
        <span class="task-modal-header-title">{{ editTask ? '编辑任务' : '新建任务' }}</span>
        <div class="task-modal-header-actions">
          <button type="button" class="task-modal-header-btn" title="附加" @click="triggerFileInput">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
            <span class="task-modal-header-btn-text">附加</span>
          </button>
          <button type="button" class="task-modal-header-btn task-modal-header-btn-icon" title="更多" aria-label="更多">
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><circle cx="12" cy="12" r="1.5"/><circle cx="6" cy="12" r="1.5"/><circle cx="18" cy="12" r="1.5"/></svg>
          </button>
          <button type="button" class="task-modal-header-btn task-modal-header-btn-close" aria-label="关闭" @click="$emit('update:modelValue', false)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
    </template>

    <div class="create-task-form">
      <!-- 隐藏文件选择器，供头部「附加」触发 -->
      <input
        ref="fileInputRef"
        type="file"
        multiple
        class="attachment-input-hidden"
        @change="onFileSelect"
      />
      <!-- 标题区：大标题输入（无图标、无输入框样式），输入内容大写加粗 -->
      <div class="form-title-block">
        <n-input
          v-model:value="form.title"
          placeholder="输入任务标题名称"
          clearable
          class="form-title-input"
          :bordered="false"
          :input-props="{ style: { fontWeight: '600', fontSize: '1.1rem' } }"
        />
      </div>

      <!-- 属性列表：左侧标签、右侧值 -->
      <div class="form-props">
        <div class="form-prop-row">
          <span class="form-prop-label">状态</span>
          <div class="form-prop-value">
            <n-select
              v-model:value="form.status"
              :options="statusSelectOptions"
              :to="false"
              placeholder="选择状态"
              class="form-prop-select"
              :render-label="renderStatusLabel"
            />
          </div>
        </div>
        <div class="form-prop-row">
          <span class="form-prop-label">优先级</span>
          <div class="form-prop-value">
            <n-select
              v-model:value="form.priority"
              :options="prioritySelectOptions"
              :to="false"
              placeholder="选择优先级"
              class="form-prop-select"
              :render-label="renderPriorityLabel"
            />
          </div>
        </div>
        <!-- 标签 -->
        <div class="form-prop-row">
          <span class="form-prop-label">标签</span>
          <div class="form-prop-value">
            <template v-if="allTags.length === 0">
              <span class="form-tags-empty">暂无标签，请先在设置中创建</span>
              <router-link :to="{ name: 'Settings', query: { nav: 'tags' } }" class="form-tags-goto">前往设置</router-link>
            </template>
            <n-select
              v-else
              v-model:value="form.tagIds"
              multiple
              :to="false"
              :options="tagSelectOptions"
              placeholder="选择标签"
              class="form-prop-select"
              :render-label="renderTagLabel"
              :render-tag="renderTagTag"
            />
          </div>
        </div>
        <template v-if="editTask">
          <div class="form-prop-row">
            <span class="form-prop-label">创建者</span>
            <span class="form-prop-value form-prop-value-text">{{ currentUserLabel }}</span>
          </div>
          <div class="form-prop-row">
            <span class="form-prop-label">创建时间</span>
            <span class="form-prop-value form-prop-value-text">{{ editTaskCreatedTime }}</span>
          </div>
        </template>
        <div class="form-prop-row">
          <span class="form-prop-label">开始时间 — 截止时间</span>
          <n-date-picker
            v-model:value="dateTimeRangeValue"
            type="datetimerange"
            clearable
            start-placeholder="开始时间"
            end-placeholder="截止时间"
            class="form-prop-value form-date form-date--range"
          />
        </div>
        <div v-if="canSetProject" class="form-prop-row">
          <span class="form-prop-label">所属项目</span>
          <n-select
            v-model:value="form.projectValue"
            filterable
            tag
            clearable
            :to="false"
            placeholder="选择或输入新项目名称"
            :options="projectSelectOptions"
            class="form-prop-value form-select"
          />
        </div>

        <!-- 新增属性（可折叠） -->
        <div v-if="showExtraProps" class="form-extra-props">
          <div class="form-prop-row">
            <span class="form-prop-label">任务重复</span>
            <div class="form-prop-value">
              <n-select
                v-model:value="form.repeatType"
                :options="repeatTypeOptions"
                :to="false"
                placeholder="不重复"
                class="form-select"
              />
              <div v-if="form.repeatType === 'custom'" class="repeat-custom-row">
                <span class="repeat-custom-label">每</span>
                <n-input-number
                  v-model:value="form.repeatCustomInterval"
                  :min="1"
                  :max="99"
                  placeholder="1"
                  class="repeat-custom-interval"
                />
                <n-select
                  v-model:value="form.repeatCustomUnit"
                  :options="repeatCustomUnitOptions"
                  :to="false"
                  class="form-select repeat-custom-unit"
                />
                <span class="repeat-custom-label">结束日期</span>
                <n-date-picker
                  v-model:value="form.repeatEndDateTs"
                  type="date"
                  clearable
                  placeholder="可选"
                  class="form-date repeat-custom-end"
                />
              </div>
            </div>
          </div>
          <div class="form-prop-row">
            <span class="form-prop-label">提醒</span>
            <div class="form-prop-value form-prop-value--remind">
              <n-select
                v-model:value="form.remindPreset"
                :options="remindPresetOptions"
                :to="false"
                placeholder="选择提醒时间"
                clearable
                class="form-select"
              />
              <template v-if="form.remindPreset === 'custom'">
                <n-date-picker
                  v-model:value="form.remindAtTs"
                  type="datetime"
                  clearable
                  placeholder="选择日期与时间"
                  class="form-date remind-custom-date"
                />
              </template>
              <p v-else-if="form.remindPreset && !form.dueTimeTs && !form.startTimeTs" class="form-hint">请先设置开始时间或截止时间，将按该时间提前提醒</p>
            </div>
          </div>
          <div class="form-prop-row">
            <span class="form-prop-label">负责人</span>
            <n-select
              v-model:value="form.assigneeIds"
              multiple
              clearable
              :to="false"
              placeholder="选择负责人"
              :options="assigneeOptions"
              :render-label="renderAssigneeLabel"
              :render-tag="renderAssigneeTag"
              class="form-prop-value form-select assignee-select"
            />
          </div>
        </div>
        <button type="button" class="form-add-prop-btn" @click="showExtraProps = !showExtraProps">
          <span class="form-add-prop-icon">+</span>
          {{ showExtraProps ? '收起属性' : '新增属性' }}
        </button>
      </div>

      <!-- 附件：添加成功后以卡片展示，可下载、删除 -->
      <div class="form-section attachment-display-section">
        <div class="attachment-display-header">
          <span class="attachment-display-title">附件 ({{ attachmentCount }})</span>
          <button type="button" class="attachment-display-add" title="添加附件" @click="triggerFileInput">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>
        <div v-if="attachmentCount > 0" class="attachment-display-list">
          <!-- 新建任务：待上传列表 -->
          <div v-for="(file, index) in pendingFiles" :key="'pending-' + index" class="attachment-card">
            <span class="attachment-card-icon" aria-hidden="true">{{ fileCardIcon(file.name) }}</span>
            <div class="attachment-card-body">
              <span class="attachment-card-name" :title="file.name">{{ truncateFileName(file.name) }}</span>
              <span class="attachment-card-meta">{{ fileExtensionUpper(file.name) }} · {{ formatFileSize(file.size) }}</span>
            </div>
            <div class="attachment-card-actions">
              <button type="button" class="attachment-card-btn" title="删除" @click="removePendingFile(index)">删除</button>
            </div>
          </div>
          <!-- 编辑任务：已上传列表 -->
          <div v-for="att in attachments" :key="att.id" class="attachment-card">
            <span class="attachment-card-icon" aria-hidden="true">{{ attachmentCardIcon(att) }}</span>
            <div class="attachment-card-body">
              <span class="attachment-card-name" :title="att.fileName">{{ truncateFileName(att.fileName) }}</span>
              <span class="attachment-card-meta">{{ attachmentTypeLabel(att) }} · {{ formatFileSize(att.fileSize) }}</span>
            </div>
            <div class="attachment-card-actions">
              <button
                type="button"
                class="attachment-card-btn attachment-btn-download"
                :disabled="isSubmitting || downloadingAttachmentId === att.id"
                @click="downloadAttachment(att)"
              >
                <span v-if="downloadingAttachmentId === att.id">下载中...</span>
                <span v-else>下载</span>
              </button>
              <button
                type="button"
                class="attachment-card-btn"
                title="预览"
                :disabled="isSubmitting"
                @click="openAttachmentPreview(att)"
              >
                预览
              </button>
              <button type="button" class="attachment-card-btn attachment-card-btn--danger" title="删除" :disabled="isSubmitting" @click="removeAttachment(att)">删除</button>
            </div>
          </div>
        </div>
        <p v-if="uploadError" class="attachment-error">{{ uploadError }}</p>
      </div>

      <!-- 任务描述 -->
      <div class="form-section form-description-block">
        <div class="section-header">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" class="section-header-icon"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          <span class="section-header-text">任务描述</span>
        </div>
        <n-input
          v-model:value="form.description"
          type="textarea"
          placeholder="输入任务描述..."
          :rows="4"
          class="form-input form-description-input"
        />
      </div>

      <!-- 评论：仅编辑时显示 -->
      <div v-if="editTask" class="form-section comment-section">
        <div class="section-header">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" class="section-header-icon"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span class="section-header-text">评论 ({{ comments.length }})</span>
        </div>
        <div v-if="comments.length" class="comment-list">
          <div v-for="c in comments" :key="c.id" class="comment-item">
            <div class="comment-avatar-wrap">
              <img
                v-if="commentDisplayUser(c)?.avatar && !commentAvatarLoadFailed[c.id]"
                :src="getAvatarUrl(commentDisplayUser(c)?.avatar)"
                alt=""
                class="comment-avatar-img"
                @error="onCommentAvatarError(c.id)"
              />
              <span v-else class="comment-avatar-initial">{{ (commentAuthorName(c) || '?')[0] }}</span>
            </div>
            <div class="comment-body">
              <span class="comment-author">{{ commentAuthorName(c) }}</span>
              <span class="comment-time">{{ formatCommentTime(c.createdAt) }}</span>
              <p class="comment-content">{{ c.content }}</p>
            </div>
            <button
              v-if="canDeleteComment(c)"
              type="button"
              class="comment-delete"
              aria-label="删除"
              :disabled="commentSubmitting"
              @click="handleDeleteComment(c)"
            >删除</button>
          </div>
        </div>
        <div class="comment-input-row comment-input-row--single">
          <n-input
            v-model:value="commentDraft"
            type="textarea"
            placeholder="输入评论内容..."
            :rows="2"
            class="comment-input"
            @keydown.ctrl.enter="submitComment"
          />
          <button
            type="button"
            class="btn-primary comment-submit"
            :disabled="!commentDraft.trim() || commentSubmitting"
            @click="submitComment"
          >
            {{ commentSubmitting ? '发送中…' : '发送' }}
          </button>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="modal-footer">
        <button v-if="editTask" type="button" class="btn-footer btn-footer--danger" :disabled="isSubmitting" @click="showDeleteTaskConfirm = true">
          删除任务
        </button>
        <button
          v-if="editTask && (form.status === 'done' || normalizeTaskStatus(editTask.status) === 'done')"
          type="button"
          class="btn-footer btn-footer--archive"
          :disabled="isSubmitting"
          @click="handleArchive"
        >
          归档
        </button>
        <button type="button" class="btn-footer btn-footer--cancel" @click="$emit('update:modelValue', false)">
          取消
        </button>
        <button
          type="button"
          class="btn-footer btn-footer--primary"
          :disabled="isSubmitting || !form.title.trim()"
          @click="handleSubmit"
        >
          <span v-if="!isSubmitting">{{ editTask ? '保存' : '创建' }}</span>
          <span v-else class="loading-spinner"></span>
        </button>
      </div>
    </template>
  </n-modal>

  <!-- 删除任务确认提示 -->
  <ConfirmModal
    v-model="showDeleteTaskConfirm"
    title="删除提示"
    content="确定要删除该任务吗？删除后不可恢复。"
    confirm-text="确 定"
    cancel-text="取 消"
    @confirm="confirmDeleteTask"
  />

  <!-- 附件预览弹窗：仅当 GET /api/attachments/{id}/download 返回 2xx 时才展示内容 -->
  <n-modal
    v-model:show="previewVisible"
    class="attachment-preview-modal"
    preset="card"
    :title="previewAtt?.fileName ?? '预览'"
    style="width: 90vw; max-width: 900px"
    @after-leave="onPreviewModalAfterLeave"
  >
    <div v-if="previewAtt" class="preview-content">
      <p v-if="previewLoading" class="preview-loading">加载中…</p>
      <p v-else-if="previewLoadError" class="preview-error">加载失败：{{ previewLoadError }}</p>
      <template v-else-if="previewBlobUrl">
        <template v-if="previewType === 'image'">
          <img :src="previewBlobUrl" :alt="previewAtt.fileName" class="preview-media preview-image" />
        </template>
        <template v-else-if="previewType === 'video'">
          <video :src="previewBlobUrl" controls class="preview-media preview-video" :title="previewAtt.fileName" />
        </template>
        <template v-else-if="previewType === 'pdf'">
          <iframe :src="previewBlobUrl" class="preview-media preview-iframe" :title="previewAtt.fileName" />
        </template>
        <template v-else>
          <p class="preview-fallback">该类型文件不支持在线预览，请使用「下载」或在新标签页打开查看。</p>
          <button type="button" class="preview-open-link" @click="openPreviewInNewTab">在新标签页打开</button>
        </template>
      </template>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, h } from 'vue';
import { NModal, NInput, NInputNumber, NSelect, NDatePicker, NAvatar, NTag } from 'naive-ui';
import type { SelectOption, SelectRenderTag } from 'naive-ui';
import ConfirmModal from '@/components/ConfirmModal.vue';
import dayjs from 'dayjs';
import projectApi from '@/api/project';
import tagApi from '@/api/tag';
import teamApi from '@/api/team';
import attachmentApi from '@/api/attachment';
import { downloadAttachment as downloadAttachmentById, triggerSave } from '@/api/attachmentDownload';
import commentApi from '@/api/comment';
import { useUserStore } from '@/stores/user';
import { isProjectManagerOrAdmin } from '@/constants/role';
import { getAvatarUrl } from '@/utils/request';
import { formatDate } from '@/utils/date';
import { normalizeTaskStatus, normalizeUserFromPayload } from '@/utils/task';
import { teamMemberToUser } from '@/composables/useProjectAssignees';
import { useUserProfileCache } from '@/composables/useUserProfileCache';
import type { Project, Tag, TeamMember, User } from '@/types';
import type { Task, Attachment, Comment } from '@/types';

const validStatuses = ['todo', 'doing', 'done', 'stalled'] as const;

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    loading?: boolean;
    /** 从看板某列点击「新建」时传入，新任务默认使用该状态 */
    defaultStatus?: string;
    /** 从日历点击时间段新建时传入，默认开始时间 YYYY-MM-DD HH:mm:ss */
    defaultStartTime?: string | null;
    /** 从日历点击日期/时间段新建时传入，默认截止（YYYY-MM-DD 或 YYYY-MM-DD HH:mm:ss） */
    defaultDueTime?: string | null;
    /** 从项目列表「添加任务」传入，新任务默认归属该项目 */
    defaultProjectId?: number | null;
    /** 编辑时传入，弹窗以编辑模式打开 */
    editTask?: Task | null;
  }>(),
  { loading: false, defaultStatus: undefined, defaultStartTime: null, defaultDueTime: null, defaultProjectId: null, editTask: null }
);

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void;
  (e: 'submit', payload: Partial<Task>, pendingFiles?: File[]): void;
  (e: 'update', taskId: number, payload: Partial<Task>): void;
  (e: 'delete', taskId: number): void;
  (e: 'archive', taskId: number): void;
}>();

const userStore = useUserStore();
const userProfileCache = useUserProfileCache();
const canSetProject = computed(() => isProjectManagerOrAdmin(userStore.user?.role));
const projects = ref<Project[]>([]);
const isSubmitting = computed(() => props.loading);
const fileInputRef = ref<HTMLInputElement | null>(null);
const pendingFiles = ref<File[]>([]);
const attachments = ref<Attachment[]>([]);
const uploadError = ref('');
const previewVisible = ref(false);
const previewAtt = ref<Attachment | null>(null);
const previewBlobUrl = ref<string | null>(null);
const previewLoadError = ref<string | null>(null);
const previewLoading = ref(false);
const showDeleteTaskConfirm = ref(false);

const comments = ref<Comment[]>([]);
/** 评论头像加载失败时回退到首字，避免裂图占位 */
const commentAvatarLoadFailed = ref<Record<number, boolean>>({});
const commentDraft = ref('');
const commentSubmitting = ref(false);
const showExtraProps = ref(false);
const downloadingAttachmentId = ref<number | null>(null);

type RepeatType = '' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
type RemindPreset = '' | '15m' | '30m' | '1h' | '3h' | '1d' | 'custom';

const form = ref({
  title: '',
  description: '',
  priority: 3 as number,
  status: 'todo' as Task['status'],
  projectValue: null as number | string | null,
  tagIds: [] as number[],
  startTimeTs: null as number | null,
  dueTimeTs: null as number | null,
  repeatType: '' as RepeatType,
  repeatCustomInterval: 1 as number,
  repeatCustomUnit: 'daily' as 'daily' | 'weekly' | 'monthly',
  repeatEndDateTs: null as number | null,
  remindPreset: '' as RemindPreset,
  remindAtTs: null as number | null,
  assigneeId: null as number | null,
  assigneeIds: [] as number[],
});

const allTags = ref<Tag[]>([]);
/** 当前用户所在团队的全部成员（去重），用于负责人下拉 */
const teamMembers = ref<TeamMember[]>([]);

watch(
  teamMembers,
  (list) => {
    userProfileCache.seedUsers(list.map((m) => teamMemberToUser(m)));
  },
  { deep: true }
);

const repeatTypeOptions: { label: string; value: RepeatType }[] = [
  { label: '不重复', value: '' },
  { label: '每天', value: 'daily' },
  { label: '每周', value: 'weekly' },
  { label: '每月', value: 'monthly' },
  { label: '每年', value: 'yearly' },
  { label: '自定义重复时间', value: 'custom' },
];

const repeatCustomUnitOptions: { label: string; value: 'daily' | 'weekly' | 'monthly' }[] = [
  { label: '天', value: 'daily' },
  { label: '周', value: 'weekly' },
  { label: '月', value: 'monthly' },
];

const remindPresetOptions: { label: string; value: RemindPreset }[] = [
  { label: '不提醒', value: '' },
  { label: '前15分钟', value: '15m' },
  { label: '前30分钟', value: '30m' },
  { label: '前1小时', value: '1h' },
  { label: '前3小时', value: '3h' },
  { label: '前一天', value: '1d' },
  { label: '自定义', value: 'custom' },
];

/** 时间范围选择器与 form 的 start/due 双向同步，便于从开始时间滑动到截止时间选择 */
const dateTimeRangeValue = computed({
  get(): [number, number] | null {
    const s = form.value.startTimeTs;
    const d = form.value.dueTimeTs;
    if (s == null && d == null) return null;
    const start = s ?? d ?? 0;
    const end = d ?? s ?? 0;
    return [Math.min(start, end), Math.max(start, end)];
  },
  set(v: [number, number] | null) {
    if (v == null) {
      form.value.startTimeTs = null;
      form.value.dueTimeTs = null;
    } else {
      form.value.startTimeTs = v[0];
      form.value.dueTimeTs = v[1];
    }
  },
});

/** 优先级芯片（四象限）：与状态/标签同风格，后端用 1–4 表示 */
const priorityChipOptions = [
  { value: 4 as const, label: '重要且紧急', color: '#ef4444' },
  { value: 3 as const, label: '重要不紧急', color: '#3b82f6' },
  { value: 2 as const, label: '不重要但紧急', color: '#eab308' },
  { value: 1 as const, label: '不重要也不紧急', color: '#94a3b8' },
];

/** 将接口返回的 priority 转为 1–4（兼容旧 1–5 星或 high/medium/low） */
function normalizePriority(p: Task['priority'] | undefined): number {
  if (typeof p === 'number') {
    const n = Math.min(5, Math.max(1, p));
    return n >= 4 ? 4 : n >= 3 ? 3 : n >= 2 ? 2 : 1;
  }
  if (p === 'high') return 4;
  if (p === 'medium') return 3;
  return 1;
}

/** 状态选项 */
const statusChipOptions = [
  { value: 'todo' as const, label: '待办', color: '#3b82f6' },
  { value: 'doing' as const, label: '进行中', color: '#eab308' },
  { value: 'done' as const, label: '已完成', color: '#22c55e' },
  { value: 'stalled' as const, label: '搁置', color: '#94a3b8' },
];

const statusSelectOptions = statusChipOptions.map(o => ({ label: o.label, value: o.value, color: o.color }));
const prioritySelectOptions = priorityChipOptions.map(o => ({ label: o.label, value: o.value, color: o.color }));
const tagSelectOptions = computed(() =>
  allTags.value.map(t => ({ label: t.name, value: t.id, color: t.color || '#94a3b8' }))
);

function renderColorDot(color: string) {
  return h('span', { style: { display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color, marginRight: '8px', flexShrink: 0 } });
}

function renderStatusLabel(option: SelectOption) {
  const opt = statusChipOptions.find(o => o.value === option.value);
  return h('span', { style: { display: 'flex', alignItems: 'center' } }, [
    renderColorDot(opt?.color || '#94a3b8'),
    String(option.label),
  ]);
}

function renderPriorityLabel(option: SelectOption) {
  const opt = priorityChipOptions.find(o => o.value === option.value);
  return h('span', { style: { display: 'flex', alignItems: 'center' } }, [
    renderColorDot(opt?.color || '#94a3b8'),
    String(option.label),
  ]);
}

function renderTagLabel(option: SelectOption) {
  const tag = allTags.value.find(t => t.id === option.value);
  return h('span', { style: { display: 'flex', alignItems: 'center' } }, [
    renderColorDot(tag?.color || '#94a3b8'),
    String(option.label),
  ]);
}

const renderTagTag: SelectRenderTag = ({ option, handleClose }) => {
  const tag = allTags.value.find(t => t.id === option.value);
  return h(NTag, {
    closable: true,
    onClose: handleClose,
    round: true,
    size: 'small',
    color: { color: (tag?.color || '#94a3b8') + '22', textColor: tag?.color || '#64748b', borderColor: (tag?.color || '#94a3b8') + '44' },
  }, { default: () => option.label });
};

const projectSelectOptions = computed(() =>
  projects.value.map(p => ({ label: p.name, value: p.id }))
);

const currentUserLabel = computed(() => userStore.user?.nickname || userStore.user?.username || '我');

const editTaskCreatedTime = computed(() => {
  const t = props.editTask;
  if (!t?.createdAt) return '—';
  return formatDate(t.createdAt);
});

const assigneeOptions = computed(() => {
  const u = userStore.user;
  const list = teamMembers.value;
  const byUserId = new Map<number, TeamMember>();
  for (const m of list) {
    if (m.status === 'active' && !byUserId.has(m.userId)) byUserId.set(m.userId, m);
  }
  const options = Array.from(byUserId.values()).map((m) => {
    const tu = teamMemberToUser(m);
    return {
      label: tu.nickname || tu.email,
      value: tu.id,
      avatar: tu.avatar,
      nickname: tu.nickname,
      email: tu.email,
      username: tu.username,
    };
  });
  if (u && !byUserId.has(u.id)) {
    const meAv = normalizeUserFromPayload(u)?.avatar ?? u.avatar;
    options.unshift({
      label: u.username || u.nickname || u.email || '我',
      value: u.id,
      avatar: meAv,
      nickname: u.nickname,
      email: u.email,
      username: u.username,
    });
  }
  return options;
});

/** 负责人选项类型（含头像、用户名等用于渲染） */
type AssigneeOption = { label: string; value: number; avatar?: string; nickname?: string; email?: string; username?: string };

/** 合并选项、当前用户、团队成员与编辑中任务自带的 assignees 头像 */
function rawAvatarForAssignee(option: AssigneeOption): string | undefined {
  const t = option.avatar?.trim();
  if (t) return option.avatar;
  const uid = option.value;
  const me = userStore.user;
  // GET /auth/me 等可能只返回 avatar_url，User.avatar 为空；与 normalizeUserFromPayload 对齐
  if (me && uid === me.id) {
    const fromMe = normalizeUserFromPayload(me)?.avatar?.trim();
    if (fromMe) return fromMe;
  }
  const m = teamMembers.value.find((x) => x.userId === uid);
  if (m) {
    const tu = teamMemberToUser(m);
    if (tu.avatar?.trim()) return tu.avatar;
  }
  const task = props.editTask;
  if (task?.assignees?.length) {
    const au = task.assignees.find((x) => x.id === uid);
    if (au) {
      const nu = normalizeUserFromPayload(au) ?? au;
      if (nu.avatar?.trim()) return nu.avatar;
    }
  }
  if (task?.assignee?.id === uid && task.assignee) {
    const nu = normalizeUserFromPayload(task.assignee) ?? task.assignee;
    if (nu.avatar?.trim()) return nu.avatar;
  }
  return undefined;
}

/** Naive UI Avatar：有 src 时须提供 fallback 槽，否则图片 404/鉴权失败时无法显示首字母 */
function assigneeAvatarVNode(initial: string, avatarUrl: string | undefined, size: number | 'small' | 'medium' = 'small') {
  return h(
    NAvatar,
    { round: true, size, src: avatarUrl },
    avatarUrl ? { fallback: () => initial } : { default: () => initial }
  );
}

function renderAssigneeLabel(option: AssigneeOption) {
  const u = userStore.user;
  const isCurrentUser = u && option.value === u.id;
  const displayName = option.username ?? option.nickname ?? option.label;
  const initial = (displayName || option.email || '?')[0].toUpperCase();
  const avatarUrl = getAvatarUrl(rawAvatarForAssignee(option)) || undefined;
  return h('div', { class: 'assignee-option assignee-option--dropdown' }, [
    assigneeAvatarVNode(initial, avatarUrl),
    h('span', { class: 'assignee-option-name' }, isCurrentUser ? `${displayName}（当前用户）` : (option.nickname || option.label)),
  ]);
}

const renderAssigneeTag: SelectRenderTag = ({ option, handleClose }) => {
  const raw = option as SelectOption & Partial<AssigneeOption>;
  const id = Number(raw.value);
  const fromOpts = assigneeOptions.value.find((o) => o.value === id);
  const opt: AssigneeOption =
    fromOpts ??
    ({
      label: String(raw.label ?? ''),
      value: id,
      avatar: raw.avatar,
      nickname: raw.nickname,
      email: raw.email,
      username: raw.username,
    } as AssigneeOption);
  const u = userStore.user;
  const isCurrentUser = u && opt.value === u.id;
  const displayName = opt.username ?? opt.nickname ?? opt.label;
  const initial = (displayName || opt.email || '?')[0].toUpperCase();
  const avatarUrl = getAvatarUrl(rawAvatarForAssignee(opt)) || undefined;
  return h(
    NTag,
    {
      closable: true,
      onClose: handleClose,
      round: true,
      size: 'small',
      class: 'assignee-select-tag',
    },
    {
      default: () =>
        h('div', { class: 'assignee-option assignee-option--tag' }, [
          assigneeAvatarVNode(initial, avatarUrl, 30),
          h(
            'span',
            { class: 'assignee-option-name' },
            isCurrentUser ? `${displayName}（当前用户）` : opt.nickname || opt.label
          ),
        ]),
    }
  );
};

watch(() => [props.modelValue, props.editTask] as const, ([show, edit]) => {
    if (show) {
    userStore.fetchCurrentUser().catch(() => {});
    projectApi.getProjects().then((list) => {
      projects.value = list;
    }).catch(() => {});
    tagApi.getList().then((list) => {
      allTags.value = list ?? [];
    }).catch(() => { allTags.value = []; });
    teamApi.getMyTeams().then((teams) => {
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
    pendingFiles.value = [];
    attachments.value = [];
    uploadError.value = '';
    if (edit) {
      const t = edit;
      const r = t.repeatRule;
      const isPreset = r && (r.type === 'daily' || r.type === 'weekly' || r.type === 'monthly' || r.type === 'yearly');
      const isCustom = r && (r.type === 'daily' || r.type === 'weekly' || r.type === 'monthly') && (r.interval ?? 1) > 1;
      const repeatType: RepeatType = isCustom ? 'custom' : isPreset ? r!.type : '';
      const interval = Math.max(1, Math.min(99, r?.interval ?? 1));
      const unit = r?.type === 'weekly' || r?.type === 'monthly' ? r.type : 'daily';
      const endDate = r?.endDate ? dayjs(r.endDate).valueOf() : null;
      const tagIds = t.tagIds ?? t.tags?.map(x => x.id) ?? [];
      form.value = {
        title: t.title,
        description: t.description ?? '',
        priority: normalizePriority(t.priority),
        status: normalizeTaskStatus(t.status),
        projectValue: t.projectId ?? null,
        tagIds: [...tagIds],
        startTimeTs: t.startTime ? dayjs(t.startTime).valueOf() : null,
        dueTimeTs: t.dueTime ? dayjs(t.dueTime).valueOf() : null,
        repeatType: repeatType as RepeatType,
        repeatCustomInterval: interval,
        repeatCustomUnit: unit,
        repeatEndDateTs: endDate,
        remindPreset: inferRemindPreset(t.remindAt, t.dueTime, t.startTime),
        remindAtTs: t.remindAt ? dayjs(t.remindAt).valueOf() : null,
        assigneeId: t.assigneeId ?? userStore.user?.id ?? null,
        assigneeIds: t.assigneeIds?.length ? [...t.assigneeIds] : (t.assigneeId != null ? [t.assigneeId] : []),
      };
      attachmentApi.getAttachments(t.id).then((list) => {
        attachments.value = list ?? [];
      }).catch(() => {});
      commentApi.getComments(t.id).then(async (list) => {
        commentAvatarLoadFailed.value = {};
        comments.value = list ?? [];
        const ids = [...new Set((list ?? []).map((c) => c.userId))];
        await userProfileCache.ensureUsers(ids);
      }).catch(() => {});
      if (t.assignees?.length) {
        userProfileCache.seedUsers(t.assignees.map((x) => normalizeUserFromPayload(x) ?? x));
      }
    } else {
      form.value.assigneeId = userStore.user?.id ?? null;
      form.value.assigneeIds = userStore.user?.id ? [userStore.user.id] : [];
      if (props.defaultStatus && validStatuses.includes(props.defaultStatus as any)) {
        form.value.status = props.defaultStatus as Task['status'];
      }
      form.value.projectValue = null;
      if (props.defaultStartTime) {
        form.value.startTimeTs = dayjs(props.defaultStartTime).valueOf();
      }
      if (props.defaultDueTime) {
        const due = props.defaultDueTime;
        const hasTime = due.length > 10 && (due.includes(' ') || due.includes('T'));
        form.value.dueTimeTs = hasTime ? dayjs(due).valueOf() : dayjs(due).endOf('day').valueOf();
      }
    }
  }
});

function resetForm() {
  showExtraProps.value = false;
  pendingFiles.value = [];
  attachments.value = [];
  comments.value = [];
  commentAvatarLoadFailed.value = {};
  commentDraft.value = '';
  uploadError.value = '';
  form.value = {
    title: '',
    description: '',
    priority: 3,
    status: 'todo',
    projectValue: null,
    tagIds: [],
    startTimeTs: null,
    dueTimeTs: null,
    repeatType: '',
    repeatCustomInterval: 1,
    repeatCustomUnit: 'daily',
    repeatEndDateTs: null,
    remindPreset: '',
    remindAtTs: null,
    assigneeId: userStore.user?.id ?? null,
    assigneeIds: userStore.user?.id ? [userStore.user.id] : [],
  };
}

/** 根据 remindAt 与截止/开始时间反推预设（用于回显）；无法匹配则返回 'custom' */
function inferRemindPreset(remindAt?: string, dueTime?: string, startTime?: string): RemindPreset {
  if (!remindAt) return '';
  const refTime = dueTime || startTime;
  if (!refTime) return 'custom';
  const remind = dayjs(remindAt).valueOf();
  const ref = dayjs(refTime).valueOf();
  const diffMs = ref - remind;
  const d = diffMs / (24 * 60 * 60 * 1000);
  const h = diffMs / (60 * 60 * 1000);
  const m = diffMs / (60 * 1000);
  if (d >= 0.9 && d <= 1.1) return '1d';
  if (h >= 2.9 && h <= 3.1) return '3h';
  if (h >= 0.9 && h <= 1.1) return '1h';
  if (m >= 29 && m <= 31) return '30m';
  if (m >= 14 && m <= 16) return '15m';
  return 'custom';
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function triggerFileInput() {
  fileInputRef.value?.click();
}

function onFileSelect(ev: Event) {
  const el = ev.target as HTMLInputElement;
  const files = el.files ? Array.from(el.files) : [];
  el.value = '';
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB，与后端一致
  const oversize = files.filter(f => f.size > MAX_FILE_SIZE);
  if (oversize.length > 0) {
    uploadError.value = '文件大小不能超过 10MB';
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'warning', title: '附件过大', message: '单个文件不能超过 10MB' },
    }));
  }
  const valid = files.filter(f => f.size <= MAX_FILE_SIZE);
  if (props.editTask && props.editTask.id) {
    uploadError.value = '';
    valid.forEach((file) => {
      attachmentApi.uploadAttachment(props.editTask!.id, file)
        .then((att) => {
          attachments.value = [...attachments.value, att];
        })
        .catch((e) => {
          const err = e as { message?: string; code?: string; response?: unknown };
          const msg = err?.message ?? '';
          const isNetwork =
            !err?.response ||
            err?.code === 'ERR_NETWORK' ||
            /网络|Network|连接|timeout|超时/i.test(msg);
          const friendlyMsg = isNetwork ? '请检查网络连接' : (msg || '请稍后重试');
          uploadError.value = `上传附件失败，${friendlyMsg}`;
          window.dispatchEvent(new CustomEvent('toast', {
            detail: { type: 'error', title: '上传附件失败', message: friendlyMsg },
          }));
        });
    });
  } else {
    pendingFiles.value = [...pendingFiles.value, ...valid];
  }
}

function removePendingFile(index: number) {
  pendingFiles.value = pendingFiles.value.filter((_, i) => i !== index);
}

const attachmentCount = computed(() =>
  (props.editTask ? attachments.value.length : pendingFiles.value.length)
);

function fileExtensionUpper(fileName: string): string {
  const ext = fileName.includes('.') ? fileName.slice(fileName.lastIndexOf('.') + 1) : '';
  return ext.toUpperCase() || 'FILE';
}

function fileCardIcon(fileName: string): string {
  const ext = (fileName.includes('.') ? fileName.slice(fileName.lastIndexOf('.') + 1) : '').toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) return '🖼️';
  if (['pdf'].includes(ext)) return '📄';
  return '📎';
}

function truncateFileName(name: string, maxLen = 24): string {
  if (!name || name.length <= maxLen) return name;
  return name.slice(0, maxLen - 3) + '...';
}

function attachmentCardIcon(att: Attachment): string {
  const t = attachmentPreviewType(att);
  if (t === 'image') return 'IMG';
  if (t === 'video') return 'VID';
  if (t === 'pdf') return 'PDF';
  return 'FILE';
}

function attachmentTypeLabel(att: Attachment): string {
  const ext = (att.fileName ?? '').includes('.')
    ? (att.fileName ?? '').slice((att.fileName ?? '').lastIndexOf('.') + 1)
    : '';
  if (ext) return ext.toUpperCase();
  const type = (att.fileType ?? '').split('/').pop() ?? '';
  return type.toUpperCase() || 'FILE';
}

/** 根据 fileType 或扩展名判断是否支持在线预览（图片、视频、PDF） */
function attachmentPreviewType(att: Attachment): 'image' | 'video' | 'pdf' | 'other' {
  const type = (att.fileType ?? '').toLowerCase();
  const name = (att.fileName ?? '').toLowerCase();
  const ext = name.includes('.') ? name.slice(name.lastIndexOf('.') + 1) : '';
  if (type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) return 'image';
  if (type.startsWith('video/') || ['mp4', 'webm', 'ogg', 'mov', 'm4v'].includes(ext)) return 'video';
  if (type === 'application/pdf' || ext === 'pdf') return 'pdf';
  return 'other';
}

const previewType = computed(() => previewAtt.value ? attachmentPreviewType(previewAtt.value) : 'other');

function openAttachmentPreview(att: Attachment) {
  previewAtt.value = att;
  previewBlobUrl.value = null;
  previewLoadError.value = null;
  previewVisible.value = true;
  previewLoading.value = true;
  attachmentApi
    .downloadAttachment(att.id)
    .then((blob) => {
      if (previewAtt.value?.id === att.id) {
        previewBlobUrl.value = URL.createObjectURL(blob);
      }
    })
    .catch((e) => {
      if (previewAtt.value?.id === att.id) {
        previewLoadError.value = (e as Error)?.message || '加载失败';
      }
    })
    .finally(() => {
      if (previewAtt.value?.id === att.id) {
        previewLoading.value = false;
      }
    });
}

function onPreviewModalAfterLeave() {
  if (previewBlobUrl.value) {
    URL.revokeObjectURL(previewBlobUrl.value);
  }
  previewAtt.value = null;
  previewBlobUrl.value = null;
  previewLoadError.value = null;
}

async function openPreviewInNewTab() {
  const att = previewAtt.value;
  if (!att?.id) return;
  try {
    const blob = await attachmentApi.downloadAttachment(att.id);
    const url = URL.createObjectURL(blob);
    window.open(url);
  } catch (e) {
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'error', title: '打开失败', message: (e as Error)?.message || '请稍后重试' },
    }));
  }
}

async function removeAttachment(att: Attachment) {
  if (!props.editTask) return;
  try {
    uploadError.value = '';
    await attachmentApi.deleteAttachment(props.editTask.id, att.id);
    attachments.value = attachments.value.filter((a) => a.id !== att.id);
  } catch (e) {
    const msg = (e as Error)?.message || '删除失败';
    uploadError.value = msg;
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'error', title: '删除附件失败', message: msg },
    }));
  }
}

async function downloadAttachment(att: Attachment) {
  if (!props.editTask || !att.id || downloadingAttachmentId.value != null) return;
  downloadingAttachmentId.value = att.id;
  try {
    const result = await downloadAttachmentById({
      attachmentId: att.id,
      fileName: att.fileName || '附件',
      getToken: () => userStore.token ?? null,
    });
    triggerSave(result);
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'success', title: '下载成功', message: '文件已保存' },
    }));
  } catch (e) {
    const msg = (e as Error)?.message || '下载失败';
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'error', title: '下载失败', message: msg },
    }));
  } finally {
    downloadingAttachmentId.value = null;
  }
}

function mergeUserPreferProfile(a: User | undefined, b: User | undefined): User | undefined {
  if (!a && !b) return undefined;
  if (!a) return b;
  if (!b) return a;
  return {
    ...a,
    ...b,
    nickname: b.nickname?.trim() || a.nickname?.trim() || undefined,
    username: (b.username?.trim() || a.username?.trim() || '') as string,
    email: b.email || a.email,
    avatar: b.avatar || a.avatar,
  };
}

function isGenericUserLabel(s: string): boolean {
  const t = s.trim();
  return /^用户\s*\d+$/u.test(t) || /^user\s*\d+$/iu.test(t);
}

function commentAuthorName(c: Comment): string {
  const u = commentDisplayUser(c);
  if (u?.nickname?.trim()) return u.nickname.trim();
  if (u?.username?.trim()) {
    const un = u.username.trim();
    if (!isGenericUserLabel(un)) return un;
  }
  if (u?.email?.trim()) {
    const e = u.email.trim();
    return e.includes('@') ? e.split('@')[0]! : e;
  }
  return `用户 ${c.userId}`;
}

/** 评论展示：接口 user + 当前用户 / 团队成员 + 用户资料缓存（GET /users/:id）补全 */
function commentDisplayUser(c: Comment): User | undefined {
  const api = c.user ? (normalizeUserFromPayload(c.user) ?? c.user) : undefined;
  let u = api;
  if (c.userId === userStore.user?.id) {
    u = mergeUserPreferProfile(u, userStore.user ?? undefined);
  }
  const fromTeam = teamMembers.value.find((m) => m.userId === c.userId);
  if (fromTeam) {
    u = mergeUserPreferProfile(u, teamMemberToUser(fromTeam));
  }
  const fromRemote = userProfileCache.getCached(c.userId);
  if (fromRemote) {
    u = mergeUserPreferProfile(u, fromRemote);
  }
  return u;
}

function onCommentAvatarError(commentId: number) {
  commentAvatarLoadFailed.value = { ...commentAvatarLoadFailed.value, [commentId]: true };
}

function formatCommentTime(createdAt: string): string {
  return formatDate(createdAt);
}

function canDeleteComment(c: Comment): boolean {
  const uid = userStore.user?.id;
  return uid != null && c.userId === uid;
}

async function handleDeleteComment(c: Comment) {
  if (!props.editTask || commentSubmitting.value) return;
  commentSubmitting.value = true;
  try {
    await commentApi.deleteCommentById(c.id);
    comments.value = comments.value.filter((x) => x.id !== c.id);
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'success', title: '已删除', message: '评论已删除' },
    }));
  } catch (e) {
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'error', title: '删除失败', message: (e as Error)?.message || '请稍后重试' },
    }));
  } finally {
    commentSubmitting.value = false;
  }
}

async function submitComment() {
  const content = commentDraft.value.trim();
  if (!content || !props.editTask || commentSubmitting.value) return;
  commentSubmitting.value = true;
  try {
    const newComment = await commentApi.createComment(props.editTask.id, content);
    comments.value = [...comments.value, newComment];
    void userProfileCache.ensureUser(newComment.userId);
    commentDraft.value = '';
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'success', title: '已发送', message: '评论已添加' },
    }));
  } catch (e) {
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'error', title: '发送失败', message: (e as Error)?.message || '请稍后重试' },
    }));
  } finally {
    commentSubmitting.value = false;
  }
}

function tsToDateTimeString(ts: number | null): string | undefined {
  if (ts == null) return undefined;
  // 使用 YYYY-MM-DD HH:mm:ss 格式，这是后端期望的日期时间格式
  return dayjs(ts).format('YYYY-MM-DD HH:mm:ss');
}

function buildPayload() {
  const titleVal = form.value.title.trim();
  let projectId: number | undefined;
  let projectName: string | undefined;
  if (canSetProject.value) {
    const pv = form.value.projectValue;
    projectId = typeof pv === 'number' ? pv : undefined;
    projectName = typeof pv === 'string' && pv.trim() ? pv.trim() : undefined;
  }
  const tagIds = form.value.tagIds?.length ? form.value.tagIds : undefined;
  const assigneeIdsList = [...(form.value.assigneeIds ?? [])];
  const payload: Partial<Task> & { projectName?: string } = {
    title: titleVal,
    description: form.value.description?.trim() || undefined,
    priority: form.value.priority as number,
    status: form.value.status,
    projectId,
    projectName,
    tagIds,
  };
  // 清空负责人时必须显式传 null / []，否则 PATCH 省略字段后端不会移除负责人
  if (assigneeIdsList.length > 0) {
    payload.assigneeId = assigneeIdsList[0];
    payload.assigneeIds = assigneeIdsList;
  } else {
    (payload as Record<string, unknown>).assigneeId = null;
    (payload as Record<string, unknown>).assigneeIds = [];
  }
  const startTime = tsToDateTimeString(form.value.startTimeTs);
  const dueTime = tsToDateTimeString(form.value.dueTimeTs);
  if (startTime) payload.startTime = startTime;
  if (dueTime) payload.dueTime = dueTime;
  const rt = form.value.repeatType;
  if (rt && rt !== 'custom') {
    payload.repeatRule = { type: rt, interval: 1 };
  } else if (rt === 'custom') {
    const interval = Math.max(1, Math.min(99, form.value.repeatCustomInterval ?? 1));
    const unit = form.value.repeatCustomUnit || 'daily';
    const endDate = form.value.repeatEndDateTs
      ? dayjs(form.value.repeatEndDateTs).format('YYYY-MM-DD')
      : undefined;
    payload.repeatRule = { type: unit, interval, endDate };
  } else {
    payload.repeatRule = null as any;
  }
  const preset = form.value.remindPreset;
  const refTs = form.value.dueTimeTs ?? form.value.startTimeTs;
  if (preset === 'custom') {
    const remindAt = tsToDateTimeString(form.value.remindAtTs);
    if (remindAt) payload.remindAt = remindAt;
  } else if (preset && refTs != null) {
    const ref = dayjs(refTs);
    let remind: dayjs.Dayjs;
    if (preset === '15m') remind = ref.subtract(15, 'minute');
    else if (preset === '30m') remind = ref.subtract(30, 'minute');
    else if (preset === '1h') remind = ref.subtract(1, 'hour');
    else if (preset === '3h') remind = ref.subtract(3, 'hour');
    else if (preset === '1d') remind = ref.subtract(1, 'day');
    else remind = ref;
    payload.remindAt = remind.format('YYYY-MM-DD HH:mm:ss');
  }
  return payload;
}

function handleSubmit() {
  const titleVal = form.value.title.trim();
  if (!titleVal || isSubmitting.value) return;
  const payload = buildPayload();
  if (props.editTask) {
    emit('update', props.editTask.id, payload);
  } else {
    emit('submit', payload, pendingFiles.value.length ? pendingFiles.value : undefined);
  }
}

function confirmDeleteTask() {
  showDeleteTaskConfirm.value = false;
  if (!props.editTask || isSubmitting.value) return;
  emit('delete', props.editTask.id);
}

function handleArchive() {
  if (!props.editTask || isSubmitting.value) return;
  emit('archive', props.editTask.id);
}
</script>

<style scoped>
@import '../styles/components.css';

.create-task-modal {
  --create-task-modal-bg: var(--bg-secondary, #fff);
  --create-task-modal-bg-input: var(--bg-tertiary, #f1f5f9);
  --create-task-modal-border: var(--border-subtle, #e2e8f0);
  --create-task-modal-text: var(--text-primary, #1e293b);
  --create-task-modal-text-muted: var(--text-secondary, #64748b);
  --create-task-modal-accent: #0d9488;
  --teal: #2dd4bf;
  --teal-dark: #0d9488;
  /* 任务描述 / 评论区块高亮底与描边 */
  --create-task-modal-highlight-surface: rgba(13, 148, 136, 0.1);
  --create-task-modal-highlight-edge: rgba(13, 148, 136, 0.38);
  --create-task-modal-text-bright: var(--text-primary, #0f172a);
}

[data-theme="dark"] .create-task-modal {
  --create-task-modal-bg: var(--bg-secondary, #1e1e2e);
  --create-task-modal-bg-input: rgba(255, 255, 255, 0.06);
  --create-task-modal-border: rgba(255, 255, 255, 0.08);
  --create-task-modal-text: rgba(255, 255, 255, 0.9);
  --create-task-modal-text-muted: rgba(255, 255, 255, 0.55);
  --create-task-modal-accent: #2dd4bf;
  --create-task-modal-highlight-surface: rgba(45, 212, 191, 0.12);
  --create-task-modal-highlight-edge: rgba(45, 212, 191, 0.42);
  --create-task-modal-text-bright: rgba(255, 255, 255, 0.98);
}

.create-task-modal :deep(.n-card),
.create-task-modal :deep(.n-card__content),
.create-task-modal :deep(.n-modal-body-wrapper) {
  background: var(--create-task-modal-bg) !important;
}

.create-task-modal :deep(.n-card),
.create-task-modal :deep(.n-card__content) {
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(45, 212, 191, 0.08);
}

.create-task-modal :deep(.n-card-header) {
  background: transparent !important;
  border-bottom: 1px solid var(--create-task-modal-border);
  padding: 18px 24px;
}

.create-task-modal :deep(.n-card-header__main) {
  color: var(--create-task-modal-text);
  font-weight: 600;
}

.create-task-modal :deep(.n-input__input-el),
.create-task-modal :deep(.n-input__textarea-el),
.create-task-modal :deep(.n-base-selection),
.create-task-modal :deep(.n-date-picker .n-input__input-el) {
  background: var(--create-task-modal-bg-input) !important;
  border-color: var(--create-task-modal-border) !important;
  color: var(--create-task-modal-text) !important;
  border-radius: 10px;
}

.create-task-modal :deep(.n-input:focus-within .n-input__input-el),
.create-task-modal :deep(.n-input:focus-within .n-input__textarea-el),
.create-task-modal :deep(.n-base-selection--focus) {
  border-color: var(--teal) !important;
  box-shadow: 0 0 0 2px rgba(45, 212, 191, 0.2);
}

.create-task-modal :deep(.n-input__input-el::placeholder),
.create-task-modal :deep(.n-input__textarea-el::placeholder) {
  color: var(--create-task-modal-text-muted);
}

/* 优先级下拉：选项显示为 1–5 颗星（橙色） */
.priority-option-stars {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
.priority-option-star {
  display: inline-flex;
  color: #f59e0b;
}
[data-theme="dark"] .priority-option-star {
  color: #fbbf24;
}
.create-task-modal :deep(.priority-select .n-base-selection .priority-option-stars) {
  color: #f59e0b;
}

.create-task-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 60vh;
  overflow-y: auto;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.form-row--two {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.form-label {
  font-size: var(--font-size-base);
  font-weight: 500;
  color: var(--create-task-modal-text);
}

.required {
  color: var(--danger, #E53935);
}

.form-hint {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--create-task-modal-text-muted);
}

.form-hint--above {
  margin: 8px 0 4px;
}

.remind-custom-date {
  margin-top: 8px;
}

.form-input,
.form-select,
.form-date {
  width: 100%;
}

.form-input--small-margin {
  margin-top: 4px;
}

.form-date {
  width: 100%;
}

.form-prop-select {
  width: 100%;
}

.form-tags-wrap {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-height: 32px;
}
.form-tags-empty {
  font-size: var(--font-size-small);
  color: var(--create-task-modal-text-muted);
}
.form-tags-goto {
  font-size: var(--font-size-small);
  color: var(--accent-primary);
  margin-left: 8px;
  text-decoration: none;
}
.form-tags-goto:hover {
  text-decoration: underline;
}
.form-tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 14px;
  border-radius: 20px;
  border: 1.5px solid transparent;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  opacity: 0.7;
  transition: all 0.15s;
}
.form-tag-chip:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}
.form-tag-chip--selected {
  opacity: 1;
  border-color: rgba(0,0,0,0.15);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transform: scale(1.02);
}
.form-tag-chip--selected:hover {
  box-shadow: 0 3px 10px rgba(0,0,0,0.15);
}

.repeat-custom-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.repeat-custom-label {
  font-size: var(--font-size-base);
  color: var(--create-task-modal-text-muted);
}

.repeat-custom-interval {
  width: 80px;
}

.repeat-custom-unit {
  width: 90px;
}

.repeat-custom-end {
  width: 140px;
}

.section-title {
  margin: 0;
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--create-task-modal-text);
}

.section-desc {
  margin: 0 0 0.25rem;
  font-size: var(--font-size-small);
  color: var(--create-task-modal-text-muted);
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: var(--font-size-base);
  color: var(--create-task-modal-text);
}

.checkbox-item input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.checkmark {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 2px solid var(--border-medium);
  flex-shrink: 0;
  position: relative;
  transition: border-color 0.2s, background 0.2s;
}

.checkbox-item input:checked + .checkmark {
  border-color: var(--accent-primary);
  background: var(--accent-primary);
}

.checkmark.checkbox::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 2px;
  width: 4px;
  height: 8px;
  border: solid #fff;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

/* 负责人选项：头像与文字自然融入输入框 */
.assignee-option {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.assignee-option-name {
  font-size: var(--font-size-base);
}

/* 选中后展示在输入框内时，头像与框体统一 */
.create-task-modal :deep(.form-select.assignee-select .n-base-selection__state),
.create-task-modal :deep(.form-select.assignee-select .n-base-selection-label) {
  display: inline-flex;
  align-items: center;
}

.create-task-modal :deep(.form-select.assignee-select .assignee-option .n-avatar) {
  flex-shrink: 0;
}

/* 下拉项与选中区统一 36px，避免一大一小 */
.create-task-modal :deep(.assignee-select .n-select-option .assignee-option--dropdown .n-avatar) {
  width: 36px;
  height: 36px;
  font-size: 13px;
  line-height: 36px;
}

.create-task-modal :deep(.form-select.assignee-select .n-base-selection .assignee-option) {
  padding: 0 2px;
  gap: 6px;
}

.create-task-modal :deep(.form-select.assignee-select .n-base-selection .assignee-option .n-avatar) {
  width: 30px;
  height: 30px;
  font-size: 13px;
  line-height: 30px;
  background: var(--create-task-modal-border);
  color: var(--create-task-modal-text);
}

.create-task-modal :deep(.form-select.assignee-select .n-base-selection .assignee-option .n-avatar .n-avatar__text) {
  color: inherit;
}

.create-task-modal :deep(.form-select.assignee-select .assignee-select-tag .assignee-option .n-avatar) {
  width: 30px;
  height: 30px;
  font-size: 13px;
  line-height: 30px;
  flex-shrink: 0;
}

.create-task-modal :deep(.form-select.assignee-select .assignee-select-tag .assignee-option .n-avatar .n-avatar__text) {
  color: inherit;
}

/* 附件展示区：卡片列表，可下载、删除 */
.attachment-display-section {
  margin-top: var(--spacing-md);
}
.attachment-display-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-sm);
}
.attachment-display-title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--create-task-modal-text);
}
.attachment-display-add {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: var(--radius-sm, 6px);
  background: var(--create-task-modal-bg-input);
  color: var(--create-task-modal-text-muted);
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.attachment-display-add:hover {
  background: rgba(45, 212, 191, 0.12);
  color: var(--teal-dark);
}
.attachment-display-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}
.attachment-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: var(--create-task-modal-bg-input);
  border-radius: var(--radius-md, 8px);
  border: 1px solid var(--create-task-modal-border);
}
.attachment-card-icon {
  font-size: 24px;
  line-height: 1;
  flex-shrink: 0;
}
.attachment-card-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.attachment-card-name {
  font-size: var(--font-size-base);
  color: var(--create-task-modal-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.attachment-card-meta {
  font-size: var(--font-size-small);
  color: var(--create-task-modal-text-muted);
}
.attachment-card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.attachment-card-btn {
  padding: 4px 10px;
  font-size: var(--font-size-small);
  color: var(--accent-primary);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-sm, 6px);
  text-decoration: none;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.attachment-card-btn:hover {
  background: rgba(45, 212, 191, 0.1);
  color: var(--accent-primary);
}
.attachment-card-btn--danger {
  color: var(--create-task-modal-text-muted);
}
.attachment-card-btn--danger:hover:not(:disabled) {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.08);
}
.attachment-card-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 附件区域：与表单风格一致 */
.attachment-area {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.attachment-input-hidden {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}
.attachment-add-btn {
  align-self: flex-start;
  padding: 8px 14px;
  border: 1px dashed var(--create-task-modal-border);
  border-radius: var(--radius-sm, 8px);
  background: var(--create-task-modal-bg-input);
  color: var(--create-task-modal-text-muted);
  font-size: var(--font-size-base);
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
}
.attachment-add-btn:hover:not(:disabled) {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}
.attachment-add-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
.attachment-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.attachment-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: var(--create-task-modal-bg-input);
  border-radius: var(--radius-sm, 8px);
  border: 1px solid var(--create-task-modal-border);
  font-size: var(--font-size-base);
}
.attachment-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--create-task-modal-text);
}
.attachment-link {
  color: var(--accent-primary);
  text-decoration: none;
}
.attachment-link:hover {
  text-decoration: underline;
}
.attachment-size {
  flex-shrink: 0;
  color: var(--create-task-modal-text-muted);
  font-size: var(--font-size-small);
}
.attachment-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.attachment-btn {
  padding: 4px 10px;
  border-radius: var(--radius-sm, 6px);
  font-size: var(--font-size-small);
  text-decoration: none;
  cursor: pointer;
  border: 1px solid var(--create-task-modal-border);
  background: var(--create-task-modal-bg-input);
  color: var(--create-task-modal-text);
  transition: border-color 0.2s, color 0.2s;
}
.attachment-btn:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}
.attachment-btn-download {
  display: inline-block;
  box-sizing: border-box;
}
.attachment-remove {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--create-task-modal-text-muted);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.attachment-remove:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}
.attachment-remove:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
.attachment-error {
  margin: 0;
  font-size: var(--font-size-small);
  color: #ef4444;
}

/* 评论区域 */
.comment-section {
  border-top: 1px solid var(--create-task-modal-border);
  padding-top: var(--spacing-md);
}
.comment-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
  max-height: 200px;
  overflow-y: auto;
}
.comment-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 10px;
  background: var(--create-task-modal-highlight-surface);
  border-radius: var(--radius-sm, 8px);
  border: 1px solid var(--create-task-modal-highlight-edge);
  border-left: 3px solid var(--create-task-modal-accent);
}
.comment-avatar-wrap {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--create-task-modal-border);
  display: flex;
  align-items: center;
  justify-content: center;
}
.comment-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.comment-avatar-initial {
  font-size: 14px;
  font-weight: 600;
  color: var(--create-task-modal-text-muted);
}
.comment-body {
  flex: 1;
  min-width: 0;
}
.comment-author {
  font-weight: 600;
  color: var(--create-task-modal-text-bright);
  margin-right: 8px;
}
.comment-time {
  font-size: var(--font-size-small);
  color: var(--create-task-modal-text-muted);
}
.comment-content {
  margin: 6px 0 0;
  font-size: var(--font-size-base);
  color: var(--create-task-modal-text-bright);
  font-weight: 500;
  white-space: pre-wrap;
  word-break: break-word;
}
.comment-delete {
  flex-shrink: 0;
  padding: 4px 10px;
  font-size: var(--font-size-small);
  color: var(--create-task-modal-text-muted);
  background: transparent;
  border: 1px solid var(--create-task-modal-border);
  border-radius: var(--radius-sm, 6px);
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s;
}
.comment-delete:hover:not(:disabled) {
  color: #ef4444;
  border-color: #ef4444;
}
.comment-delete:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
.comment-input-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.comment-input {
  width: 100%;
}
.comment-submit {
  align-self: flex-end;
}

/* 附件预览弹窗 */
.attachment-preview-modal :deep(.n-card__content) {
  padding: 0;
  max-height: 80vh;
  overflow: auto;
}
.preview-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: var(--spacing-md);
}
.preview-loading,
.preview-error {
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--font-size-base);
}
.preview-error {
  color: var(--error-color, #d03050);
}
.preview-media {
  max-width: 100%;
  max-height: 75vh;
  object-fit: contain;
  border-radius: var(--radius-sm, 8px);
}
.preview-image {
  display: block;
}
.preview-video {
  width: 100%;
}
.preview-iframe {
  width: 100%;
  height: 75vh;
  min-height: 400px;
  border: none;
  border-radius: var(--radius-sm, 8px);
}
.preview-fallback {
  margin: 0 0 12px;
  color: var(--text-secondary);
  font-size: var(--font-size-base);
}
.preview-open-link {
  margin: 0;
  padding: 0;
  border: none;
  background: none;
  color: var(--accent-primary);
  text-decoration: none;
  cursor: pointer;
  font-size: inherit;
}
.preview-open-link:hover {
  text-decoration: underline;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  padding-top: 8px;
  border-top: 1px solid var(--create-task-modal-border);
}

.btn-footer {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-footer:hover:not(:disabled) {
  filter: brightness(0.95);
}
.btn-footer:active:not(:disabled) {
  transform: scale(0.98);
}
.btn-footer:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.modal-footer .btn-footer--danger {
  margin-right: auto;
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
  font-weight: 600;
}
.modal-footer .btn-footer--danger:hover:not(:disabled) {
  background: #dc2626;
  color: #fff;
  border-color: #dc2626;
}

.modal-footer .btn-footer--archive {
  background: rgba(45, 212, 191, 0.08);
  color: #0d9488;
  border: 1px solid rgba(45, 212, 191, 0.25);
}

.modal-footer .btn-footer--archive:hover:not(:disabled) {
  background: #0d9488;
  color: #fff;
  border-color: #0d9488;
}

.modal-footer .btn-footer--cancel {
  background: transparent;
  color: #1e293b;
  border: 1px solid #e2e8f0;
}
.modal-footer .btn-footer--cancel:hover {
  background: #f1f5f9;
}
[data-theme="dark"] .modal-footer .btn-footer--cancel {
  color: rgba(255,255,255,0.9);
  border-color: rgba(255,255,255,0.1);
}
[data-theme="dark"] .modal-footer .btn-footer--cancel:hover {
  background: rgba(255,255,255,0.06);
}

.modal-footer .btn-footer--primary {
  background: #0d9488 !important;
  color: #fff !important;
  min-width: 88px;
  box-shadow: 0 2px 8px rgba(13, 148, 136, 0.3);
}
.modal-footer .btn-footer--primary:hover:not(:disabled) {
  background: #0f766e !important;
  color: #fff !important;
  box-shadow: 0 4px 14px rgba(13, 148, 136, 0.4);
  transform: translateY(-1px);
}
.modal-footer .btn-footer--primary:disabled {
  background: #5eead4 !important;
  color: #0d9488 !important;
  opacity: 1;
  cursor: not-allowed;
  box-shadow: none;
}

.create-task-modal :deep(.n-card__footer) {
  background: var(--create-task-modal-bg) !important;
  padding: 16px 24px !important;
  border-top: 1px solid var(--create-task-modal-border) !important;
}

/* 自定义头部：右侧 附加、更多、关闭 */
.task-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0 4px;
}
.task-modal-header-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--create-task-modal-text);
}
.task-modal-header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}
.task-modal-header-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: none;
  border-radius: var(--radius-sm, 6px);
  background: transparent;
  color: var(--create-task-modal-text-muted);
  font-size: var(--font-size-small);
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.task-modal-header-btn:hover {
  background: rgba(45, 212, 191, 0.1);
  color: var(--teal-dark);
}
.task-modal-header-btn-text {
  font-size: var(--font-size-small);
}
.task-modal-header-btn-icon {
  padding: 6px 8px;
}
.task-modal-header-btn-close {
  padding: 6px 8px;
  margin-left: 4px;
}

/* 标题区：大标题输入，无图标；输入内容大写加粗；不显示输入框（无边框无背景） */
.form-title-block {
  margin-bottom: var(--spacing-md);
}
.form-title-input {
  flex: 1;
  min-width: 0;
}
.create-task-modal :deep(.form-title-input .n-input__input-el),
.create-task-modal :deep(.form-title-block .n-input .n-input__input-el) {
  font-size: 1.1rem !important;
  font-weight: 600 !important;
  padding: 8px 0;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  border-radius: 0;
  border-bottom: 1px solid var(--create-task-modal-border) !important;
}
.create-task-modal :deep(.form-title-input input),
.create-task-modal :deep(.form-title-block input) {
  font-size: 1.1rem !important;
  font-weight: 600 !important;
}
.create-task-modal :deep(.form-title-input .n-input),
.create-task-modal :deep(.form-title-block .n-input) {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}
.create-task-modal :deep(.form-title-input .n-input:focus-within .n-input__input-el),
.create-task-modal :deep(.form-title-block .n-input:focus-within .n-input__input-el) {
  border: none !important;
  box-shadow: none !important;
}
.create-task-modal :deep(.form-title-input .n-input__state-border),
.create-task-modal :deep(.form-title-block .n-input__state-border) {
  display: none !important;
}

/* 属性列表：行布局，左标签右值 */
.form-props {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-bottom: var(--spacing-sm);
}
.form-prop-row {
  display: grid;
  grid-template-columns: 140px 1fr;
  align-items: center;
  gap: 16px;
  padding: 10px 0;
  min-height: 42px;
  border-bottom: 1px solid rgba(0,0,0,0.04);
}
.form-prop-row:last-child {
  border-bottom: none;
}
.form-prop-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--create-task-modal-text-muted);
  flex-shrink: 0;
  letter-spacing: 0.3px;
}
.form-prop-value {
  min-width: 0;
}
.form-prop-value-text {
  font-size: var(--font-size-base);
  color: var(--create-task-modal-text);
}
.form-prop-value--remind {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 4px;
}
.form-extra-props .form-prop-row {
  padding: 10px 0;
}
.form-extra-props .repeat-custom-row {
  margin-top: 8px;
}
.form-add-prop-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  padding: 8px 0;
  border: none;
  background: transparent;
  color: var(--create-task-modal-text-muted);
  font-size: var(--font-size-small);
  cursor: pointer;
  transition: color 0.2s;
}
.form-add-prop-btn:hover {
  color: var(--teal-dark);
}
.form-add-prop-icon {
  font-size: 1rem;
  font-weight: 600;
}

/* 评论区：输入框 + 发送按钮 */
.comment-input-row--single {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  margin-top: 8px;
}
.comment-input-row--single .comment-input {
  flex: 1;
  min-width: 0;
}
.comment-input-row--single .comment-submit {
  flex-shrink: 0;
  align-self: flex-end;
  margin-top: 2px;
}
.comment-section .comment-list {
  margin-top: var(--spacing-sm);
}

/* 评论输入框与描述区一致的高亮底 */
.create-task-modal .comment-section :deep(.comment-input.n-input) {
  background: var(--create-task-modal-highlight-surface) !important;
  box-shadow: inset 0 0 0 1px var(--create-task-modal-highlight-edge) !important;
  border-radius: var(--radius-md, 10px);
}
.create-task-modal .comment-section :deep(.comment-input .n-input__textarea-el) {
  color: var(--create-task-modal-text-bright) !important;
  font-weight: 500;
}
.create-task-modal .comment-section :deep(.comment-input .n-input__border),
.create-task-modal .comment-section :deep(.comment-input .n-input__state-border) {
  border: none !important;
}
.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.section-header-icon {
  color: #0d9488;
  flex-shrink: 0;
}
.section-header-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--create-task-modal-text, #1e293b);
  letter-spacing: 0.3px;
}

/* 任务描述、评论：标题与图标用主题色强调 */
.form-description-block .section-header-icon,
.comment-section .section-header-icon {
  color: var(--create-task-modal-accent);
  opacity: 1;
}
.form-description-block .section-header-text,
.comment-section .section-header-text {
  color: var(--create-task-modal-accent);
  font-weight: 700;
}

.form-description-block {
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--create-task-modal-border);
}
.create-task-modal :deep(.form-description-input.n-input) {
  background: var(--create-task-modal-highlight-surface) !important;
  box-shadow: inset 0 0 0 1px var(--create-task-modal-highlight-edge) !important;
  border-radius: var(--radius-md, 10px);
}
.create-task-modal :deep(.form-description-input .n-input__textarea-el) {
  min-height: 80px;
  color: var(--create-task-modal-text-bright) !important;
  font-weight: 500;
}
.create-task-modal :deep(.form-description-input .n-input__border),
.create-task-modal :deep(.form-description-input .n-input__state-border) {
  border: none !important;
}

.loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
