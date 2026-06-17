import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import notificationApi from '@/api/notification';
import { useUserStore } from '@/stores/user';
import type { Notification } from '@/types';

const READ_IDS_KEY = 'taskflow_read_notification_ids';

function loadLocalReadIds(): Set<number> {
  try {
    const raw = localStorage.getItem(READ_IDS_KEY);
    if (raw) return new Set(JSON.parse(raw) as number[]);
  } catch { /* ignore */ }
  return new Set();
}

function saveLocalReadIds(ids: Set<number>) {
  try {
    const arr = [...ids].slice(-500);
    localStorage.setItem(READ_IDS_KEY, JSON.stringify(arr));
  } catch { /* ignore */ }
}

/** 仅展示「他人触发」或项目/指派由他人关联到自己账号的通知；本人操作自己的任务不产生可见通知 */
function shouldShowNotification(n: Notification, currentUserId: number | undefined): boolean {
  if (n.isSelfAction) return false;
  if (currentUserId != null && n.actorUserId != null && n.actorUserId === currentUserId) return false;
  return true;
}

export const useNotificationStore = defineStore('notification', () => {
  const userStore = useUserStore();
  const rawNotifications = ref<Notification[]>([]);
  const loading = ref(false);
  const localReadIds = ref<Set<number>>(loadLocalReadIds());

  const notifications = computed(() => {
    const uid = userStore.user?.id;
    return rawNotifications.value.filter((n) => shouldShowNotification(n, uid));
  });

  const unreadCount = computed(() => {
    return notifications.value.filter((n) => !n.read && !localReadIds.value.has(n.id)).length;
  });

  function applyLocalReadState(list: Notification[]): Notification[] {
    const ids = localReadIds.value;
    if (ids.size === 0) return list;
    return list.map((n) => (ids.has(n.id) ? { ...n, read: true } : n));
  }

  async function fetchNotifications(silent = false) {
    if (!silent) loading.value = true;
    try {
      const raw = await notificationApi.getNotifications();
      rawNotifications.value = applyLocalReadState(raw);
    } finally {
      if (!silent) loading.value = false;
    }
  }

  async function markAsRead(id: number) {
    await notificationApi.markAsRead(id);
    localReadIds.value = new Set([...localReadIds.value, id]);
    saveLocalReadIds(localReadIds.value);
    rawNotifications.value = rawNotifications.value.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
  }

  async function markAllAsRead() {
    const allIds = rawNotifications.value.map((n) => n.id);
    rawNotifications.value = rawNotifications.value.map((n) => ({ ...n, read: true }));

    localReadIds.value = new Set([...localReadIds.value, ...allIds]);
    saveLocalReadIds(localReadIds.value);

    try {
      await Promise.race([
        notificationApi.markAllAsRead(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('请求超时')), 10000)),
      ]);
    } catch (e) {
      throw e;
    }
  }

  async function deleteNotification(id: number) {
    await notificationApi.delete(id, { skipGlobalError: true });
    rawNotifications.value = rawNotifications.value.filter((n) => n.id !== id);
  }

  function $reset() {
    rawNotifications.value = [];
    loading.value = false;
  }

  return {
    notifications,
    loading,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    $reset,
  };
});
