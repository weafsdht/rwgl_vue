<template>
  <n-modal
    :show="modelValue"
    class="avatar-upload-modal"
    preset="card"
    title="上传头像"
    :bordered="false"
    style="width: 420px; max-width: 95vw"
    :mask-closable="true"
    :closable="true"
    @update:show="(v: boolean) => $emit('update:modelValue', v)"
    @after-leave="reset"
  >
    <div class="avatar-upload-content">
      <!-- 圆形预览（可拖动） -->
      <div class="avatar-preview-wrap">
        <div
          class="avatar-preview-circle"
          ref="previewRef"
          :class="{ 'avatar-preview-circle--draggable': previewUrl }"
          @mousedown="onPreviewMouseDown"
        >
          <canvas ref="canvasRef" class="avatar-canvas" :style="{ display: previewUrl ? 'block' : 'none' }"></canvas>
          <div v-if="!previewUrl" class="avatar-preview-placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="48" height="48">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            <span>请选择图片</span>
          </div>
        </div>
      </div>

      <!-- 缩放控制 -->
      <div class="zoom-controls">
        <button type="button" class="zoom-btn" :disabled="!previewUrl" @click="zoomOut" aria-label="缩小">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
        <input
          type="range"
          v-model.number="zoom"
          min="50"
          max="150"
          step="5"
          class="zoom-slider"
          :disabled="!previewUrl"
        />
        <button type="button" class="zoom-btn" :disabled="!previewUrl" @click="zoomIn" aria-label="放大">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>

      <!-- 说明文字 -->
      <div class="avatar-tips">
        <p>图片格式：JPG、JPEG、PNG、GIF、WebP。</p>
        <p>其他用户可以看到您的头像。</p>
      </div>

      <!-- 操作按钮 -->
      <div class="avatar-actions">
        <button type="button" class="btn-select" @click="triggerFileInput">
          选择图片
        </button>
        <button
          type="button"
          class="btn-upload"
          :disabled="!previewUrl || uploading"
          @click="handleUpload"
        >
          {{ uploading ? '上传中…' : '上传头像' }}
        </button>
      </div>
    </div>

    <input
      ref="fileInputRef"
      type="file"
      accept="image/jpeg,image/png,image/gif,image/webp"
      class="avatar-input-hidden"
      @change="onFileSelect"
    />
  </n-modal>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';
import { NModal } from 'naive-ui';

const props = defineProps<{ modelValue: boolean }>();
watch(() => props.modelValue, (v) => { if (!v) reset(); });

const emit = defineEmits<{
  'update:modelValue': [v: boolean];
  success: [file: File];
}>();

const PREVIEW_SIZE = 200;
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

const fileInputRef = ref<HTMLInputElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const previewRef = ref<HTMLDivElement | null>(null);

const previewUrl = ref('');
const zoom = ref(100);
const offsetX = ref(0);
const offsetY = ref(0);
const uploading = ref(false);

let selectedFile: File | null = null;
let imgElement: HTMLImageElement | null = null;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let dragStartOffsetX = 0;
let dragStartOffsetY = 0;

function triggerFileInput() {
  fileInputRef.value?.click();
}

function onFileSelect(e: Event) {
  const el = e.target as HTMLInputElement;
  const file = el.files?.[0];
  el.value = '';
  if (!file || !file.type.startsWith('image/')) {
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'warning', title: '请选择图片', message: '仅支持 JPG、PNG、GIF、WebP 等图片格式' },
    }));
    return;
  }
  if (file.size > MAX_SIZE) {
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'warning', title: '文件过大', message: '头像不能超过 2MB' },
    }));
    return;
  }
  selectedFile = file;
  previewUrl.value = URL.createObjectURL(file);
  zoom.value = 100;
  offsetX.value = 0;
  offsetY.value = 0;
  loadImageAndDraw();
}

function loadImageAndDraw() {
  if (!selectedFile || !previewUrl.value) return;
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    imgElement = img;
    drawPreview();
  };
  img.src = previewUrl.value;
}

function drawPreview() {
  const canvas = canvasRef.value;
  const img = imgElement;
  if (!canvas || !img) return;

  const size = PREVIEW_SIZE;
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const scale = zoom.value / 100;
  const imgW = img.naturalWidth;
  const imgH = img.naturalHeight;
  const minDim = Math.min(imgW, imgH);
  const drawSize = size * scale;
  const canvasOffset = (size - drawSize) / 2;
  const maxOffset = Math.max(0, minDim * (scale - 1) / 2);
  const clampedOffsetX = Math.max(-maxOffset, Math.min(maxOffset, offsetX.value));
  const clampedOffsetY = Math.max(-maxOffset, Math.min(maxOffset, offsetY.value));
  const sx = (imgW - minDim) / 2 - clampedOffsetX;
  const sy = (imgH - minDim) / 2 - clampedOffsetY;

  ctx.save();
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, sx, sy, minDim, minDim, canvasOffset, canvasOffset, drawSize, drawSize);
  ctx.restore();
}

function onPreviewMouseDown(e: MouseEvent) {
  if (!previewUrl.value) return;
  isDragging = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  dragStartOffsetX = offsetX.value;
  dragStartOffsetY = offsetY.value;
  window.addEventListener('mousemove', onPreviewMouseMove);
  window.addEventListener('mouseup', onPreviewMouseUp);
}

function onPreviewMouseMove(e: MouseEvent) {
  if (!isDragging || !imgElement) return;
  const scale = zoom.value / 100;
  const minDim = Math.min(imgElement.naturalWidth, imgElement.naturalHeight);
  const drawSize = PREVIEW_SIZE * scale;
  const ratio = minDim / drawSize;
  const maxOffset = Math.max(0, minDim * (scale - 1) / 2);
  const rawX = dragStartOffsetX + (e.clientX - dragStartX) * ratio;
  const rawY = dragStartOffsetY + (e.clientY - dragStartY) * ratio;
  offsetX.value = Math.max(-maxOffset, Math.min(maxOffset, rawX));
  offsetY.value = Math.max(-maxOffset, Math.min(maxOffset, rawY));
}

function onPreviewMouseUp() {
  isDragging = false;
  window.removeEventListener('mousemove', onPreviewMouseMove);
  window.removeEventListener('mouseup', onPreviewMouseUp);
}

onUnmounted(() => {
  window.removeEventListener('mousemove', onPreviewMouseMove);
  window.removeEventListener('mouseup', onPreviewMouseUp);
});

watch([zoom, offsetX, offsetY], () => drawPreview());

function zoomOut() {
  if (zoom.value > 50) zoom.value = Math.max(50, zoom.value - 10);
}

function zoomIn() {
  if (zoom.value < 150) zoom.value = Math.min(150, zoom.value + 10);
}

function getCroppedBlob(): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = canvasRef.value;
    if (!canvas) {
      reject(new Error('Canvas not ready'));
      return;
    }
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Export failed'))),
      'image/jpeg',
      0.9
    );
  });
}

async function handleUpload() {
  if (!previewUrl.value || uploading.value) return;
  uploading.value = true;
  try {
    const blob = await getCroppedBlob();
    const file = new File([blob], selectedFile?.name || 'avatar.jpg', { type: 'image/jpeg' });
    emit('success', file as File);
    emit('update:modelValue', false);
  } catch (err) {
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'error', title: '处理失败', message: '无法生成头像图片' },
    }));
  } finally {
    uploading.value = false;
  }
}

function reset() {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
  }
  previewUrl.value = '';
  selectedFile = null;
  imgElement = null;
  zoom.value = 100;
  offsetX.value = 0;
  offsetY.value = 0;
}
</script>

<style scoped>
.avatar-upload-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.avatar-preview-wrap {
  display: flex;
  justify-content: center;
}

.avatar-preview-circle {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--bg-tertiary);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-preview-circle--draggable {
  cursor: grab;
}

.avatar-preview-circle--draggable:active {
  cursor: grabbing;
}

.avatar-canvas {
  width: 200px;
  height: 200px;
  display: block;
}

.avatar-preview-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--text-tertiary);
  font-size: 14px;
}

.avatar-preview-placeholder svg {
  opacity: 0.5;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.zoom-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid var(--border-medium);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.zoom-btn:hover:not(:disabled) {
  background: var(--bg-tertiary);
  color: var(--accent-primary);
  border-color: var(--accent-primary);
}

.zoom-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.zoom-slider {
  flex: 1;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--bg-tertiary);
  border-radius: 3px;
  outline: none;
}

.zoom-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--accent-primary);
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}

.zoom-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--accent-primary);
  cursor: pointer;
  border: none;
}

.avatar-tips {
  font-size: 13px;
  color: var(--text-tertiary);
  line-height: 1.6;
  margin: 0;
}

.avatar-tips p {
  margin: 0 0 4px;
}

.avatar-tips p:last-child {
  margin-bottom: 0;
}

.avatar-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn-select,
.btn-upload {
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-select {
  border: 1px solid var(--border-medium);
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.btn-select:hover {
  background: var(--bg-tertiary);
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

.btn-upload {
  border: none;
  background: var(--accent-primary);
  color: #fff;
}

.btn-upload:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-upload:disabled {
  background: var(--bg-tertiary);
  color: var(--text-tertiary);
  cursor: not-allowed;
}

.avatar-input-hidden {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}
</style>
