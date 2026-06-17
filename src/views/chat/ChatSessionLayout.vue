<template>
  <div class="chat-session">
    <ChatSidebar class="chat-session__sider" />
    <div class="chat-session__main">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import ChatSidebar from './ChatSidebar.vue';
</script>

<style scoped>
.chat-session {
  display: flex;
  flex: 1;
  min-height: 0;
  height: 100%;
  width: 100%;
  max-width: none;
  margin: 0;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--bg-secondary);
  box-shadow: var(--shadow-soft);
}

.chat-session__sider {
  width: clamp(240px, 30vw, 320px);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-right: 1px solid var(--border-subtle);
  background: var(--bg-secondary);
}

.chat-session__main {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
}
</style>
