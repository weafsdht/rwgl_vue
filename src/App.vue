<template>
  <n-config-provider :theme="theme" :theme-overrides="themeOverrides" :locale="zhCN" :date-locale="dateZhCN">
    <n-global-style />
    <n-message-provider>
      <n-notification-provider>
        <n-dialog-provider>
          <AppContent @theme-updated="handleThemeUpdated" />
          <Toast />
        </n-dialog-provider>
      </n-notification-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  NConfigProvider,
  NGlobalStyle,
  NMessageProvider,
  NNotificationProvider,
  NDialogProvider,
  darkTheme,
  zhCN,
  dateZhCN,
} from 'naive-ui';
import type { GlobalThemeOverrides } from 'naive-ui';
import AppContent from './components/AppContent.vue';
import Toast from './components/Toast.vue';

const isDark = ref(true);
const theme = darkTheme;

const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#00e5ff',
    primaryColorHover: '#00b8d4',
    primaryColorPressed: '#0091ea',
    primaryColorSuppl: '#00e5ff',
    bodyColor: '#0b0e14',
    cardColor: '#111621',
    modalColor: '#111621',
    popoverColor: '#161c2a',
    tableColor: '#111621',
    inputColor: '#161c2a',
    actionColor: '#161c2a',
    hoverColor: 'rgba(0, 229, 255, 0.08)',
    borderColor: '#1e2a3a',
    dividerColor: '#1e2a3a',
    textColorBase: '#e0e6f0',
    textColor1: '#e0e6f0',
    textColor2: '#c9d1d9',
    textColor3: '#7a8ba8',
    placeholderColor: '#4a5568',
    successColor: '#00e676',
    warningColor: '#ffab00',
    errorColor: '#ff1744',
    infoColor: '#00e5ff',
  },
  Card: {
    color: '#111621',
    colorModal: '#111621',
    borderColor: '#1e2a3a',
    titleTextColor: '#e0e6f0',
    textColor: '#c9d1d9',
  },
  Button: {
    textColorPrimary: '#0b0e14',
    colorPrimary: '#00e5ff',
    colorHoverPrimary: '#00b8d4',
    borderPrimary: '#00e5ff',
    borderHoverPrimary: '#00b8d4',
  },
  Input: {
    color: '#161c2a',
    colorFocus: '#161c2a',
    border: '1px solid #1e2a3a',
    borderHover: '1px solid #00e5ff',
    borderFocus: '1px solid #00e5ff',
    textColor: '#e0e6f0',
    placeholderColor: '#4a5568',
    caretColor: '#00e5ff',
  },
  Dialog: {
    color: '#111621',
    textColor: '#e0e6f0',
    titleTextColor: '#e0e6f0',
    borderColor: '#1e2a3a',
  },
  Drawer: {
    color: '#111621',
    textColor: '#e0e6f0',
    headerBorderBottom: '1px solid #1e2a3a',
    footerBorderTop: '1px solid #1e2a3a',
  },
  Tag: {
    color: '#161c2a',
    textColor: '#c9d1d9',
    border: '1px solid #1e2a3a',
  },
  Dropdown: {
    color: '#161c2a',
    optionColorHover: 'rgba(0, 229, 255, 0.08)',
    optionTextColor: '#c9d1d9',
    optionTextColorActive: '#00e5ff',
    borderColor: '#1e2a3a',
  },
  Select: {
    peers: {
      InternalSelection: {
        color: '#161c2a',
        colorActive: '#161c2a',
        border: '1px solid #1e2a3a',
        borderHover: '1px solid #00e5ff',
        borderFocus: '1px solid #00e5ff',
        borderActive: '1px solid #00e5ff',
        textColor: '#e0e6f0',
        placeholderColor: '#4a5568',
      },
    },
  },
  DataTable: {
    thColor: '#111621',
    tdColor: '#111621',
    thTextColor: '#7a8ba8',
    tdTextColor: '#c9d1d9',
    borderColor: '#1e2a3a',
    thColorHover: 'rgba(0, 229, 255, 0.04)',
    tdColorHover: 'rgba(0, 229, 255, 0.04)',
  },
};

const handleThemeUpdated = (_event: CustomEvent) => {
  isDark.value = true;
};

onMounted(() => {
  document.documentElement.setAttribute('data-theme', 'dark');
  window.addEventListener('theme-change', (() => {
    isDark.value = true;
    document.documentElement.setAttribute('data-theme', 'dark');
  }) as EventListener);
});
</script>

<style>
#app {
  height: 100%;
}
</style>
