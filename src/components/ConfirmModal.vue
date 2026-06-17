<template>
  <Teleport to="body">
    <Transition name="confirm-fade">
      <div v-if="modelValue" class="confirm-overlay" @click.self="handleCancel">
        <div class="confirm-card">
          <div class="confirm-header">
            <span class="confirm-icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                <circle cx="12" cy="12" r="11" fill="#f59e0b" opacity="0.15"/>
                <circle cx="12" cy="12" r="9" fill="#f59e0b"/>
                <path d="M12 8v4" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
                <circle cx="12" cy="15.5" r="1" fill="#fff"/>
              </svg>
            </span>
            <span class="confirm-title">{{ title }}</span>
          </div>
          <div class="confirm-body">{{ content }}</div>
          <div class="confirm-footer">
            <button type="button" class="confirm-btn confirm-btn--cancel" :disabled="loading" @click="handleCancel">
              {{ cancelText }}
            </button>
            <button type="button" class="confirm-btn confirm-btn--ok" :disabled="loading" @click="handleConfirm">
              <span v-if="loading" class="confirm-spinner"></span>
              <span v-else>{{ confirmText }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean;
  title?: string;
  content?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();

function handleCancel() {
  emit('update:modelValue', false);
  emit('cancel');
}

function handleConfirm() {
  emit('confirm');
}
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.35);
}

.confirm-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  width: 420px;
  max-width: 90vw;
  padding: 28px 32px 22px;
  animation: confirm-pop 0.2s ease;
}

[data-theme="dark"] .confirm-card {
  background: var(--bg-secondary, #1e1e2e);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

@keyframes confirm-pop {
  from { transform: scale(0.92); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.confirm-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.confirm-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.confirm-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #1a1a2e);
}

.confirm-body {
  font-size: 14px;
  color: var(--text-secondary, #6b7280);
  line-height: 1.6;
  padding-left: 32px;
  margin-bottom: 24px;
}

.confirm-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.confirm-btn {
  padding: 7px 24px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.15s;
  outline: none;
}

.confirm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.confirm-btn--cancel {
  background: #fff;
  border-color: #d1d5db;
  color: var(--text-primary, #374151);
}

.confirm-btn--cancel:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
}

[data-theme="dark"] .confirm-btn--cancel {
  background: var(--bg-tertiary, #2a2a3e);
  border-color: var(--border-subtle, #444);
  color: var(--text-secondary, #ccc);
}

.confirm-btn--ok {
  background: #3b82f6;
  color: #fff;
  border-color: #3b82f6;
}

.confirm-btn--ok:hover:not(:disabled) {
  background: #2563eb;
  border-color: #2563eb;
}

.confirm-spinner {
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

/* Transition */
.confirm-fade-enter-active,
.confirm-fade-leave-active {
  transition: opacity 0.2s ease;
}

.confirm-fade-enter-from,
.confirm-fade-leave-to {
  opacity: 0;
}
</style>
