import { createRouter, createWebHistory } from 'vue-router';
import { isSystemAdmin } from '@/constants/role';
import { useUserStore } from '@/stores/user';
import MainLayout from '@/layouts/MainLayout.vue';

/** 带重试的懒加载，避免网络抖动导致动态 import 失败后页面不跳转 */
function lazyLoad(
  importFn: () => Promise<{ default: import('vue').Component }>,
  retries = 1
): () => Promise<{ default: import('vue').Component }> {
  return () =>
    importFn().catch((err) => {
      if (retries > 0) {
        return lazyLoad(importFn, retries - 1)();
      }
      return Promise.reject(err);
    });
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('@/views/Register.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/',
      component: MainLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'Dashboard',
          component: () => import('@/views/Dashboard.vue'),
        },
        {
          path: 'board',
          name: 'Board',
          component: () => import('@/views/Board.vue'),
        },
        {
          path: 'tasks',
          name: 'Tasks',
          component: () => import('@/views/Tasks.vue'),
        },
        {
          path: 'calendar',
          name: 'Calendar',
          component: lazyLoad(() => import('@/views/Calendar.vue')),
        },
        {
          path: 'projects',
          name: 'Projects',
          component: () => import('@/views/Projects.vue'),
        },
        {
          path: 'projects/:id/progress',
          name: 'ProjectProgress',
          component: () => import('@/views/ProjectProgress.vue'),
        },
        {
          path: 'statistics',
          name: 'Statistics',
          component: () => import('@/views/Statistics.vue'),
        },
        {
          path: 'teams',
          name: 'Teams',
          component: () => import('@/views/Teams.vue'),
        },
        {
          path: 'teams/:id',
          name: 'TeamDetail',
          component: () => import('@/views/TeamDetail.vue'),
        },
        {
          path: 'archive',
          name: 'Archive',
          component: lazyLoad(() => import('@/views/Archive.vue')),
        },
        {
          path: 'attachments',
          name: 'Attachments',
          component: lazyLoad(() => import('@/views/Attachments.vue')),
        },
        {
          path: 'chat/:conversationId',
          name: 'ChatThread',
          component: () => import('@/views/chat/ChatThread.vue'),
          props: true,
        },
        {
          path: 'chat',
          name: 'ChatList',
          component: () => import('@/views/chat/ChatList.vue'),
        },
        {
          path: 'friends',
          name: 'Friends',
          component: () => import('@/views/Friends.vue'),
        },
        {
          path: 'settings',
          name: 'Settings',
          component: () => import('@/views/Settings.vue'),
        },
        {
          path: 'admin/users',
          name: 'UserManagement',
          component: () => import('@/views/UserManagement.vue'),
          meta: { requiresAdmin: true },
        },
        {
          path: 'admin/mail',
          name: 'MailSend',
          component: () => import('@/views/MailSend.vue'),
          meta: { requiresAdmin: true },
        },
      ],
    },
  ],
});

// 路由守卫：有 token 时先恢复用户信息，再判断登录态（避免刷新后 user 未就绪导致误判）
router.beforeEach(async (to, _from, next) => {
  const userStore = useUserStore();

  if (userStore.token && !userStore.user) {
    try {
      await userStore.fetchCurrentUser();
    } catch {
      // 401 已在 store 内清除 token；其它错误不阻塞导航，由下方规则处理
    }
  }

  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next('/login');
  } else if ((to.path === '/login' || to.path === '/register') && userStore.isLoggedIn) {
    next('/');
  } else if (to.meta.requiresAdmin) {
    if (!isSystemAdmin(userStore.user?.role)) {
      next('/');
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router;
