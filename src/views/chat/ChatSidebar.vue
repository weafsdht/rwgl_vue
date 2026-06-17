<template>
  <div class="chat-sider">
    <div class="chat-sider__head">
      <h1 class="chat-sider__title">消息</h1>
      <button type="button" class="btn-secondary btn-compact" :disabled="loading" @click="loadList">
        刷新
      </button>
    </div>

    <div class="chat-sider__tabs" role="tablist">
      <button
        type="button"
        class="chat-tab"
        :class="{ 'chat-tab--active': filterTab === 'all' }"
        role="tab"
        :aria-selected="filterTab === 'all'"
        @click="filterTab = 'all'"
      >
        全部
      </button>
      <button
        type="button"
        class="chat-tab"
        :class="{ 'chat-tab--active': filterTab === 'unread' }"
        role="tab"
        :aria-selected="filterTab === 'unread'"
        @click="filterTab = 'unread'"
      >
        未读
      </button>
    </div>

    <div v-if="loading && !items.length" class="chat-sider__state">
      <div class="loader-ring"></div>
    </div>
    <div v-else-if="!items.length" class="chat-sider__state chat-sider__state--empty">
      <p>暂无会话</p>
      <p class="hint">在「我的好友」中与好友发起聊天</p>
    </div>
    <div v-else-if="!filteredItems.length" class="chat-sider__state chat-sider__state--empty">
      <p>暂无未读</p>
    </div>
    <div v-else class="chat-sider__list">
      <router-link
        v-for="c in filteredItems"
        :key="c.id"
        :to="{ name: 'ChatThread', params: { conversationId: String(c.id) } }"
        class="conv-row"
        :class="{ 'conv-row--active': isActive(c.id) }"
      >
        <div class="conv-avatar" aria-hidden="true">
          <AvatarImage
            v-if="avatarPathOf(c)"
            :path="avatarPathOf(c)"
            :initial="initialOf(c)"
            root-class="conv-avatar-img"
          />
          <span v-else class="conv-avatar-fallback">{{ initialOf(c) }}</span>
        </div>
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
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import chatApi from '@/api/chat';
import { addChatRealtimeListener } from '@/services/chatStomp';
import type { ChatConversationVO } from '@/types';
import { pickAvatarFromPayload } from '@/utils/user';
import {
  peerLabel,
  previewText,
  unreadOf,
  peerReadMyLastOf,
  lastMessageTime,
} from '@/utils/chat';
import { formatDate } from '@/utils/date';
import AvatarImage from '@/components/AvatarImage.vue';

const route = useRoute();
const loading = ref(true);
const items = ref<ChatConversationVO[]>([]);
const filterTab = ref<'all' | 'unread'>('all');
let offRt: (() => void) | null = null;

const filteredItems = computed(() => {
  if (filterTab.value === 'unread') {
    return items.value.filter((c) => unreadOf(c) > 0);
  }
  return items.value;
});

function avatarPathOf(c: ChatConversationVO): string {
  const p = c.peer;
  if (!p || typeof p !== 'object') return '';
  return pickAvatarFromPayload(p as unknown as Record<string, unknown>) || '';
}

function initialOf(c: ChatConversationVO): string {
  const t = peerLabel(c).trim();
  return t ? t[0]! : '?';
}

function isActive(id: number): boolean {
  const p = route.params.conversationId;
  return p != null && String(p) === String(id);
}

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
.chat-sider {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
}

.chat-sider__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  flex-shrink: 0;
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--border-subtle);
}

.chat-sider__title {
  margin: 0;
  font-size: var(--font-size-title);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.chat-sider__tabs {
  display: flex;
  flex-shrink: 0;
  padding: 0 var(--spacing-md);
  gap: 4px;
  border-bottom: 1px solid var(--border-subtle);
}

.chat-tab {
  flex: 1;
  padding: 10px 8px;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  background: transparent;
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}

.chat-tab:hover {
  color: var(--text-primary);
}

.chat-tab--active {
  color: var(--accent-primary);
  border-bottom-color: var(--accent-primary);
}

.chat-sider__state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg);
  color: var(--text-tertiary);
  font-size: var(--font-size-small);
  min-height: 120px;
}

.chat-sider__state--empty .hint {
  margin-top: 8px;
  font-size: var(--font-size-caption);
  color: var(--text-tertiary);
}

.loader-ring {
  width: 32px;
  height: 32px;
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

.chat-sider__list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.conv-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px var(--spacing-md);
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

.conv-row--active {
  background: rgba(0, 229, 255, 0.08);
  box-shadow: inset 3px 0 0 var(--accent-primary);
}

.conv-avatar {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  overflow: hidden;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
}

.conv-avatar :deep(.conv-avatar-img) {
  width: 44px;
  height: 44px;
  border-radius: 10px;
}

.conv-avatar :deep(.avatar-image-root img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.conv-avatar :deep(.avatar-image-fallback) {
  font-size: 16px;
  font-weight: 600;
  color: var(--accent-primary);
}

.conv-avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 16px;
  font-weight: 600;
  color: var(--accent-primary);
  background: rgba(0, 229, 255, 0.06);
}

.conv-main {
  flex: 1;
  min-width: 0;
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
  font-size: var(--font-size-small);
  color: var(--text-primary);
}

.conv-time {
  flex-shrink: 0;
  font-size: var(--font-size-caption);
  color: var(--text-tertiary);
}

.conv-preview-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--font-size-caption);
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
  min-width: 18px;
  padding: 0 5px;
  height: 18px;
  line-height: 18px;
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  border-radius: 9px;
  background: var(--accent-primary);
  color: var(--primary-foreground, #0b0e14);
}

.conv-read {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--text-tertiary);
}
</style>
