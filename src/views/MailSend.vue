<template>
  <div class="mail-send-page">
    <div class="page-header">
      <h1 class="page-title">发送邮件</h1>
      <p class="page-desc">
        使用临时 SMTP 连接发送，授权码仅用于本次请求，不会保存在服务器。收件人留空表示向系统内所有已绑定邮箱的用户发送（发件邮箱会排除）。
      </p>
    </div>

    <div class="mail-sections">
      <!-- SMTP -->
      <section class="mail-section">
        <h2 class="mail-section-title">SMTP</h2>
        <div class="mail-grid">
          <div class="mail-field mail-field--wide">
            <label class="mail-label">服务器地址 <span class="req">*</span></label>
            <n-input
              v-model:value="form.smtpHost"
              placeholder="如 smtp.qq.com"
              clearable
            />
          </div>
          <div class="mail-field">
            <label class="mail-label">端口</label>
            <n-input-number
              v-model:value="form.smtpPort"
              :min="1"
              :max="65535"
              :show-button="false"
              placeholder="465"
              class="mail-input-number"
            />
            <span class="mail-hint">默认 465；TLS 常用 587</span>
          </div>
          <div class="mail-field mail-field--wide">
            <label class="mail-label">发件邮箱 <span class="req">*</span></label>
            <n-input
              v-model:value="form.fromEmail"
              placeholder="发件人邮箱"
              clearable
              autocomplete="off"
            />
          </div>
          <div class="mail-field mail-field--wide">
            <label class="mail-label">SMTP 授权码 <span class="req">*</span></label>
            <n-input
              v-model:value="form.fromPassword"
              type="password"
              placeholder="非登录密码"
              show-password-on="click"
              autocomplete="new-password"
            />
          </div>
          <div class="mail-field mail-field--row">
            <label class="mail-label">SSL</label>
            <n-switch v-model:value="form.ssl" />
            <span class="mail-hint">关闭后走 STARTTLS（视端口而定）</span>
          </div>
        </div>
      </section>

      <!-- 收件人 -->
      <section class="mail-section">
        <h2 class="mail-section-title">收件人</h2>
        <p class="mail-section-tip">输入邮箱后回车添加；留空表示全员广播</p>
        <n-dynamic-tags v-model:value="form.toEmails" />
      </section>

      <!-- 内容 -->
      <section class="mail-section">
        <h2 class="mail-section-title">内容</h2>
        <div class="mail-grid">
          <div class="mail-field mail-field--wide">
            <label class="mail-label">主题 <span class="req">*</span></label>
            <n-input v-model:value="form.subject" placeholder="邮件主题" clearable />
          </div>
          <div class="mail-field mail-field--wide">
            <label class="mail-label">正文 <span class="req">*</span></label>
            <n-input
              v-model:value="form.content"
              type="textarea"
              placeholder="支持纯文本或 HTML（下方开启「HTML」时）"
              :autosize="{ minRows: 8, maxRows: 24 }"
            />
          </div>
          <div class="mail-field mail-field--row">
            <label class="mail-label">HTML 邮件</label>
            <n-switch v-model:value="form.html" />
            <span class="mail-hint">开启则按 HTML 解析正文</span>
          </div>
        </div>
      </section>

      <div class="mail-actions">
        <button type="button" class="btn-send" :disabled="submitting" @click="handleSubmit">
          <span v-if="!submitting">发送</span>
          <span v-else class="loading-spinner" />
        </button>
      </div>
    </div>

    <!-- 结果 -->
    <section v-if="lastResult" class="mail-result">
      <h2 class="mail-result-title">发送结果</h2>
      <div class="mail-result-stats">
        <span>计划收件：<strong>{{ lastResult.totalRecipients }}</strong></span>
        <span class="ok">成功：<strong>{{ lastResult.successCount }}</strong></span>
        <span class="fail">失败：<strong>{{ lastResult.failCount }}</strong></span>
      </div>
      <div v-if="lastResult.failedEmails?.length" class="mail-result-failures">
        <p class="mail-result-fail-title">失败地址</p>
        <ul>
          <li v-for="(e, i) in lastResult.failedEmails" :key="i">{{ e }}</li>
        </ul>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { NInput, NInputNumber, NSwitch, NDynamicTags } from 'naive-ui';
import mailApi, { type SendMailRequest, type SendMailResponse } from '@/api/mail';
import '../styles/components.css';

const form = ref({
  smtpHost: '',
  smtpPort: null as number | null,
  fromEmail: '',
  fromPassword: '',
  ssl: true,
  toEmails: [] as string[],
  subject: '',
  content: '',
  html: true,
});

const submitting = ref(false);
const lastResult = ref<SendMailResponse | null>(null);

function buildPayload(): SendMailRequest {
  const port = form.value.smtpPort;
  const toFiltered = (form.value.toEmails ?? []).map((e) => e.trim()).filter(Boolean);
  const body: SendMailRequest = {
    smtpHost: form.value.smtpHost.trim(),
    fromEmail: form.value.fromEmail.trim(),
    fromPassword: form.value.fromPassword,
    subject: form.value.subject.trim(),
    content: form.value.content,
    ssl: form.value.ssl,
    html: form.value.html,
  };
  if (port != null && port > 0) {
    body.smtpPort = port;
  }
  if (toFiltered.length) {
    body.toEmails = toFiltered;
  }
  return body;
}

async function handleSubmit() {
  if (!form.value.smtpHost.trim() || !form.value.fromEmail.trim() || !form.value.fromPassword) {
    window.dispatchEvent(
      new CustomEvent('toast', { detail: { type: 'error', title: '提示', message: '请填写 SMTP 服务器、发件邮箱与授权码' } })
    );
    return;
  }
  if (!form.value.subject.trim() || !form.value.content.trim()) {
    window.dispatchEvent(
      new CustomEvent('toast', { detail: { type: 'error', title: '提示', message: '请填写主题与正文' } })
    );
    return;
  }
  submitting.value = true;
  lastResult.value = null;
  try {
    const data = await mailApi.sendMail(buildPayload());
    lastResult.value = data;
    window.dispatchEvent(
      new CustomEvent('toast', {
        detail: {
          type: data.failCount > 0 ? 'warning' : 'success',
          title: '已发送',
          message: `成功 ${data.successCount}，失败 ${data.failCount}`,
        },
      })
    );
  } catch (e: unknown) {
    window.dispatchEvent(
      new CustomEvent('toast', {
        detail: { type: 'error', title: '发送失败', message: (e as Error)?.message ?? '请稍后重试' },
      })
    );
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.mail-send-page {
  padding: 0;
  max-width: 880px;
}

.page-header {
  margin-bottom: var(--spacing-lg);
}

.page-title {
  margin: 0 0 var(--spacing-xs);
  font-size: var(--font-size-h1);
  font-weight: 700;
  color: var(--text-primary);
}

.page-desc {
  margin: 0;
  font-size: var(--font-size-small);
  color: var(--text-tertiary);
  line-height: 1.6;
}

.mail-sections {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.mail-section {
  padding: var(--spacing-lg);
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
}

.mail-section-title {
  margin: 0 0 var(--spacing-md);
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-primary);
}

.mail-section-tip {
  margin: 0 0 var(--spacing-sm);
  font-size: var(--font-size-small);
  color: var(--text-tertiary);
}

.mail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
}

@media (max-width: 700px) {
  .mail-grid {
    grid-template-columns: 1fr;
  }
}

.mail-field--wide {
  grid-column: 1 / -1;
}

.mail-field--row {
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-sm);
}

.mail-label {
  display: block;
  margin-bottom: 6px;
  font-size: var(--font-size-small);
  color: var(--text-secondary);
}

.req {
  color: var(--error-color, #f87171);
}

.mail-hint {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.mail-field--row .mail-hint {
  display: inline;
  margin-top: 0;
  margin-left: 4px;
}

.mail-input-number {
  width: 160px;
}

.mail-actions {
  padding-top: var(--spacing-sm);
}

.btn-send {
  padding: 10px 28px;
  border-radius: var(--radius-md);
  border: none;
  background: var(--accent-primary, #00e5ff);
  color: var(--primary-foreground, #0b0e14);
  font-size: var(--font-size-base);
  font-weight: 600;
  cursor: pointer;
  min-width: 120px;
}

.btn-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-spinner {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid rgba(0, 0, 0, 0.2);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.mail-result {
  margin-top: var(--spacing-xl);
  padding: var(--spacing-lg);
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
}

.mail-result-title {
  margin: 0 0 var(--spacing-md);
  font-size: var(--font-size-lg);
  font-weight: 600;
}

.mail-result-stats {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-lg);
  font-size: var(--font-size-base);
  color: var(--text-secondary);
}

.mail-result-stats .ok {
  color: #4ade80;
}

.mail-result-stats .fail {
  color: #f87171;
}

.mail-result-failures {
  margin-top: var(--spacing-md);
}

.mail-result-fail-title {
  margin: 0 0 var(--spacing-xs);
  font-size: var(--font-size-small);
  color: var(--text-tertiary);
}

.mail-result-failures ul {
  margin: 0;
  padding-left: 1.25rem;
  color: var(--text-secondary);
  font-size: var(--font-size-small);
}
</style>
