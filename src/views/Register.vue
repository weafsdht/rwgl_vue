<template>
  <div class="register-container">
    <div class="register-card auth-card">
      <h1 class="title">注册账号</h1>
      
      <n-form
        ref="formRef"
        class="register-form"
        :model="formData"
        :rules="rules"
        @submit.prevent="handleSubmit"
      >
        <n-form-item>
          <div class="input-wrapper">
            <label class="input-label">用户名</label>
            <n-input
              v-model:value="formData.nickname"
              :stateful="false"
              :readonly="registerNicknameReadonly"
              placeholder="请输入用户名"
              size="medium"
              :input-props="registerNicknameInputProps"
              class="input-field-custom"
              @focus="unlockRegisterNickname"
              @mousedown="unlockRegisterNickname"
            />
          </div>
        </n-form-item>

        <n-form-item path="email">
          <div class="input-wrapper">
            <label class="input-label">邮箱</label>
            <n-input
              v-model:value="formData.email"
              :stateful="false"
              placeholder="请输入邮箱"
              size="medium"
              :input-props="registerEmailInputProps"
              class="input-field-custom"
            />
          </div>
        </n-form-item>

        <n-form-item path="password">
          <div class="input-wrapper">
            <label class="input-label">密码</label>
            <n-input
              v-model:value="formData.password"
              :stateful="false"
              :readonly="registerPasswordReadonly"
              type="password"
              placeholder="请输入密码"
              size="medium"
              show-password-on="click"
              :input-props="registerPasswordInputProps"
              class="input-field-custom"
              @focus="unlockRegisterPassword"
              @mousedown="unlockRegisterPassword"
            />
          </div>
        </n-form-item>

        <n-form-item path="confirmPassword">
          <div class="input-wrapper">
            <label class="input-label">确认密码</label>
            <n-input
              v-model:value="formData.confirmPassword"
              :stateful="false"
              :readonly="registerConfirmPasswordReadonly"
              type="password"
              placeholder="请再次输入密码"
              size="medium"
              show-password-on="click"
              :input-props="registerConfirmPasswordInputProps"
              class="input-field-custom"
              @focus="unlockRegisterConfirmPassword"
              @mousedown="unlockRegisterConfirmPassword"
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
            <span v-if="!loading">注册</span>
            <span v-else class="loading-spinner"></span>
          </button>
        </n-form-item>
      </n-form>

      <div class="footer">
        <button type="button" class="btn-text" @click="$router.push('/login')">
          已有账号？立即登录
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { NForm, NFormItem, NInput } from 'naive-ui';
import '../styles/components.css';
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
  nickname: '',
  password: '',
  confirmPassword: '',
});

/** 防止浏览器把注册页当成登录框自动填入账号/密码（昵称勿用 username 语义） */
const registerNicknameReadonly = ref(true);
const registerPasswordReadonly = ref(true);
const registerConfirmPasswordReadonly = ref(true);

const registerNicknameInputProps = {
  autocomplete: 'off',
  name: 'register-nickname',
  id: 'register-field-nickname',
  'data-1p-ignore': 'true',
  'data-lpignore': 'true',
  'data-form-type': 'other',
} as const;

const registerEmailInputProps = {
  autocomplete: 'email',
  name: 'register-email',
  id: 'register-field-email',
  'data-1p-ignore': 'true',
  'data-lpignore': 'true',
} as const;

const registerPasswordInputProps = {
  autocomplete: 'new-password',
  name: 'register-password',
  id: 'register-field-password',
  'data-1p-ignore': 'true',
  'data-lpignore': 'true',
  'data-form-type': 'other',
} as const;

const registerConfirmPasswordInputProps = {
  autocomplete: 'new-password',
  name: 'register-password-confirm',
  id: 'register-field-password-confirm',
  'data-1p-ignore': 'true',
  'data-lpignore': 'true',
  'data-form-type': 'other',
} as const;

function unlockRegisterNickname() {
  registerNicknameReadonly.value = false;
}
function unlockRegisterPassword() {
  registerPasswordReadonly.value = false;
}
function unlockRegisterConfirmPassword() {
  registerConfirmPasswordReadonly.value = false;
}

onMounted(() => {
  registerNicknameReadonly.value = true;
  registerPasswordReadonly.value = true;
  registerConfirmPasswordReadonly.value = true;
});

const validatePassword = (_rule: any, value: string) => {
  if (!value) {
    return new Error('请输入密码');
  }
  if (value.length < 6) {
    return new Error('密码长度至少6位');
  }
  return true;
};

const validateConfirmPassword = (_rule: any, value: string) => {
  if (!value) {
    return new Error('请确认密码');
  }
  if (value !== formData.value.password) {
    return new Error('两次密码输入不一致');
  }
  return true;
};

const rules = {
  email: {
    required: true,
    message: '请输入正确的邮箱地址',
    trigger: 'blur',
    validator: (_rule: any, value: string) => {
      if (!value) {
        return new Error('请输入邮箱地址');
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return new Error('请输入正确的邮箱地址');
      }
      return true;
    },
  },
  password: {
    required: true,
    validator: validatePassword,
    trigger: 'blur',
  },
  confirmPassword: {
    required: true,
    validator: validateConfirmPassword,
    trigger: 'blur',
  },
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  
  await formRef.value.validate(async (errors) => {
    if (!errors) {
      loading.value = true;
      try {
        await userStore.register({
          email: formData.value.email,
          password: formData.value.password,
          nickname: formData.value.nickname?.trim() || undefined,
        });
        window.dispatchEvent(new CustomEvent('toast', {
          detail: {
            type: 'success',
            title: '注册成功',
            message: '欢迎加入 TaskFlow！',
          }
        }));
        router.push('/');
      } catch (error: unknown) {
        window.dispatchEvent(new CustomEvent('toast', {
          detail: {
            type: 'error',
            title: '注册失败',
            message: formatErrorMessage(error) || '请检查输入信息',
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
@import '../styles/components.css';

.register-container {
  display: flex;
  min-height: 100vh;
  justify-content: center;
  align-items: center;
  background: var(--bg-primary);
  position: relative;
  overflow: hidden;
}

.register-container::before {
  content: '';
  position: absolute;
  top: -40%;
  right: -20%;
  width: 60%;
  height: 120%;
  background: radial-gradient(ellipse, rgba(0, 229, 255, 0.06) 0%, transparent 70%);
  pointer-events: none;
}

.register-card {
  width: 420px;
  padding: 24px 32px;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.4);
  border: 1px solid var(--border-subtle);
  position: relative;
  z-index: 1;
}
.register-card .title { margin-bottom: 0; }
.register-card .footer {
  margin-top: 8px;
  margin-bottom: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.btn-primary.loading {
  pointer-events: none;
}

/* 表单项间距：紧凑 */
:deep(.n-form) { gap: 0; }
:deep(.n-form-item) {
  margin-top: -12px;
  margin-bottom: -12px;
  padding-top: 0;
  padding-bottom: 0;
}
.input-wrapper {
  width: 100%;
}

@media (max-width: 900px) {
  .register-container {
    padding: var(--spacing-md);
  }

  .register-card {
    width: 100%;
    max-width: 420px;
  }
}
</style>
