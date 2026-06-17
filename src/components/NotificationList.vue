<template>
  <div class="notification-page">
    <!-- Tab 栏 + 操作区 -->
    <div class="tab-bar">
      <div class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>
      <div class="tab-actions">
        <button
          type="button"
          class="action-btn mark-all-btn"
          :disabled="isMarkingAllRead || !hasUnread"
          @click="handleMarkAllRead"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {{ isMarkingAllRead ? '处理中...' : '一键标记已读' }}
        </button>
        <button type="button" class="action-btn refresh-btn" title="刷新" @click="handleRefresh">
          <svg :class="{ spinning: isRefreshing }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 内容区 -->
    <div class="notification-body">
      <div v-if="loading" class="state-box">
        <div class="loader-ring"></div>
      </div>
      <div v-else-if="filteredNotifications.length === 0" class="state-box empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        <p>{{ emptyText }}</p>
      </div>
      <div v-else class="notification-list">
        <div
          v-for="n in filteredNotifications"
          :key="n.id"
          class="notification-item"
          :class="{ unread: !n.read }"
          @click="handleNotificationClick(n)"
        >
          <div class="item-main">
            <div class="item-title">{{ n.title }}</div>
            <div class="item-content">{{ n.content }}</div>
          </div>
          <div class="item-right">
            <span v-if="!n.read" class="unread-badge">未读</span>
            <span v-else class="read-badge">已读</span>
            <span class="item-time">{{ formatDate(n.createdAt || n.updatedAt) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import '../styles/components.css';
import { useNotifications } from '@/composables/useNotifications';
import { formatDate } from '@/utils/date';
import type { Notification } from '@/types';

type TabKey = 'unread' | 'read' | 'all';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'unread', label: '未读' },
  { key: 'read', label: '已读' },
  { key: 'all', label: '全部' },
];

const activeTab = ref<TabKey>('unread');
const router = useRouter();

const {
  notifications,
  unreadNotifications,
  readNotifications,
  loading,
  fetchNotifications,
  markAsRead,
  markAllAsRead,
} = useNotifications();

function isFriendRequestNav(n: Notification): boolean {
  if (n.relatedId == null) return false;
  return n.relatedType === 'friend_request' || n.type === 'friend_request';
}

async function handleNotificationClick(n: Notification) {
  if (!n.read) {
    await markAsRead(n.id);
  }
  if (isFriendRequestNav(n) && n.relatedId != null) {
    await router.push({
      name: 'Friends',
      query: { tab: 'incoming', highlight: String(n.relatedId) },
    });
    window.dispatchEvent(new CustomEvent('close-notification-drawer'));
  }
}

const isMarkingAllRead = ref(false);
const isRefreshing = ref(false);
const hasUnread = computed(() => unreadNotifications.value.length > 0);

const filteredNotifications = computed(() => {
  if (activeTab.value === 'unread') return unreadNotifications.value;
  if (activeTab.value === 'read') return readNotifications.value;
  return notifications.value;
});

const emptyText = computed(() => {
  if (activeTab.value === 'unread') return '没有未读消息';
  if (activeTab.value === 'read') return '没有已读消息';
  return '暂无消息';
});

async function handleMarkAllRead() {
  if (isMarkingAllRead.value) return;
  if (!hasUnread.value) {
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'info', title: '提示', message: '没有未读消息' },
    }));
    return;
  }
  isMarkingAllRead.value = true;
  try {
    await markAllAsRead();
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'success', title: '操作成功', message: '所有通知已标记为已读' },
    }));
  } catch (err: unknown) {
    const message = (err as Error)?.message ?? '操作失败，请稍后重试';
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'error', title: '标记失败', message },
    }));
  }
  isMarkingAllRead.value = false;
}

async function handleRefresh() {
  if (isRefreshing.value) return;
  isRefreshing.value = true;
  try {
    await fetchNotifications();
  } finally {
    isRefreshing.value = false;
  }
}
</script>

<style scoped>
@import '../styles/components.css';

.notification-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-primary);
}

/* Tab 栏 */
.tab-bar {
  display: flex;
  align-items: center;
  padding: 12px 16px 0;
  gap: 8px;
  overflow: hidden;
}

.tabs {
  display: flex;
  gap: 0;
  border-bottom: 2px solid transparent;
  flex-shrink: 0;
}

.tab-btn {
  position: relative;
  background: none;
  border: none;
  padding: 8px 14px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: color 0.2s;
  white-space: nowrap;
}

.tab-btn:hover {
  color: var(--text-primary);
}

.tab-btn.active {
  color: #2563eb;
  font-weight: 600;
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 10px;
  right: 10px;
  height: 2px;
  background: #2563eb;
  border-radius: 1px;
}

[data-theme="dark"] .tab-btn.active {
  color: #60a5fa;
}

[data-theme="dark"] .tab-btn.active::after {
  background: #60a5fa;
}

/* 操作按钮 */
.tab-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  flex-shrink: 0;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 6px;
  transition: all 0.15s;
  white-space: nowrap;
}

.action-btn:hover:not(:disabled) {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.mark-all-btn svg {
  color: #22c55e;
}

.refresh-btn {
  padding: 6px;
}

.spinning {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 内容区 */
.notification-body {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px 16px;
}

.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 260px;
  color: var(--text-tertiary);
}

.empty-state svg {
  opacity: 0.35;
  margin-bottom: 12px;
}

.empty-state p {
  font-size: 14px;
  color: var(--text-tertiary);
}

/* 通知列表 */
.notification-list {
  display: flex;
  flex-direction: column;
  margin-top: 4px;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 16px;
  border-bottom: 1px solid var(--border-subtle);
  cursor: pointer;
  transition: background 0.15s;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item:hover {
  background: var(--bg-secondary);
}

.notification-item.unread {
  background: rgba(255, 251, 235, 0.6);
}

[data-theme="dark"] .notification-item.unread {
  background: rgba(234, 179, 8, 0.06);
}

.notification-item.unread:hover {
  background: rgba(255, 251, 235, 0.9);
}

[data-theme="dark"] .notification-item.unread:hover {
  background: rgba(234, 179, 8, 0.1);
}

/* 主内容 */
.item-main {
  flex: 1;
  min-width: 0;
}

.item-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.5;
  margin-bottom: 4px;
}

.item-content {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* 右侧：徽标 + 时间 */
.item-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex-shrink: 0;
  padding-top: 2px;
}

.unread-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 4px;
  background: #fff7ed;
  border: 1px solid #fdba74;
  color: #ea580c;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

[data-theme="dark"] .unread-badge {
  background: rgba(234, 88, 12, 0.15);
  border-color: rgba(234, 88, 12, 0.4);
  color: #fb923c;
}

.read-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 4px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  color: var(--text-tertiary);
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.item-time {
  font-size: 12px;
  color: var(--text-tertiary);
  white-space: nowrap;
}
</style>
