<template>
  <n-layout class="main-layout">
    <n-layout has-sider class="layout-body">
      <n-layout-sider
        v-model:collapsed="collapsed"
        :width="216"
        :collapsed-width="72"
        collapse-mode="width"
        :show-trigger="false"
        bordered
        class="sider"
      >
        <div class="sider-inner" :class="{ 'sider-inner--collapsed': collapsed }">
          <div class="sider-header">
            <h2 class="sider-title" :class="{ 'sider-title--hidden': collapsed }">TaskFlow</h2>
            <button
              type="button"
              class="sider-collapse-btn"
              :title="collapsed ? '展开侧边栏' : '收起侧边栏'"
              @click="collapsed = !collapsed"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <rect x="3" y="4" width="14" height="16" rx="1"/>
                <line x1="8" y1="4" x2="8" y2="20"/>
              </svg>
            </button>
          </div>
          <n-menu
            v-model:value="activeKey"
            :options="menuOptions"
            :collapsed="collapsed"
            @update:value="handleMenuSelect"
          />
        </div>
      </n-layout-sider>

      <n-layout-content class="content">
        <div class="content-column">
          <header class="header content-header">
            <div class="header-content">
              <div v-if="route.name === 'Board'" class="header-project">
                <n-select
                  :value="currentProjectId ?? -1"
                  :options="boardProjectOptions"
                  placeholder="选择项目"
                  clearable
                  class="header-project-select"
                  @update:value="onBoardProjectChange"
                />
              </div>
              <div class="header-actions">
                <SearchBar />
                <div class="theme-switch-wrapper">
                  <n-switch v-model:value="isDark" @update:value="handleThemeChange" size="large">
                    <template #checked-icon>
                      <n-icon><Moon /></n-icon>
                    </template>
                    <template #unchecked-icon>
                      <n-icon><Sunny /></n-icon>
                    </template>
                  </n-switch>
                </div>
                <div class="notification-btn-wrapper">
                  <button type="button" class="btn-icon" @click="showNotifications = true" title="通知">
                    <Notifications />
                  </button>
                  <span v-if="unreadCount > 0" class="badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
                </div>
                <n-dropdown :options="userMenuOptions" @select="handleUserMenuSelect">
                  <n-avatar
                    :src="headerAvatarSrc"
                    round
                    :size="48"
                    class="header-user-avatar-trigger"
                    style="cursor: pointer"
                  >
                    <template v-if="!headerAvatarSrc">
                      {{ userInitial }}
                    </template>
                    <template #fallback>
                      {{ userInitial }}
                    </template>
                  </n-avatar>
                </n-dropdown>
              </div>
            </div>
          </header>
          <div
            class="content-main"
            :class="{ 'content-main--full': route.name === 'Settings' || route.name === 'MailSend' }"
          >
            <div class="content-main-router">
              <router-view />
            </div>
          </div>
        </div>
      </n-layout-content>
    </n-layout>

    <!-- 通知抽屉 -->
    <n-drawer v-model:show="showNotifications" placement="right" :width="400" class="notification-drawer">
      <n-drawer-content closable>
        <template #header>
          <span class="notification-drawer-title">通知</span>
          <span class="notification-drawer-hint">默认仅保留最近 31 天的消息记录</span>
        </template>
        <NotificationList />
      </n-drawer-content>
    </n-drawer>

    <!-- 全局浮动按钮：新建任务 + 刷新（概览/看板/任务列表/日历时显示） -->
    <div v-if="showGlobalFabs" class="global-fab-wrap">
      <button
        type="button"
        class="global-fab global-fab-primary"
        title="新建任务"
        @click="defaultCreateStatus = null; showCreateTask = true"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
      <button
        type="button"
        class="global-fab global-fab-secondary"
        title="刷新"
        @click="handleRefresh"
      >
        <svg
          :class="{ spinning: isRefreshing }"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          width="22"
          height="22"
        >
          <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
      </button>
    </div>

    <!-- 新建/编辑任务弹窗（全局） -->
    <CreateTaskModal
      v-model="showCreateTask"
      :loading="createTaskLoading"
      :default-status="defaultCreateStatus ?? undefined"
      :default-start-time="defaultCreateStartTime ?? undefined"
      :default-due-time="defaultCreateDueTime ?? undefined"
      :default-project-id="defaultCreateProjectId"
      :edit-task="editingTask"
      @submit="handleCreateTask"
      @update="handleUpdateTask"
      @delete="handleDeleteTask"
      @archive="handleArchiveTask"
    />
  </n-layout>
</template>

<script setup lang="ts">
import { ref, computed, h, watch, onMounted, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import {
  NLayout,
  NLayoutSider,
  NLayoutContent,
  NMenu,
  NIcon,
  NAvatar,
  NDrawer,
  NDrawerContent,
  NDropdown,
  NSwitch,
  NSelect,
} from 'naive-ui';
import {
  Moon,
  Sunny,
  Notifications,
  StatsChartOutline,
  BarChartOutline,
  ClipboardOutline,
  CheckboxOutline,
  CalendarOutline,
  FolderOpenOutline,
  ArchiveOutline,
  DocumentAttachOutline,
  PeopleOutline,
  MailOutline,
  PersonAddOutline,
  ChatbubblesOutline,
} from '@vicons/ionicons5';
import '../styles/components.css';
import { useUserStore } from '@/stores/user';
import { pickAvatarFromPayload } from '@/utils/user';
import { useAuthAvatarUrl } from '@/composables/useAuthAvatarUrl';
import { useNotifications } from '@/composables/useNotifications';
import { useNotificationStore } from '@/stores/notification';
import { useTasks } from '@/composables/useTasks';
import { useProjects } from '@/composables/useProjects';
import { isSystemAdmin, isProjectManager, isProjectManagerOrAdmin } from '@/constants/role';
import { useTeamStore } from '@/stores/team';
import projectApi from '@/api/project';
import attachmentApi from '@/api/attachment';
import NotificationList from '@/components/NotificationList.vue';
import SearchBar from '@/components/SearchBar.vue';
import CreateTaskModal from '@/components/CreateTaskModal.vue';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const { token } = storeToRefs(userStore);
const teamStore = useTeamStore();
const notificationStore = useNotificationStore();
const { unreadCount, fetchNotifications } = useNotifications();

// 初始化时获取通知（如果已登录）
if (userStore.isLoggedIn) {
  fetchNotifications().catch(() => {
    // 静默处理错误
  });
}

const collapsed = ref(false);
const activeKey = ref(route.name as string);
const showNotifications = ref(false);
const isDark = ref(localStorage.getItem('theme') === 'dark');
const showCreateTask = ref(false);
const createTaskLoading = ref(false);
const isRefreshing = ref(false);
/** 从看板某列点击「+ 新建」时传入，用于弹窗默认状态；关闭弹窗后清空 */
const defaultCreateStatus = ref<string | null>(null);
/** 从日历点击时间段新建时传入，默认开始时间 YYYY-MM-DD HH:mm:ss；关闭弹窗后清空 */
const defaultCreateStartTime = ref<string | null>(null);
/** 从日历点击日期/时间段新建时传入，默认截止（日期 YYYY-MM-DD 或完整时间）；关闭弹窗后清空 */
const defaultCreateDueTime = ref<string | null>(null);
/** 从项目列表「添加任务」传入，新任务默认归属该项目；关闭弹窗后清空 */
const defaultCreateProjectId = ref<number | null>(null);
/** 编辑任务时传入，关闭弹窗后清空 */
const editingTask = ref<import('@/types').Task | null>(null);

const { createTask, updateTask, deleteTask, archiveTask } = useTasks();
const { projects, currentProjectId, fetchProjects, setCurrentProject } = useProjects();

const boardProjectOptions = computed(() => [
  { label: '全部项目', value: -1 },
  ...projects.value.map(p => ({ label: p.name, value: p.id })),
]);

function onBoardProjectChange(value: number) {
  setCurrentProject(value === -1 ? null : value);
  window.dispatchEvent(new CustomEvent('refresh-view', { detail: { view: 'Board' } }));
}

function openCreateTask(ev: Event) {
  const detail = (ev as CustomEvent).detail as { status?: string; startTime?: string; dueTime?: string; projectId?: number };
  if (detail?.status) defaultCreateStatus.value = detail.status;
  if (detail?.startTime) defaultCreateStartTime.value = detail.startTime;
  else defaultCreateStartTime.value = null;
  if (detail?.dueTime) defaultCreateDueTime.value = detail.dueTime;
  else defaultCreateDueTime.value = null;
  if (detail?.projectId != null) defaultCreateProjectId.value = detail.projectId;
  else defaultCreateProjectId.value = null;
  showCreateTask.value = true;
}

watch(showCreateTask, (v) => {
  if (!v) {
    defaultCreateStatus.value = null;
    defaultCreateStartTime.value = null;
    defaultCreateDueTime.value = null;
    defaultCreateProjectId.value = null;
    editingTask.value = null;
  }
});

function openEditTask(ev: Event) {
  const detail = (ev as CustomEvent).detail as { task?: import('@/types').Task };
  if (detail?.task) {
    editingTask.value = detail.task;
    defaultCreateStatus.value = null;
    showCreateTask.value = true;
  }
}

function closeNotificationDrawer() {
  showNotifications.value = false;
}

onMounted(() => {
  window.addEventListener('open-create-task', openCreateTask);
  window.addEventListener('open-edit-task', openEditTask);
  window.addEventListener('close-notification-drawer', closeNotificationDrawer);
  if (route.name === 'Board') fetchProjects().catch(() => {});
  if (userStore.isLoggedIn) teamStore.fetchMyTeams().catch(() => {});
});
onUnmounted(() => {
  window.removeEventListener('open-create-task', openCreateTask);
  window.removeEventListener('open-edit-task', openEditTask);
  window.removeEventListener('close-notification-drawer', closeNotificationDrawer);
});
watch(() => route.name, (name) => {
  if (name === 'ChatList' || name === 'ChatThread') {
    activeKey.value = 'Chat';
  } else if (name) {
    activeKey.value = name as string;
  }
  if (name === 'Board') fetchProjects().catch(() => {});
});

const showGlobalFabs = computed(() =>
  ['Dashboard', 'Board', 'Tasks', 'Calendar', 'Projects'].includes(route.name as string)
);

const user = computed(() => userStore.user);

const userInitial = computed(() => {
  const u = user.value;
  const ch = u?.nickname?.trim()?.[0] || u?.username?.trim()?.[0];
  return ch || '?';
});

/** 与接口字段对齐（avatar / avatarUrl / avatar_url），避免只回传蛇形字段时头像丢失 */
const resolvedHeaderAvatarPath = computed(() => {
  const u = user.value;
  if (!u) return '';
  return pickAvatarFromPayload(u as unknown as Record<string, unknown>) || '';
});

/** 带 Token 的 blob 地址（需鉴权的 /api 静态文件）或回退直链 */
const { avatarSrc: headerAvatarSrc } = useAuthAvatarUrl(resolvedHeaderAvatarPath, token);

async function handleCreateTask(
  payload: Record<string, unknown> & { projectName?: string },
  pendingFiles?: File[]
) {
  createTaskLoading.value = true;
  try {
    const taskPayload = { ...payload };
    const projectName = taskPayload.projectName;
    if (projectName) {
      const project = await projectApi.createProject({ name: projectName });
      taskPayload.projectId = project.id;
      delete taskPayload.projectName;
    }
    const task = await createTask(taskPayload);
    if (pendingFiles?.length && task?.id) {
      for (const file of pendingFiles) {
        await attachmentApi.uploadAttachment(task.id, file);
      }
    }
    showCreateTask.value = false;
    window.dispatchEvent(new CustomEvent('task-created'));
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'success', title: '创建成功', message: '任务已创建' },
    }));
  } catch (e) {
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'error', title: '创建失败', message: (e as Error)?.message || '请稍后重试' },
    }));
  } finally {
    createTaskLoading.value = false;
  }
}

async function handleUpdateTask(taskId: number, payload: Record<string, unknown> & { projectName?: string }) {
  createTaskLoading.value = true;
  try {
    const taskPayload = { ...payload };
    const projectName = taskPayload.projectName;
    if (projectName) {
      const project = await projectApi.createProject({ name: projectName });
      taskPayload.projectId = project.id;
      delete taskPayload.projectName;
    }
    await updateTask(taskId, taskPayload);
    showCreateTask.value = false;
    editingTask.value = null;
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'success', title: '保存成功', message: '任务已更新' },
    }));
  } catch (e) {
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'error', title: '保存失败', message: (e as Error)?.message || '请稍后重试' },
    }));
  } finally {
    createTaskLoading.value = false;
  }
}

async function handleDeleteTask(taskId: number) {
  createTaskLoading.value = true;
  try {
    await deleteTask(taskId);
    showCreateTask.value = false;
    editingTask.value = null;
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'success', title: '已删除', message: '任务已删除' },
    }));
  } catch (e) {
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'error', title: '删除失败', message: (e as Error)?.message || '请稍后重试' },
    }));
  } finally {
    createTaskLoading.value = false;
  }
}

async function handleArchiveTask(taskId: number) {
  createTaskLoading.value = true;
  try {
    await archiveTask(taskId);
    showCreateTask.value = false;
    editingTask.value = null;
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'success', title: '已归档', message: '任务已移入归档' },
    }));
  } catch (e) {
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'error', title: '归档失败', message: (e as Error)?.message || '请稍后重试' },
    }));
  } finally {
    createTaskLoading.value = false;
  }
}

function handleRefresh() {
  if (isRefreshing.value) return;
  isRefreshing.value = true;
  window.dispatchEvent(new CustomEvent('refresh-view', { detail: { view: route.name } }));
  setTimeout(() => {
    isRefreshing.value = false;
  }, 600);
}

// 深色模式切换
const handleThemeChange = (value: boolean) => {
  isDark.value = value;
  localStorage.setItem('theme', value ? 'dark' : 'light');
  // 触发主题变更事件，由 App.vue 和 AppContent 处理
  window.dispatchEvent(new CustomEvent('theme-change', { detail: { isDark: value } }));
};

const menuOptions = computed(() => {
  const base = [
    {
      label: '概览',
      key: 'Dashboard',
      icon: () => h(NIcon, null, { default: () => h(StatsChartOutline) }),
    },
    {
      label: '看板',
      key: 'Board',
      icon: () => h(NIcon, null, { default: () => h(ClipboardOutline) }),
    },
    {
      label: '任务列表',
      key: 'Tasks',
      icon: () => h(NIcon, null, { default: () => h(CheckboxOutline) }),
    },
    {
      label: '日历',
      key: 'Calendar',
      icon: () => h(NIcon, null, { default: () => h(CalendarOutline) }),
    },
    {
      label: '项目',
      key: 'Projects',
      icon: () => h(NIcon, null, { default: () => h(FolderOpenOutline) }),
    },
    ...(isProjectManagerOrAdmin(userStore.user?.role)
      ? [{
          label: '统计',
          key: 'Statistics',
          icon: () => h(NIcon, null, { default: () => h(BarChartOutline) }),
        }]
      : []),
    ...(isProjectManager(userStore.user?.role) || teamStore.myTeams.length > 0
      ? [{
          label: '团队',
          key: 'Teams',
          icon: () => h(NIcon, null, { default: () => h(PeopleOutline) }),
        }]
      : []),
    {
      label: '归档',
      key: 'Archive',
      icon: () => h(NIcon, null, { default: () => h(ArchiveOutline) }),
    },
    {
      label: '附件',
      key: 'Attachments',
      icon: () => h(NIcon, null, { default: () => h(DocumentAttachOutline) }),
    },
    {
      label: '我的好友',
      key: 'Friends',
      icon: () => h(NIcon, null, { default: () => h(PersonAddOutline) }),
    },
    {
      label: '消息',
      key: 'Chat',
      icon: () => h(NIcon, null, { default: () => h(ChatbubblesOutline) }),
    },
  ];
  if (isSystemAdmin(userStore.user?.role)) {
    base.push({
      label: '用户管理',
      key: 'UserManagement',
      icon: () => h(NIcon, null, { default: () => h(PeopleOutline) }),
    });
    base.push({
      label: '发送邮件',
      key: 'MailSend',
      icon: () => h(NIcon, null, { default: () => h(MailOutline) }),
    });
  }
  return base;
});

const userMenuOptions = [
  {
    label: '个人设置',
    key: 'settings',
  },
  {
    label: '我的好友',
    key: 'friends',
  },
  {
    label: '退出登录',
    key: 'logout',
  },
];

const handleMenuSelect = (key: string) => {
  const k = String(key);
  const pathMap: Record<string, string> = {
    Dashboard: '/',
    Board: '/board',
    Tasks: '/tasks',
    Calendar: '/calendar',
    Projects: '/projects',
    Statistics: '/statistics',
    Teams: '/teams',
    Archive: '/archive',
    Attachments: '/attachments',
    Friends: '/friends',
    Chat: '/chat',
    UserManagement: '/admin/users',
    MailSend: '/admin/mail',
    Settings: '/settings',
  };
  const path = pathMap[k];
  if (path !== undefined) {
    router.push(path);
  } else {
    router.push({ name: k });
  }
};

const handleUserMenuSelect = (key: string) => {
  if (key === 'logout') {
    teamStore.clear();
    notificationStore.$reset();
    userStore.logout();
    router.push('/login');
  } else if (key === 'settings') {
    router.push({ name: 'Settings' });
  } else if (key === 'friends') {
    router.push({ name: 'Friends' });
  }
};
</script>

<style scoped>
.main-layout {
  height: 100vh;
  background: var(--bg-primary);
}

.header {
  height: var(--layout-header-height);
  padding: 0 var(--spacing-lg);
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-soft);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
}

.header-project {
  margin-right: auto;
  margin-left: 0;
}

.header-project-select {
  width: 180px;
}

.header-project :deep(.n-select) {
  border-radius: 8px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.layout-body {
  height: 100vh;
  display: flex;
}

.content-column {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
}

.content-header {
  flex-shrink: 0;
}

.content-main {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: auto;
  padding: var(--spacing-sm) var(--spacing-lg) var(--spacing-lg);
}

/* 让各页面根节点能拿到明确高度（flex 链），侧栏内滚动等才能生效 */
.content-main-router {
  flex: 1;
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.content-main--full {
  padding: 0;
}

.content-main::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.content-main::-webkit-scrollbar-track {
  background: var(--bg-tertiary);
  border-radius: 4px;
}
.content-main::-webkit-scrollbar-thumb {
  background: var(--border-medium);
  border-radius: 4px;
}
.content-main::-webkit-scrollbar-thumb:hover {
  background: var(--text-tertiary);
}

/* 全局浮动按钮（与参考图一致：新建任务 + 刷新） */
.global-fab-wrap {
  position: fixed;
  right: var(--spacing-lg);
  bottom: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 10;
}

.global-fab {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: var(--shadow-soft);
}

.global-fab:hover {
  transform: scale(1.06);
  box-shadow: var(--shadow-hover);
}

.global-fab-primary {
  background: var(--accent-gradient);
  color: var(--primary-foreground, #fff);
}

.global-fab-secondary {
  background: var(--bg-secondary);
  color: var(--accent-primary);
  border: 1px solid var(--accent-neon-border);
}

.global-fab-secondary:hover {
  background: var(--bg-tertiary);
  border-color: var(--accent-primary);
}

.global-fab-secondary svg.spinning {
  animation: spin 0.6s linear infinite;
}

.sider {
  height: 100%;
  background: var(--sidebar, var(--bg-secondary));
  border-right: 1px solid var(--sidebar-border, var(--border-subtle));
}

.sider-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sider-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  min-height: 44px;
}

.sider-title {
  margin: 0;
  font-size: var(--font-size-h1);
  font-weight: 700;
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  transition: opacity 0.2s ease;
}

.sider-title--hidden {
  opacity: 0;
  width: 0;
  overflow: hidden;
  flex: 0;
  padding: 0;
}

.sider-inner--collapsed .sider-header {
  justify-content: center;
  padding: var(--spacing-sm);
  min-height: 42px;
}

/* 折叠后与菜单项大小一致 */
.sider-inner--collapsed .sider-collapse-btn {
  width: 42px;
  height: 42px;
  border: none;
  background: transparent;
  color: var(--menu-text);
}

.sider-inner--collapsed .sider-collapse-btn:hover {
  background: var(--bg-tertiary);
  color: var(--menu-text);
  border: none;
}

.sider-inner--collapsed .sider-collapse-btn svg {
  width: 20px;
  height: 20px;
  transform: rotate(180deg);
}

/* collapsed 状态下的折叠按钮已在通用样式处理 */

.sider-collapse-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.sider-collapse-btn:hover {
  background: rgba(0, 229, 255, 0.08);
  color: var(--accent-primary);
  border-color: var(--accent-neon-border);
}

.sider-collapse-btn svg {
  width: 16px;
  height: 16px;
  transition: transform 0.2s ease;
}

.sider-inner:not(.sider-inner--collapsed) .sider-collapse-btn svg {
  transform: rotate(0);
}

:deep(.sider .n-menu) {
  flex: 1;
  padding: 0 var(--spacing-sm) var(--spacing-md);
}

.content {
  flex: 1;
  padding: 0;
  background: var(--bg-primary);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}


.btn-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.2s ease;
}

.btn-icon:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  transform: translateY(-2px);
}

.btn-icon:active {
  transform: translateY(-2px) scale(0.98);
}

.btn-icon svg {
  width: 20px;
  height: 20px;
}

.notification-btn-wrapper {
  position: relative;
}

.badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: var(--danger);
  color: var(--text-primary);
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 10px;
  font-weight: 600;
  min-width: 18px;
  text-align: center;
  border: 2px solid var(--bg-secondary);
}

:deep(.n-avatar) {
  border: 2px solid var(--border-medium);
  transition: all 0.2s ease;
}

:deep(.n-avatar:hover) {
  transform: scale(1.1);
  box-shadow: var(--shadow-elevated);
}

:deep(.n-menu-item) {
  border-radius: 8px;
  color: var(--menu-text) !important;
}

:deep(.n-menu-item .n-menu-item-content__icon) {
  color: var(--menu-text) !important;
}

:deep(.n-menu-item--selected) {
  background: var(--menu-selected-bg) !important;
  color: var(--menu-text-selected) !important;
}

:deep(.n-menu-item--selected .n-menu-item-content__icon) {
  color: var(--menu-text-selected) !important;
}

:deep(.n-menu-item:hover) {
  background: var(--bg-tertiary);
}

:deep(.n-menu-item:hover:not(.n-menu-item--selected)) {
  color: var(--menu-text) !important;
}

:deep(.n-menu-item:hover:not(.n-menu-item--selected) .n-menu-item-content__icon) {
  color: var(--menu-text) !important;
}

/* 下拉菜单样式优化 */
:deep(.n-dropdown-menu) {
  border-radius: 12px !important;
  box-shadow: var(--shadow-elevated) !important;
  padding: 4px !important;
  animation: dropdown-enter 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  background: var(--bg-secondary) !important;
  border: 1px solid var(--border-subtle) !important;
}

:deep(.n-dropdown-option) {
  border-radius: 8px !important;
  padding: 8px 12px !important;
  transition: all 0.2s ease !important;
}

:deep(.n-dropdown-option:hover) {
  background: var(--bg-tertiary) !important;
  color: var(--accent-primary) !important;
}

:deep(.n-dropdown-option--selected) {
  background: rgba(0, 229, 255, 0.1) !important;
  color: var(--accent-primary) !important;
}

@keyframes dropdown-enter {
  from {
    opacity: 0;
    transform: translateY(-4px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 主题切换开关样式 */
.theme-switch-wrapper {
  display: flex;
  align-items: center;
}

:deep(.n-switch) {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.n-switch--checked) {
  background-color: var(--accent-primary) !important;
}

:deep(.n-switch--checked .n-switch__button) {
  background-color: var(--primary-foreground) !important;
}

:deep(.n-switch__button) {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--shadow-soft);
}

:deep(.n-switch:hover) {
  transform: scale(1.05);
}

:deep(.n-switch:active) {
  transform: scale(0.95);
}

/* 通知抽屉样式 */
.notification-drawer :deep(.n-drawer-content__header) {
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-subtle);
}

.notification-drawer :deep(.n-drawer-content__body) {
  padding: 0;
}

.notification-drawer-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-right: 10px;
}

.notification-drawer-hint {
  font-size: 12px;
  font-weight: 400;
  color: var(--text-tertiary);
}
</style>
