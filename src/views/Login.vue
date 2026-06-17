<template>
  <div class="login-container">
    <!-- 左侧插画区域：使用插画图（二）作为背景 -->
    <div class="login-hero">
      <div class="login-hero-inner"></div>
    </div>

    <!-- 右侧登录卡片 -->
    <div class="login-card auth-card">
      <h1 class="title">TaskFlow</h1>

      <n-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        @submit.prevent="handleSubmit"
      >
        <n-form-item path="email">
          <div class="input-wrapper">
            <label class="input-label">邮箱或用户名</label>
            <n-input
              v-model:value="formData.email"
              :stateful="false"
              :readonly="loginEmailReadonly"
              placeholder="请输入邮箱或用户名"
              size="medium"
              :input-props="loginEmailInputProps"
              class="input-field-custom"
              @focus="unlockLoginEmail"
              @mousedown="unlockLoginEmail"
              @keyup.enter="handleSubmit"
            />
          </div>
        </n-form-item>

        <n-form-item path="password">
          <div class="input-wrapper">
            <label class="input-label">密码</label>
            <n-input
              v-model:value="formData.password"
              :stateful="false"
              :readonly="loginPasswordReadonly"
              type="password"
              placeholder="请输入密码"
              size="medium"
              show-password-on="click"
              :input-props="loginPasswordInputProps"
              class="input-field-custom"
              @focus="unlockLoginPassword"
              @mousedown="unlockLoginPassword"
              @keyup.enter="handleSubmit"
            />
          </div>
        </n-form-item>

        <n-form-item>
          <button
            class="btn-primary btn-block"
            type="button"
            :disabled="loading"
            @click="handleSubmit"
          >
            <span v-if="!loading">登录</span>
            <span v-else class="loading-spinner"></span>
          </button>
        </n-form-item>
      </n-form>

      <div class="footer">
        <button type="button" class="btn-text" @click="$router.push('/register')">
          还没有账号？立即注册
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { NForm, NFormItem, NInput } from 'naive-ui';
import '@/styles/auth-form.css';
import { useUserStore } from '@/stores/user';
import { formatErrorMessage } from '@/utils/errorHandler';
import type { FormInst } from 'naive-ui';

const router = useRouter();
const userStore = useUserStore();

const formRef = ref<FormInst | null>(null);
const loading = ref(false);

const formData = ref({
  email: '',
  password: '',
});

/** 避免刷新页面时浏览器自动填入已存账号密码；点击/聚焦后再输入 */
const loginEmailReadonly = ref(true);
const loginPasswordReadonly = ref(true);

const loginEmailInputProps = {
  autocomplete: 'username',
  name: 'login-account',
  id: 'login-field-account',
  'data-1p-ignore': 'true',
  'data-lpignore': 'true',
} as const;

const loginPasswordInputProps = {
  autocomplete: 'current-password',
  name: 'login-password',
  id: 'login-field-password',
  'data-1p-ignore': 'true',
  'data-lpignore': 'true',
} as const;

function unlockLoginEmail() {
  loginEmailReadonly.value = false;
}

function unlockLoginPassword() {
  loginPasswordReadonly.value = false;
}

onMounted(() => {
  loginEmailReadonly.value = true;
  loginPasswordReadonly.value = true;
});

const rules = {
  email: {
    required: true,
    message: '请输入邮箱或用户名',
    trigger: 'blur',
  },
  password: {
    required: true,
    message: '请输入密码',
    trigger: 'blur',
  },
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  
  await formRef.value.validate(async (errors) => {
    if (!errors) {
      loading.value = true;
      try {
        await userStore.login(formData.value.email, formData.value.password);
        window.dispatchEvent(new CustomEvent('toast', {
          detail: {
            type: 'success',
            title: '登录成功',
            message: '欢迎回来！',
          }
        }));
        router.push('/');
      } catch (error: unknown) {
        window.dispatchEvent(new CustomEvent('toast', {
          detail: {
            type: 'error',
            title: '登录失败',
            message: formatErrorMessage(error) || '请检查用户名和密码',
          }
        }));
      } finally {
        loading.value = false;
      }
    }
  });
};
</script>

<style scoped>
.login-container {
  display: flex;
  min-height: 100vh;
  justify-content: center;
  align-items: center;
  background: var(--bg-primary);
  position: relative;
  overflow: hidden;
}

.login-container::before {
  content: '';
  position: absolute;
  top: -40%;
  left: -20%;
  width: 60%;
  height: 120%;
  background: radial-gradient(ellipse, rgba(0, 229, 255, 0.06) 0%, transparent 70%);
  pointer-events: none;
}

.login-container::after {
  content: '';
  position: absolute;
  bottom: -30%;
  right: -15%;
  width: 50%;
  height: 100%;
  background: radial-gradient(ellipse, rgba(255, 64, 129, 0.04) 0%, transparent 70%);
  pointer-events: none;
}

.login-hero {
  display: none;
}

.login-hero-inner {
  width: 100%;
  max-width: 540px;
  aspect-ratio: 16 / 9;
  border-radius: 32px;
  position: relative;
  overflow: hidden;
}

.login-hero-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
}

.logo-circle {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  background: linear-gradient(135deg, #0ea5e9, #6366f1);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 18px;
}

.logo-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.logo-title {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
}

.logo-subtitle {
  font-size: 12px;
  color: #64748b;
}

.login-hero-illustration {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 24px;
  padding: 20px 20px 18px;
  position: relative;
  overflow: hidden;
}

.ill-progress {
  margin-bottom: 18px;
}

.ill-progress-bar {
  width: 100%;
  height: 10px;
  border-radius: 999px;
  background: #e2e8f0;
  overflow: hidden;
}

.ill-progress-fill {
  width: 60%;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #38bdf8, #6366f1);
}

.ill-people-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 16px;
}

.ill-person {
  width: 46px;
  height: 46px;
  border-radius: 18px;
  background: #e5e7eb;
  position: relative;
}

.ill-person::before {
  content: '';
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%);
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: #fee2e2;
}

.ill-person--purple { background: #ede9fe; }
.ill-person--orange { background: #ffedd5; }
.ill-person--green { background: #dcfce7; }
.ill-person--blue { background: #dbeafe; }

.ill-card {
  position: absolute;
  border-radius: 14px;
  background: #f8fafc;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
}

.ill-card--left {
  width: 120px;
  height: 64px;
  bottom: 12px;
  left: 16px;
}

.ill-card--right {
  width: 110px;
  height: 54px;
  bottom: 20px;
  right: 18px;
}

.login-hero-copy {
  margin-top: 22px;
  max-width: 360px;
}

.login-hero-copy h2 {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 600;
  color: #0f172a;
}

.login-hero-copy p {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: #475569;
}

.login-card {
  width: 420px;
  padding: var(--spacing-xl);
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.4);
  border: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  z-index: 1;
}
.login-card .title { margin-bottom: var(--spacing-xs); }
.login-card .footer { margin-top: var(--spacing-lg); }

.subtitle {
  text-align: center;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xl);
  font-size: var(--font-size-base);
}

.btn-primary.loading {
  pointer-events: none;
}
.input-wrapper {
  width: 100%;
}

@media (max-width: 900px) {
  .login-container {
    padding: var(--spacing-md);
  }

  .login-card {
    width: 100%;
    max-width: 420px;
  }
}
</style>
