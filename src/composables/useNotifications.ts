import { computed } from 'vue';
import { useNotificationStore } from '@/stores/notification';

/**
 * 通知相关 Composables
 */
export function useNotifications() {
  const notificationStore = useNotificationStore();

  /**
   * 获取未读通知
   */
  const unreadNotifications = computed(() => {
    return notificationStore.notifications.filter(n => !n.read);
  });

  /**
   * 获取已读通知
   */
  const readNotifications = computed(() => {
    return notificationStore.notifications.filter(n => n.read);
  });

  return {
    notifications: computed(() => notificationStore.notifications),
    unreadNotifications,
    readNotifications,
    unreadCount: computed(() => notificationStore.unreadCount),
    loading: computed(() => notificationStore.loading),
    fetchNotifications: notificationStore.fetchNotifications,
    markAsRead: notificationStore.markAsRead,
    markAllAsRead: notificationStore.markAllAsRead,
    deleteNotification: notificationStore.deleteNotification,
  };
}
