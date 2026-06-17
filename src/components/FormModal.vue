<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="modelValue" class="modal-overlay" @click.self="handleCancel">
        <div class="modal-card" :style="cardStyle">
          <div class="modal-header">
            <span class="modal-title">{{ title }}</span>
            <button type="button" class="modal-close" @click="handleCancel" aria-label="关闭">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <slot />
          </div>
          <div class="modal-footer">
            <button type="button" class="modal-btn modal-btn--cancel" :disabled="loading" @click="handleCancel">
              {{ cancelText }}
            </button>
            <button type="button" class="modal-btn modal-btn--ok" :disabled="loading" @click="handleConfirm">
              <span v-if="loading" class="modal-spinner"></span>
              <span v-else>{{ confirmText }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  modelValue: boolean;
  title?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  width?: string;
}>(), {
  title: '提示',
  confirmText: '确 定',
  cancelText: '取 消',
  loading: false,
  width: '460px',
});

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();

const cardStyle = computed(() => ({
  width: props.width,
  maxWidth: '92vw',
}));

function handleCancel() {
  if (props.loading) return;
  emit('update:modelValue', false);
  emit('cancel');
}

function handleConfirm() {
  emit('confirm');
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.35);
}

.modal-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  animation: modal-pop 0.2s ease;
}

[data-theme="dark"] .modal-card {
  background: var(--bg-secondary, #1e1e2e);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

@keyframes modal-pop {
  from { transform: scale(0.92); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 0;
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #1a1a2e);
}

.modal-close {
  background: none;
  border: none;
  color: var(--text-tertiary, #9ca3af);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  transition: color 0.15s, background 0.15s;
}

.modal-close:hover {
  color: var(--text-primary, #374151);
  background: var(--bg-tertiary, #f3f4f6);
}

.modal-body {
  padding: 16px 24px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 0 24px 20px;
}

.modal-btn {
  padding: 7px 24px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.15s;
  outline: none;
}

.modal-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-btn--cancel {
  background: #fff;
  border-color: #d1d5db;
  color: var(--text-primary, #374151);
}

.modal-btn--cancel:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
}

[data-theme="dark"] .modal-btn--cancel {
  background: var(--bg-tertiary, #2a2a3e);
  border-color: var(--border-subtle, #444);
  color: var(--text-secondary, #ccc);
}

.modal-btn--ok {
  background: #3b82f6;
  color: #fff;
  border-color: #3b82f6;
}

.modal-btn--ok:hover:not(:disabled) {
  background: #2563eb;
  border-color: #2563eb;
}

.modal-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
