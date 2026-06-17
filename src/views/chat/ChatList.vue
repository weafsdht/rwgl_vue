<template>
  <div class="chat-list-page">
    <div class="page-header">
      <h1 class="page-title">消息</h1>
      <button type="button" class="btn-secondary btn-compact" :disabled="loading" @click="loadList">刷新</button>
    </div>
    <div v-if="loading && !items.length" class="state-box">
      <div class="loader-ring"></div>
    </div>
    <div v-else-if="!items.length" class="state-box empty-state">
      <p>暂无会话</p>
      <p class="hint">在「我的好友」中与好友发起聊天</p>
    </div>
    <div v-else class="conv-list">
      <router-link
        v-for="c in items"
        :key="c.id"
        :to="{ name: 'ChatThread', params: { conversationId: String(c.id) } }"
        class="conv-row"
      >
        <div class="conv-main">
          <div class="conv-title-row">
            <span class="conv-peer">{{ peerLabel(c) }}</span>
            <span v-if="lastMessageTime(c)" class="conv-time">{{ formatShort(lastMessageTime(c)) }}</span>
          </div>
          <div class="conv-preview-row">
            <span class="conv-preview">{{ previewText(c) }}</span>
            <span v-if="unreadOf(c) > 0" class="conv-unread">{{ unreadOf(c) > 99 ? '99+' : unreadOf(c) }}</span>
            <span v-else-if="peerReadMyLastOf(c)" class="conv-read">已读</span>
          </div>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import chatApi from '@/api/chat';
import { addChatRealtimeListener } from '@/services/chatStomp';
import type { ChatConversationVO } from '@/types';
import {
  peerLabel,
  previewText,
  unreadOf,
  peerReadMyLastOf,
  lastMessageTime,
} from '@/utils/chat';
import { formatDate } from '@/utils/date';

const loading = ref(true);
const items = ref<ChatConversationVO[]>([]);
let offRt: (() => void) | null = null;

function formatShort(iso: string) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    }
    return formatDate(iso);
  } catch {
    return iso;
  }
}

async function loadList() {
  loading.value = true;
  try {
    items.value = (await chatApi.list()) ?? [];
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void loadList();
  offRt = addChatRealtimeListener(() => {
    void loadList();
  });
});

onUnmounted(() => {
  offRt?.();
  offRt = null;
});
</script>

<style scoped>
.chat-list-page {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
  max-width: 720px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
}

.page-title {
  margin: 0;
  font-size: var(--font-size-title);
  color: var(--text-primary);
}

.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  color: var(--text-tertiary);
}

.empty-state .hint {
  margin-top: 8px;
  font-size: var(--font-size-small);
}

.loader-ring {
  width: 36px;
  height: 36px;
  border: 3px solid var(--border-subtle);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.conv-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  overflow: hidden;
  background: var(--bg-secondary);
}

.conv-row {
  display: block;
  padding: 12px 14px;
  text-decoration: none;
  color: inherit;
  border-bottom: 1px solid var(--border-subtle);
  transition: background 0.15s;
}

.conv-row:last-child {
  border-bottom: none;
}

.conv-row:hover {
  background: var(--bg-tertiary);
}

.conv-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}

.conv-peer {
  font-weight: 600;
  color: var(--text-primary);
}

.conv-time {
  flex-shrink: 0;
  font-size: var(--font-size-small);
  color: var(--text-tertiary);
}

.conv-preview-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--font-size-small);
}

.conv-preview {
  flex: 1;
  min-width: 0;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conv-unread {
  flex-shrink: 0;
  min-width: 20px;
  padding: 0 6px;
  height: 20px;
  line-height: 20px;
  text-align: center;
  font-size: 12px;
  border-radius: 10px;
  background: var(--accent-primary);
  color: var(--bg-primary);
}

.conv-read {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--text-tertiary);
}
</style>
