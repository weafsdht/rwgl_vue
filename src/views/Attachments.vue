<template>
  <div class="attachments-page">
    <div class="page-header">
      <h1>附件库</h1>
    </div>

    <!-- 筛选工具栏（参考任务列表） -->
    <div class="toolbar">
      <div class="toolbar-left">
        <n-dropdown :options="taskDropdownOpts" trigger="click" @select="onTaskFilterSelect">
          <div class="tb-pill" :class="{ active: filterTaskId !== ALL_TASK_ID }">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><path d="M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            {{ filterTaskId !== ALL_TASK_ID ? (taskList.find(t => t.id === filterTaskId)?.title ?? '任务') : '所属任务' }}
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </n-dropdown>
        <n-dropdown :options="typeDropdownOpts" trigger="click" @select="onTypeFilterSelect">
          <div class="tb-pill" :class="{ active: filterType !== 'all' }">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            {{ typeFilterLabel }}
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </n-dropdown>
        <n-dropdown :options="tagDropdownOpts" trigger="click" @select="onTagFilterSelect">
          <div class="tb-pill" :class="{ active: filterTagId !== ALL_TAG_ID }">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
            {{ tagFilterLabel }}
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </n-dropdown>
        <n-dropdown :options="sortDropdownOpts" trigger="click" @select="onSortSelect">
          <div class="tb-pill" :class="{ active: sortBy !== 'timeDesc' }">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5h10M11 9h7M11 13h4M3 17l4 4 4-4M7 3v18"/></svg>
            {{ sortByLabel }}
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </n-dropdown>
      </div>
      <div class="toolbar-right">
        <n-input v-model:value="searchText" placeholder="搜索文件名或任务名..." clearable class="tb-search" />
        <n-button type="primary" quaternary class="tb-upload-btn" @click="openUploadModal">
          <template #icon>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          </template>
          上传附件
        </n-button>
      </div>
    </div>

    <div class="attachments-body">
    <div v-if="loading" class="loading">
      <div class="loader-ring"></div>
    </div>
    <div v-else-if="filteredItems.length === 0" class="empty-state">
      <div class="empty-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      </div>
      <p class="empty-text">{{ hasActiveFilters ? '没有找到匹配的附件' : '暂无附件' }}</p>
    </div>
    <div v-else class="attachments-grid">
      <div
        v-for="item in filteredItems"
        :key="item.attachment.id"
        class="attachment-card"
      >
        <div class="card-preview" :class="'card-preview--' + attachmentPreviewType(item.attachment)" @click="openPreview(item.attachment)">
          <!-- 图片/视频缩略图 -->
          <img
            v-if="thumbnailUrls[item.attachment.id]"
            :src="thumbnailUrls[item.attachment.id]"
            alt=""
            class="card-thumb"
          />
          <!-- 视频播放图标 -->
          <span v-if="attachmentPreviewType(item.attachment) === 'video'" class="card-play-icon">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </span>
          <!-- 文件大小角标（图片/视频） -->
          <span v-if="thumbnailUrls[item.attachment.id]" class="card-size-badge">{{ formatSize(item.attachment.fileSize) }}</span>
          <!-- 无缩略图时的图标 -->
          <span v-if="!thumbnailUrls[item.attachment.id]" class="card-preview-icon" :data-type="attachmentPreviewType(item.attachment)">
            <svg v-if="attachmentPreviewType(item.attachment) === 'image'" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" opacity="0.6"/><path d="M21 15l-5-5L5 21" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <svg v-else viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2h7l5 5v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M14 2v5h5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span>
        </div>
        <div class="card-body">
          <div class="card-name-row">
            <span class="card-name" :title="item.attachment.fileName">
              {{ item.attachment.fileName }}
            </span>
          </div>
          <span class="card-meta">{{ item.taskTitle }}</span>
          <span class="card-meta">{{ formatSize(item.attachment.fileSize) }} · {{ formatTime(item.attachment.createdAt) }}</span>
          <div v-if="item.tags && item.tags.length" class="card-tags">
            <span
              v-for="tag in item.tags"
              :key="tag.id"
              class="card-tag"
            >
              {{ tag.name }}
            </span>
          </div>
        </div>
        <div class="card-actions">
          <button
            type="button"
            class="card-btn"
            title="下载"
            :disabled="downloadingId === item.attachment.id"
            @click.stop="handleDownload(item.attachment)"
          >
            <span v-if="downloadingId === item.attachment.id">下载中...</span>
            <span v-else>下载</span>
          </button>
          <button type="button" class="card-btn" title="编辑" @click.stop="openEditModal(item)">编辑</button>
          <button type="button" class="card-btn card-btn--danger" title="删除" :disabled="deletingId === item.attachment.id" @click.stop="handleDelete(item)">删除</button>
        </div>
      </div>
    </div>
    </div>

    <!-- 预览弹窗：仅当 GET /api/attachments/{id}/download 返回 2xx 时才展示内容，避免用 fileUrl 直接加载 -->
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
          <template v-if="previewTypeCur === 'image'">
            <img :src="previewBlobUrl" :alt="previewAtt.fileName" class="preview-media preview-image" />
          </template>
          <template v-else-if="previewTypeCur === 'video'">
            <video :src="previewBlobUrl" controls class="preview-media preview-video" :title="previewAtt.fileName" />
          </template>
          <template v-else-if="previewTypeCur === 'pdf'">
            <iframe :src="previewBlobUrl" class="preview-media preview-iframe" :title="previewAtt.fileName" />
          </template>
          <template v-else>
            <p class="preview-fallback">该类型不支持在线预览，请使用「下载」或在新标签页打开。</p>
            <button type="button" class="preview-open-link" @click="openPreviewInNewTab">在新标签页打开</button>
          </template>
        </template>
      </div>
    </n-modal>

    <!-- 编辑附件弹窗 -->
    <n-modal
      v-model:show="editModalVisible"
      preset="card"
      title="编辑附件"
      style="width: 420px"
      :mask-closable="false"
      @after-leave="resetEditForm"
    >
      <div class="upload-form">
        <div class="form-row">
          <label>文件名</label>
          <n-input v-model:value="editFileName" placeholder="输入文件名" />
        </div>
        <div class="form-row">
          <label>所属任务</label>
          <n-select
            v-model:value="editTaskId"
            :options="editTaskOptions"
            :to="false"
            placeholder="选择所属任务"
            filterable
          />
        </div>
        <div class="form-row">
          <label>标签</label>
          <n-select
            v-model:value="editTagIds"
            :options="editTagOptions"
            :to="false"
            placeholder="选择标签"
            filterable
            clearable
            multiple
          />
        </div>
      </div>
      <template #footer>
        <div class="upload-footer">
          <button type="button" class="upload-btn upload-btn--cancel" :disabled="editSaving" @click="editModalVisible = false">
            取 消
          </button>
          <button
            type="button"
            class="upload-btn upload-btn--ok"
            :disabled="editSaving || !editTaskId || !editFileName.trim()"
            @click="submitEdit"
          >
            <span v-if="editSaving" class="upload-spinner"></span>
            <span v-else>保 存</span>
          </button>
        </div>
      </template>
    </n-modal>

    <!-- 上传附件弹窗 -->
    <n-modal
      v-model:show="uploadModalVisible"
      preset="card"
      title="上传附件"
      style="width: 420px"
      :mask-closable="false"
      @after-leave="resetUploadForm"
    >
      <div class="upload-form">
        <div class="form-row">
          <label>所属任务</label>
          <n-select
            v-model:value="uploadTaskId"
            :options="uploadTaskOptions"
            :to="false"
            placeholder="选择要上传到的任务"
            filterable
            clearable
          />
        </div>
        <div class="form-row">
          <label>选择标签</label>
          <n-select
            v-model:value="uploadTagIds"
            :options="uploadTagOptions"
            :to="false"
            placeholder="可选，为附件添加标签"
            filterable
            clearable
            multiple
          />
        </div>
        <div class="form-row">
          <label>选择文件</label>
          <div class="upload-drop-zone" @dragover.prevent @drop.prevent="onDropFiles">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <span class="upload-drop-text">拖拽文件或文件夹到此处</span>
            <div class="upload-drop-actions">
              <button type="button" class="upload-pick-btn" @click="triggerFileInput">选择文件</button>
              <button type="button" class="upload-pick-btn" @click="triggerFolderInput">选择文件夹</button>
            </div>
            <input ref="fileInputRef" type="file" multiple class="upload-hidden-input" @change="onFilesSelected" />
            <input ref="folderInputRef" type="file" webkitdirectory multiple class="upload-hidden-input" @change="onFolderSelected" />
          </div>
          <div v-if="uploadFiles.length" class="upload-file-summary">
            <span class="upload-file-count">已选 {{ uploadFiles.length }} 个文件</span>
            <button type="button" class="upload-file-clear" @click="clearUploadFiles">清空</button>
          </div>
          <div v-if="uploadFiles.length" class="upload-file-list-mini">
            <div v-for="(f, i) in uploadFiles.slice(0, 5)" :key="i" class="upload-file-item-mini">
              <span class="upload-file-name-mini">{{ f.name }}</span>
              <span class="upload-file-size-mini">{{ formatSize(f.size) }}</span>
            </div>
            <div v-if="uploadFiles.length > 5" class="upload-file-more">...还有 {{ uploadFiles.length - 5 }} 个文件</div>
          </div>
        </div>
      </div>
      <template #footer>
        <!-- 按钮风格参考删除确认弹窗 -->
        <div class="upload-footer">
          <button type="button" class="upload-btn upload-btn--cancel" :disabled="uploading" @click="uploadModalVisible = false">
            取 消
          </button>
          <button
            type="button"
            class="upload-btn upload-btn--ok"
            :disabled="uploading || !uploadTaskId || uploadFiles.length === 0"
            @click="submitUpload"
          >
            <span v-if="uploading" class="upload-spinner"></span>
            <span v-else>上 传 ({{ uploadFiles.length }})</span>
          </button>
          <p v-if="uploadProgress" class="upload-progress-text">{{ uploadProgress }}</p>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue';
import { NModal, NButton, NInput, NSelect, NDropdown } from 'naive-ui';
import taskApi from '@/api/task';
import attachmentApi from '@/api/attachment';
import { downloadAttachment as downloadAttachmentById, triggerSave } from '@/api/attachmentDownload';
import tagApi from '@/api/tag';
import { useUserStore } from '@/stores/user';
import type { Task, Attachment, Tag } from '@/types';
import dayjs from 'dayjs';

interface AttachmentItem {
  attachment: Attachment;
  taskTitle: string;
  taskId: number;
  tags?: Tag[];
}

type TypeFilter = 'all' | 'image' | 'video' | 'pdf' | 'other';
type SortBy = 'timeDesc' | 'timeAsc' | 'name' | 'size';

const ALL_TASK_ID = -1;
const ALL_TAG_ID = -1;

const userStore = useUserStore();
const allItems = ref<AttachmentItem[]>([]);
const taskList = ref<Task[]>([]);
const loading = ref(true);
const thumbnailUrls = reactive<Record<number, string>>({});
const previewVisible = ref(false);
const previewAtt = ref<Attachment | null>(null);
const previewBlobUrl = ref<string | null>(null);
const previewLoadError = ref<string | null>(null);
const previewLoading = ref(false);
const deletingId = ref<number | null>(null);
const downloadingId = ref<number | null>(null);

// 筛选
const searchText = ref('');
const filterTaskId = ref<number>(ALL_TASK_ID);
const filterType = ref<TypeFilter>('all');
const sortBy = ref<SortBy>('timeDesc');
const filterTagId = ref<number>(ALL_TAG_ID);

// 编辑弹窗
const editModalVisible = ref(false);
const editingItem = ref<AttachmentItem | null>(null);
const editTaskId = ref<number | null>(null);
const editTagIds = ref<number[]>([]);
const editFileName = ref('');
const editTagList = ref<Tag[]>([]);
const editSaving = ref(false);

const editTaskOptions = computed(() =>
  taskList.value.map((t) => ({ label: t.title ?? `任务 #${t.id}`, value: t.id }))
);

const editTagOptions = computed(() =>
  editTagList.value.map((t) => ({ label: t.name, value: t.id }))
);

function openEditModal(item: AttachmentItem) {
  editingItem.value = item;
  editFileName.value = item.attachment.fileName || '';
  editTaskId.value = item.taskId;
  editTagIds.value = (item.tags ?? []).map((t) => t.id);
  editModalVisible.value = true;
  tagApi.getList({ skipGlobalError: true }).then((list) => {
    editTagList.value = Array.isArray(list) ? list : [];
  }).catch(() => { editTagList.value = globalTagList.value; });
}

function resetEditForm() {
  editingItem.value = null;
  editFileName.value = '';
  editTaskId.value = null;
  editTagIds.value = [];
  editSaving.value = false;
}

async function submitEdit() {
  const item = editingItem.value;
  const newName = editFileName.value.trim();
  if (!item || !editTaskId.value || !newName) return;
  editSaving.value = true;
  try {
    // 单次 PATCH：同时传 fileName + taskId + tagIds，避免先改名再更新任务时第二次请求缺 fileName 触发「文件名不能为空」
    await attachmentApi.updateAttachment(item.taskId, item.attachment.id, {
      fileName: newName,
      taskId: editTaskId.value,
      tagIds: editTagIds.value,
    });
    editModalVisible.value = false;
    await loadAll();
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'success', title: '修改成功', message: '附件信息已更新' },
    }));
  } catch (e) {
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'error', title: '修改失败', message: (e as Error)?.message || '请稍后重试' },
    }));
  } finally {
    editSaving.value = false;
  }
}

// 上传弹窗
const uploadModalVisible = ref(false);
const uploadTaskId = ref<number | null>(null);
const uploadFiles = ref<File[]>([]);
const uploadFileList = ref<{ id: string; name: string }[]>([]);
const uploadTagIds = ref<number[]>([]);
const uploadTagList = ref<Tag[]>([]);
const uploading = ref(false);
const uploadProgress = ref('');
const folderInputRef = ref<HTMLInputElement | null>(null);

function formatTime(val?: string): string {
  if (!val) return '—';
  return dayjs(val).format('YYYY-MM-DD HH:mm');
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function attachmentPreviewType(att: Attachment): 'image' | 'video' | 'pdf' | 'other' {
  const type = (att.fileType ?? '').toLowerCase();
  const name = (att.fileName ?? '').toLowerCase();
  const ext = name.includes('.') ? name.slice(name.lastIndexOf('.') + 1) : '';
  if (type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) return 'image';
  if (type.startsWith('video/') || ['mp4', 'webm', 'ogg', 'mov', 'm4v'].includes(ext)) return 'video';
  if (type === 'application/pdf' || ext === 'pdf') return 'pdf';
  return 'other';
}

const previewTypeCur = computed(() => previewAtt.value ? attachmentPreviewType(previewAtt.value) : 'other');

// 筛选：所属任务下拉（从当前附件涉及的任务 + 全部任务列表合并去重）
const taskDropdownOpts = computed(() => {
  const opts: { label: string; key: number }[] = [{ label: '全部任务', key: ALL_TASK_ID }];
  const seen = new Set<number>();
  for (const item of allItems.value) {
    if (!seen.has(item.taskId)) {
      seen.add(item.taskId);
      opts.push({ label: item.taskTitle, key: item.taskId });
    }
  }
  return opts;
});

const globalTagList = ref<Tag[]>([]);

const allTags = computed<Tag[]>(() => {
  if (globalTagList.value.length) return globalTagList.value;
  const map = new Map<number, Tag>();
  allItems.value.forEach((item) => {
    (item.tags ?? []).forEach((tag) => {
      if (!map.has(tag.id)) map.set(tag.id, tag);
    });
  });
  return Array.from(map.values());
});

const typeDropdownOpts: { label: string; key: TypeFilter }[] = [
  { label: '全部类型', key: 'all' },
  { label: '图片', key: 'image' },
  { label: '视频', key: 'video' },
  { label: '文档', key: 'pdf' },
  { label: '其他', key: 'other' },
];

const typeFilterLabel = computed(() => {
  const o = typeDropdownOpts.find(x => x.key === filterType.value);
  return o?.label ?? '类型';
});

const tagDropdownOpts = computed(() => [
  { label: '全部标签', key: ALL_TAG_ID },
  ...allTags.value.map(t => ({ label: t.name, key: t.id })),
]);

const tagFilterLabel = computed(() => {
  if (filterTagId.value === ALL_TAG_ID) return '标签';
  const tag = allTags.value.find(t => t.id === filterTagId.value);
  return tag?.name ?? '标签';
});

const sortDropdownOpts: { label: string; key: SortBy }[] = [
  { label: '时间倒序', key: 'timeDesc' },
  { label: '时间正序', key: 'timeAsc' },
  { label: '按名称', key: 'name' },
  { label: '按大小', key: 'size' },
];

const sortByLabel = computed(() => {
  const o = sortDropdownOpts.find(x => x.key === sortBy.value);
  return o?.label ?? '排序';
});

const hasActiveFilters = computed(() =>
  !!(
    (searchText.value || '').trim() ||
    filterTaskId.value !== ALL_TASK_ID ||
    filterType.value !== 'all' ||
    filterTagId.value !== ALL_TAG_ID
  )
);

const filteredItems = computed(() => {
  let list = [...allItems.value];
  const q = (searchText.value || '').trim().toLowerCase();
  if (q) {
    list = list.filter(
      (i) =>
        (i.attachment.fileName ?? '').toLowerCase().includes(q) ||
        (i.taskTitle ?? '').toLowerCase().includes(q)
    );
  }
  if (filterTaskId.value !== ALL_TASK_ID) {
    list = list.filter((i) => i.taskId === filterTaskId.value);
  }
  if (filterType.value !== 'all') {
    list = list.filter((i) => attachmentPreviewType(i.attachment) === filterType.value);
  }
  if (filterTagId.value !== ALL_TAG_ID) {
    list = list.filter((i) => (i.tags ?? []).some((t) => t.id === filterTagId.value));
  }
  const order = sortBy.value;
  list = [...list].sort((a, b) => {
    if (order === 'timeDesc') return (b.attachment.createdAt || '').localeCompare(a.attachment.createdAt || '');
    if (order === 'timeAsc') return (a.attachment.createdAt || '').localeCompare(b.attachment.createdAt || '');
    if (order === 'name') return (a.attachment.fileName || '').localeCompare(b.attachment.fileName || '');
    if (order === 'size') return (a.attachment.fileSize ?? 0) - (b.attachment.fileSize ?? 0);
    return 0;
  });
  return list;
});

function onTaskFilterSelect(key: number) {
  filterTaskId.value = key;
}

function onTypeFilterSelect(key: TypeFilter) {
  filterType.value = key;
}

function onSortSelect(key: SortBy) {
  sortBy.value = key;
}

function onTagFilterSelect(key: number) {
  filterTagId.value = key;
}

const uploadTaskOptions = computed(() =>
  taskList.value.map((t) => ({ label: t.title ?? `任务 #${t.id}`, value: t.id }))
);

const uploadTagOptions = computed(() =>
  uploadTagList.value.map((t) => ({ label: t.name, value: t.id }))
);

function openUploadModal() {
  uploadModalVisible.value = true;
  tagApi.getList({ skipGlobalError: true }).then((list) => {
    uploadTagList.value = Array.isArray(list) ? list : [];
  }).catch(() => { uploadTagList.value = []; });
  if (taskList.value.length === 0) {
    taskApi.getTasks(undefined, { skipGlobalError: true }).then((tasks) => {
      taskList.value = Array.isArray(tasks) ? tasks : [];
    }).catch(() => { taskList.value = []; });
    taskApi.getArchivedTasks({ skipGlobalError: true }).then((tasks) => {
      const archived = Array.isArray(tasks) ? tasks : [];
      const seen = new Set(taskList.value.map((t) => t.id));
      for (const t of archived) {
        if (!seen.has(t.id)) {
          seen.add(t.id);
          taskList.value.push(t);
        }
      }
    }).catch(() => {});
  }
}

const fileInputRef = ref<HTMLInputElement | null>(null);

function triggerFileInput() {
  fileInputRef.value?.click();
}

function triggerFolderInput() {
  folderInputRef.value?.click();
}

function onFilesSelected(e: Event) {
  const input = e.target as HTMLInputElement;
  if (!input.files?.length) return;
  appendFiles(Array.from(input.files));
  input.value = '';
}

function onFolderSelected(e: Event) {
  const input = e.target as HTMLInputElement;
  if (!input.files?.length) return;
  appendFiles(Array.from(input.files));
  input.value = '';
}

function onDropFiles(e: DragEvent) {
  const items = e.dataTransfer?.items;
  if (!items) return;
  const files: File[] = [];
  const promises: Promise<void>[] = [];
  for (const item of Array.from(items)) {
    const entry = item.webkitGetAsEntry?.();
    if (entry) {
      promises.push(readEntry(entry, files));
    } else if (item.kind === 'file') {
      const f = item.getAsFile();
      if (f) files.push(f);
    }
  }
  Promise.all(promises).then(() => appendFiles(files));
}

function readEntry(entry: FileSystemEntry, files: File[]): Promise<void> {
  return new Promise((resolve) => {
    if (entry.isFile) {
      (entry as FileSystemFileEntry).file((f) => { files.push(f); resolve(); }, () => resolve());
    } else if (entry.isDirectory) {
      const reader = (entry as FileSystemDirectoryEntry).createReader();
      reader.readEntries((entries) => {
        Promise.all(entries.map((e) => readEntry(e, files))).then(() => resolve());
      }, () => resolve());
    } else {
      resolve();
    }
  });
}

function appendFiles(newFiles: File[]) {
  const existing = new Set(uploadFiles.value.map((f) => `${f.name}-${f.size}-${f.lastModified}`));
  const deduped = newFiles.filter((f) => !existing.has(`${f.name}-${f.size}-${f.lastModified}`));
  uploadFiles.value = [...uploadFiles.value, ...deduped];
}

function clearUploadFiles() {
  uploadFiles.value = [];
  uploadFileList.value = [];
}

function resetUploadForm() {
  uploadTaskId.value = null;
  uploadFiles.value = [];
  uploadFileList.value = [];
  uploadTagIds.value = [];
  uploadProgress.value = '';
}

async function handleDownload(att: Attachment) {
  if (!att.id || downloadingId.value != null) return;
  downloadingId.value = att.id;
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
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'error', title: '下载失败', message: (e as Error)?.message || '请稍后重试' },
    }));
  } finally {
    downloadingId.value = null;
  }
}

async function submitUpload() {
  const taskId = uploadTaskId.value;
  const files = uploadFiles.value;
  if (taskId == null || !files.length) return;
  uploading.value = true;
  const tagIds = uploadTagIds.value?.length ? uploadTagIds.value : undefined;
  let successCount = 0;
  let failCount = 0;
  for (let i = 0; i < files.length; i++) {
    uploadProgress.value = `正在上传 ${i + 1}/${files.length}：${files[i].name}`;
    try {
      await attachmentApi.uploadAttachment(taskId, files[i], tagIds);
      successCount++;
    } catch {
      failCount++;
    }
  }
  uploadProgress.value = '';
  uploading.value = false;
  if (successCount > 0) {
    uploadModalVisible.value = false;
    await loadAll();
    const msg = failCount > 0
      ? `成功 ${successCount} 个，失败 ${failCount} 个`
      : `${successCount} 个附件已上传`;
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: failCount > 0 ? 'warning' : 'success', title: '上传完成', message: msg },
    }));
  } else {
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'error', title: '上传失败', message: '所有文件上传均失败，请稍后重试' },
    }));
  }
}

function resolveTaskTags(task: Task, tagMap: Map<number, Tag>): Tag[] {
  if (task.tags?.length) return task.tags;
  const legacyTask = task as unknown as { tag_ids?: number[] };
  const ids = task.tagIds ?? legacyTask.tag_ids;
  if (!ids?.length) return [];
  return ids.map((id) => tagMap.get(Number(id))).filter(Boolean) as Tag[];
}

async function loadAll() {
  loading.value = true;
  try {
    /** 首屏并行拉取：失败时由本页静默展示空列表，不用 axios 全局 Toast（避免「网络异常」与「暂无附件」同时出现） */
    const [tasksNorm, tasksArchived, tagList] = await Promise.all([
      taskApi.getTasks(undefined, { skipGlobalError: true }).catch(() => [] as Task[]),
      taskApi.getArchivedTasks({ skipGlobalError: true }).catch(() => [] as Task[]),
      tagApi.getList({ skipGlobalError: true }).catch(() => []),
    ]);
    globalTagList.value = Array.isArray(tagList) ? tagList : [];
    const tagMap = new Map<number, Tag>();
    globalTagList.value.forEach((t) => tagMap.set(t.id, t));

    const tasks = [...(tasksNorm ?? []), ...(tasksArchived ?? [])];
    const seenIds = new Set<number>();
    const uniqueTasks = tasks.filter((t: Task) => {
      if (seenIds.has(t.id)) return false;
      seenIds.add(t.id);
      return true;
    });
    taskList.value = uniqueTasks;
    const items: AttachmentItem[] = [];
    await Promise.all(
      uniqueTasks.map(async (task: Task) => {
        try {
          const list = await attachmentApi.getAttachments(task.id);
          const taskTags = resolveTaskTags(task, tagMap);
          (list ?? []).forEach((att: Attachment) => {
            items.push({
              attachment: att,
              taskTitle: task.title ?? `任务 #${task.id}`,
              taskId: task.id,
              tags: taskTags,
            });
          });
        } catch {
          // ignore
        }
      })
    );
    allItems.value = items.sort((a, b) => (b.attachment.createdAt || '').localeCompare(a.attachment.createdAt || ''));
  } catch {
    allItems.value = [];
    taskList.value = [];
  } finally {
    loading.value = false;
  }
}

function loadThumbnails(items: AttachmentItem[]) {
  const previewable = items.filter((it) => {
    const type = attachmentPreviewType(it.attachment);
    return (type === 'image' || type === 'video') && !thumbnailUrls[it.attachment.id];
  });
  for (const it of previewable) {
    const att = it.attachment;
    attachmentApi.downloadAttachment(att.id).then((blob) => {
      if (attachmentPreviewType(att) === 'video') {
        generateVideoThumbnail(blob).then((url) => {
          if (url) thumbnailUrls[att.id] = url;
        });
      } else {
        thumbnailUrls[att.id] = URL.createObjectURL(blob);
      }
    }).catch(() => { /* thumbnail load failed, keep icon */ });
  }
}

function generateVideoThumbnail(blob: Blob): Promise<string | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    const url = URL.createObjectURL(blob);
    video.src = url;
    video.addEventListener('loadeddata', () => {
      video.currentTime = Math.min(1, video.duration * 0.1);
    });
    video.addEventListener('seeked', () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d')!.drawImage(video, 0, 0);
        const thumb = canvas.toDataURL('image/jpeg', 0.7);
        URL.revokeObjectURL(url);
        resolve(thumb);
      } catch {
        URL.revokeObjectURL(url);
        resolve(null);
      }
    });
    video.addEventListener('error', () => { URL.revokeObjectURL(url); resolve(null); });
    setTimeout(() => { URL.revokeObjectURL(url); resolve(null); }, 8000);
  });
}

watch(() => allItems.value, (items) => {
  if (items.length) loadThumbnails(items);
}, { immediate: true });

function openPreview(att: Attachment) {
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

async function handleDelete(item: AttachmentItem) {
  if (deletingId.value != null) return;
  deletingId.value = item.attachment.id;
  try {
    await attachmentApi.deleteAttachment(item.taskId, item.attachment.id);
    allItems.value = allItems.value.filter(i => i.attachment.id !== item.attachment.id);
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'success', title: '已删除', message: '附件已删除' },
    }));
  } catch (e) {
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'error', title: '删除失败', message: (e as Error)?.message || '请稍后重试' },
    }));
  } finally {
    deletingId.value = null;
  }
}

function onRefresh(e: Event) {
  const d = (e as CustomEvent).detail;
  if (!d?.view || d.view === 'Attachments') loadAll();
}

function onTaskSync() {
  loadAll();
}

onMounted(() => {
  loadAll();
  window.addEventListener('refresh-view', onRefresh);
  window.addEventListener('task-updated', onTaskSync);
  window.addEventListener('task-deleted', onTaskSync);
});

onUnmounted(() => {
  window.removeEventListener('refresh-view', onRefresh);
  window.removeEventListener('task-updated', onTaskSync);
  window.removeEventListener('task-deleted', onTaskSync);
});
</script>

<style scoped>
@import '../styles/components.css';

.attachments-page {
  flex: 1;
  min-height: 0;
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.page-header {
  flex-shrink: 0;
  padding: 0 0 var(--spacing-md);
  margin-bottom: 0;
}

.attachments-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

.page-header h1 {
  margin: 0 0 0.25rem;
  font-size: var(--font-size-h1);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  line-height: var(--line-height-tight);
}

.page-desc {
  margin: 0;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-normal);
  color: var(--text-secondary);
  line-height: var(--line-height-normal);
}

/* 工具栏（与任务列表一致） */
.toolbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 20px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-subtle);
  flex-wrap: wrap;
}
.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.tb-search {
  width: 200px;
}
.tb-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-medium);
  border: 1px solid var(--border-subtle);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
  user-select: none;
}
.tb-pill:hover {
  border-color: var(--teal);
  color: var(--teal);
}
.tb-pill.active {
  background: var(--teal);
  color: #fff;
  border-color: var(--teal);
}
.tb-upload-btn {
  flex-shrink: 0;
}

/* 上传弹窗表单 */
.upload-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.form-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-row label {
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
}
.upload-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.upload-btn {
  padding: 7px 24px;
  border-radius: 6px;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.15s;
  outline: none;
}

.upload-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.upload-btn--cancel {
  background: #fff;
  border-color: #d1d5db;
  color: var(--text-primary, #374151);
}

.upload-btn--cancel:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
}

.upload-btn--ok {
  background: #3b82f6;
  color: #fff;
  border-color: #3b82f6;
}

.upload-btn--ok:hover:not(:disabled) {
  background: #2563eb;
  border-color: #2563eb;
}

.upload-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: var(--text-primary);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.upload-drop-zone {
  border: 2px dashed var(--border-medium);
  border-radius: var(--radius-md);
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--text-tertiary);
  transition: border-color 0.2s, background 0.2s;
  cursor: default;
}

.upload-drop-zone:hover,
.upload-drop-zone.dragover {
  border-color: var(--accent-primary);
  background: rgba(0, 229, 255, 0.04);
}

.upload-drop-text {
  font-size: 13px;
}

.upload-drop-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.upload-pick-btn {
  padding: 5px 14px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-medium);
  background: transparent;
  color: var(--text-secondary);
  font-size: var(--font-size-small);
  cursor: pointer;
  transition: all 0.15s;
}

.upload-pick-btn:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

.upload-hidden-input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  overflow: hidden;
  pointer-events: none;
}

.upload-file-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
}

.upload-file-count {
  font-size: var(--font-size-small);
  color: var(--accent-primary);
  font-weight: 500;
}

.upload-file-clear {
  padding: 2px 8px;
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  font-size: 12px;
  cursor: pointer;
  transition: color 0.15s;
}

.upload-file-clear:hover {
  color: var(--danger);
}

.upload-file-list-mini {
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.upload-file-item-mini {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 3px 8px;
  border-radius: var(--radius-sm);
  background: var(--bg-tertiary);
  font-size: 12px;
}

.upload-file-name-mini {
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.upload-file-size-mini {
  color: var(--text-tertiary);
  flex-shrink: 0;
  margin-left: 8px;
}

.upload-file-more {
  font-size: 12px;
  color: var(--text-tertiary);
  padding: 2px 8px;
}

.upload-progress-text {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--text-tertiary);
  text-align: center;
  width: 100%;
}

.loading {
  display: flex;
  justify-content: center;
  padding: 48px;
}

.empty-state {
  text-align: center;
  padding: 48px 24px;
}

.empty-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  color: var(--text-tertiary);
}

.empty-icon svg {
  width: 100%;
  height: 100%;
}

.empty-text {
  margin: 0;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-normal);
  color: var(--text-secondary);
  line-height: var(--line-height-normal);
}

.attachments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.attachment-card {
  border-radius: var(--radius-md, 12px);
  border: 1px solid var(--border-subtle);
  background: var(--bg-secondary);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.2s;
}

.attachment-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.card-preview {
  aspect-ratio: 16/10;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  position: relative;
}

.card-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.card-play-icon {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.85);
  background: rgba(0, 0, 0, 0.25);
  transition: background 0.2s;
}

.card-preview:hover .card-play-icon {
  background: rgba(0, 0, 0, 0.4);
}

.card-size-badge {
  position: absolute;
  bottom: 6px;
  left: 6px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 4px;
  pointer-events: none;
}

.card-preview-icon svg {
  width: 40px;
  height: 40px;
}

.card-preview-icon[data-type='image'] { color: #58a6ff; }
.card-preview-icon[data-type='video'] { color: #d29922; }
.card-preview-icon[data-type='pdf'] { color: #f85149; }
.card-preview-icon[data-type='other'] { color: var(--text-tertiary); }

.card-body {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 0;
}

.card-name {
  font-size: var(--font-size-title);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: var(--line-height-tight);
}

.card-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.card-rename-input :deep(.n-input__input-el) {
  font-size: var(--font-size-small);
}

.card-tags {
  margin-top: 4px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.card-tag {
  padding: 3px 8px;
  border-radius: 999px;
  font-size: var(--font-size-caption);
  font-weight: var(--font-weight-medium);
  background: rgba(45, 212, 191, 0.12);
  color: var(--teal);
}

.card-meta {
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-normal);
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: var(--line-height-normal);
}

.card-actions {
  padding: 0 12px 12px;
  display: flex;
  gap: 6px;
  flex-wrap: nowrap;
}

.card-btn {
  flex: 1;
  padding: 6px 0;
  text-align: center;
  border-radius: var(--radius-sm, 6px);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-medium);
  border: 1px solid var(--border-medium);
  background: var(--bg-secondary);
  color: var(--text-primary);
  text-decoration: none;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
}

.card-btn:hover:not(:disabled) {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

.card-btn--danger:hover:not(:disabled) {
  border-color: #ef4444;
  color: #ef4444;
}

.card-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

/* 预览弹窗 */
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
</style>
