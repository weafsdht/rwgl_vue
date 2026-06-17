<template>
  <n-modal
    :show="modelValue"
    class="verify-identity-modal"
    preset="card"
    title="需要验证您的身份"
    :bordered="false"
    style="width: 420px; max-width: 95vw"
    :mask-closable="true"
    :closable="true"
    @update:show="(v: boolean) => $emit('update:modelValue', v)"
    @after-leave="reset"
  >
    <div class="verify-identity-content">
      <p class="verify-desc">为确认是您本人操作，请进行身份验证。</p>
      <div class="verify-field">
        <n-input
          v-model:value="phoneNumber"
          placeholder="请输入手机号"
          clearable
          class="verify-input verify-input--full"
          maxlength="11"
          @keydown.enter.prevent="handleGetCode"
        />
      </div>
      <div class="verify-input-row">
        <n-input
          v-model:value="smsCode"
          placeholder="短信验证码"
          clearable
          class="verify-input"
          @keydown.enter="handleConfirm"
        />
        <button
          type="button"
          class="btn-get-code"
          :disabled="countdown > 0 || !phoneNumber.trim()"
          @click="handleGetCode"
        >
          {{ countdown > 0 ? `${countdown}s 后重试` : '获取验证码' }}
        </button>
      </div>
      <a href="javascript:void(0)" class="verify-alt-link" @click="handleOtherMethod">
        选择其他验证方式
      </a>
      <div class="verify-actions">
        <button type="button" class="btn-cancel" @click="$emit('update:modelValue', false)">
          取消
        </button>
        <button
          type="button"
          class="btn-confirm"
          :disabled="!smsCode.trim()"
          @click="handleConfirm"
        >
          确定
        </button>
      </div>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { NModal, NInput } from 'naive-ui';

const props = defineProps<{
  modelValue: boolean;
  phone?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [v: boolean];
  confirm: [code: string, phone?: string];
}>();

const phoneNumber = ref('');
const smsCode = ref('');
const countdown = ref(0);
let countdownTimer: ReturnType<typeof setInterval> | null = null;

function handleGetCode() {
  if (countdown.value > 0) return;
  countdown.value = 60;
  countdownTimer = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0 && countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
  }, 1000);
  window.dispatchEvent(new CustomEvent('toast', {
    detail: { type: 'info', title: '提示', message: '验证码已发送（演示）' },
  }));
}

function handleConfirm() {
  if (!smsCode.value.trim()) return;
  emit('confirm', smsCode.value.trim(), phoneNumber.value.trim());
  emit('update:modelValue', false);
}

function handleOtherMethod() {
  window.dispatchEvent(new CustomEvent('toast', {
    detail: { type: 'info', title: '提示', message: '其他验证方式开发中' },
  }));
}

function reset() {
  phoneNumber.value = (props.phone ?? '').trim();
  smsCode.value = '';
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  countdown.value = 0;
}

watch(() => props.modelValue, (v) => {
  if (v) phoneNumber.value = (props.phone ?? '').trim();
  if (!v) reset();
});
</script>

<style scoped>
.verify-identity-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.verify-desc {
  margin: 0;
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  line-height: 1.5;
}

.verify-field {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.verify-label {
  flex-shrink: 0;
  font-size: var(--font-size-base);
  color: var(--text-primary);
  width: 72px;
}

.verify-input--full {
  flex: 1;
}

.verify-input--full :deep(.n-input__input-el) {
  border-radius: 10px;
}

.verify-input-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 0 12px;
  border: 1px solid var(--border-medium);
  border-radius: 10px;
  background: var(--bg-secondary);
}

.verify-input {
  flex: 1;
  border: none !important;
  background: transparent !important;
}

.verify-input :deep(.n-input__input-el) {
  border: none !important;
  background: transparent !important;
}

.btn-get-code {
  flex-shrink: 0;
  padding: 8px 0;
  border: none;
  background: transparent;
  color: var(--accent-primary);
  font-size: var(--font-size-small);
  cursor: pointer;
  white-space: nowrap;
}

.btn-get-code:hover:not(:disabled) {
  opacity: 0.8;
}

.btn-get-code:disabled {
  color: var(--text-tertiary);
  cursor: not-allowed;
}

.verify-alt-link {
  font-size: var(--font-size-small);
  color: var(--accent-primary);
  text-decoration: none;
  align-self: flex-start;
}

.verify-alt-link:hover {
  text-decoration: underline;
}

.verify-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: flex-end;
  padding-top: var(--spacing-sm);
}

.btn-cancel {
  padding: 10px 24px;
  border-radius: 10px;
  border: 1px solid var(--border-medium);
  background: var(--bg-tertiary);
  color: var(--accent-primary);
  font-size: var(--font-size-base);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel:hover {
  background: var(--bg-secondary);
}

.btn-confirm {
  padding: 10px 24px;
  border-radius: 10px;
  border: none;
  background: var(--accent-primary);
  color: #fff;
  font-size: var(--font-size-base);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-confirm:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-confirm:disabled {
  background: var(--bg-tertiary);
  color: var(--text-tertiary);
  cursor: not-allowed;
}
</style>
