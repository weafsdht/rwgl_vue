<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast"
          :class="toast.type"
        >
          <div class="toast-accent"></div>
          <div class="toast-body">
            <span class="toast-icon">
              <svg v-if="toast.type === 'success'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <svg v-else-if="toast.type === 'warning'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <svg v-else-if="toast.type === 'error'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
            </span>
            <span class="toast-text">
              <strong>{{ toast.title }}</strong>
              <span v-if="toast.message" class="toast-msg">{{ toast.message }}</span>
            </span>
          </div>
          <button class="toast-close" @click="removeToast(toast.id)" aria-label="关闭">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface Toast {
  id: number;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

const toasts = ref<Toast[]>([]);
let toastId = 0;

const addToast = (toast: Omit<Toast, 'id'>) => {
  if (toast.type === 'error' && toast.message) {
    const key = '请检查网络连接';
    const isNetwork = toast.message.includes(key);
    const sameError = toasts.value.some((t) => {
      if (t.type !== 'error' || !t.message) return false;
      if (t.message === toast.message) return true;
      if (isNetwork && t.message.includes(key)) return true;
      return false;
    });
    if (sameError) return;
  }
  const id = ++toastId;
  const newToast: Toast = {
    id,
    duration: 4000,
    ...toast,
  };
  toasts.value.push(newToast);
  setTimeout(() => {
    removeToast(id);
  }, newToast.duration);
};

const removeToast = (id: number) => {
  const index = toasts.value.findIndex(t => t.id === id);
  if (index > -1) {
    toasts.value.splice(index, 1);
  }
};

defineExpose({ addToast, removeToast });

onMounted(() => {
  window.addEventListener('toast', ((event: CustomEvent) => {
    addToast(event.detail);
  }) as EventListener);
});
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
  max-width: 320px;
  width: auto;
}

.toast {
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
  border-radius: 4px;
  pointer-events: all;
  min-height: 44px;
  padding: 0;
}

/* 左侧强调条 */
.toast-accent {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
}

.toast-body {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px 10px 16px;
  min-width: 0;
}

.toast-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toast-icon svg {
  width: 100%;
  height: 100%;
}

.toast-text {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.toast-text strong {
  font-weight: 700;
  margin-right: 6px;
}

.toast-msg {
  opacity: 0.88;
}

.toast-close {
  flex-shrink: 0;
  width: 36px;
  height: 100%;
  min-height: 44px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.15s;
  opacity: 0.6;
  padding: 0;
}

.toast-close:hover {
  opacity: 1;
}

.toast-close svg {
  width: 16px;
  height: 16px;
}

/* ===== 成功：绿色 ===== */
.toast.success {
  background: #0d3321;
  border: 1px solid #22c55e;
  color: #4ade80;
}
.toast.success .toast-accent { background: #22c55e; }
.toast.success .toast-icon { color: #4ade80; }
.toast.success .toast-close { color: #4ade80; }

/* ===== 信息：蓝色 ===== */
.toast.info {
  background: #0c2d48;
  border: 1px solid #3b82f6;
  color: #60a5fa;
}
.toast.info .toast-accent { background: #3b82f6; }
.toast.info .toast-icon { color: #60a5fa; }
.toast.info .toast-close { color: #60a5fa; }

/* ===== 警告：橙黄色 ===== */
.toast.warning {
  background: #3b2508;
  border: 1px solid #d97706;
  color: #fbbf24;
}
.toast.warning .toast-accent { background: #d97706; }
.toast.warning .toast-icon { color: #fbbf24; }
.toast.warning .toast-close { color: #fbbf24; }

/* ===== 错误：红色 ===== */
.toast.error {
  background: #3b1219;
  border: 1px solid #dc2626;
  color: #f87171;
}
.toast.error .toast-accent { background: #dc2626; }
.toast.error .toast-icon { color: #f87171; }
.toast.error .toast-close { color: #f87171; }

/* ===== 动画 ===== */
.toast-enter-active {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
}
.toast-leave-active {
  transition: transform 0.2s cubic-bezier(0.4, 0, 1, 1), opacity 0.2s ease;
}
.toast-enter-from {
  transform: translateX(100%);
  opacity: 0;
}
.toast-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
.toast-enter-to,
.toast-leave-from {
  transform: translateX(0);
  opacity: 1;
}

@media (max-width: 600px) {
  .toast-container {
    right: 8px;
    left: 8px;
    max-width: 100%;
  }
}
</style>
