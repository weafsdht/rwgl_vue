<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';

const emit = defineEmits<{
  'theme-updated': [event: CustomEvent];
}>();

// 监听全局 API 错误事件
const handleApiError = (event: CustomEvent) => {
  const errorMessage = event.detail.message;
  // 使用自定义 Toast 组件
  window.dispatchEvent(new CustomEvent('toast', {
    detail: {
      type: 'error',
      title: '错误',
      message: errorMessage,
    }
  }));
};

// 监听主题变更事件
const handleThemeChange = (event: CustomEvent) => {
  const isDark = event.detail.isDark;
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  // 通知 App.vue 更新主题
  emit('theme-updated', event);
};

onMounted(() => {
  // 用户信息由路由守卫在有 token 时拉取，此处仅挂全局事件
  // 监听 API 错误事件
  window.addEventListener('api-error', handleApiError as EventListener);
  // 监听主题变更事件
  window.addEventListener('theme-change', handleThemeChange as EventListener);
});

onUnmounted(() => {
  // 清理事件监听
  window.removeEventListener('api-error', handleApiError as EventListener);
  window.removeEventListener('theme-change', handleThemeChange as EventListener);
});
</script>
