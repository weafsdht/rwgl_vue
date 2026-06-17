import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import userApi from '@/api/user';
import type { User } from '@/types';
import { mergeApiUser } from '@/utils/user';
import { disconnectChatStomp } from '@/services/chatStomp';

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem('token'));

  const isLoggedIn = computed(() => !!token.value && !!user.value);

  /**
   * 登录：推荐传邮箱；也可传用户名（后端若仅按 email 查库，用户名登录可能失败）
   */
  async function login(account: string, password: string) {
    const t = account.trim();
    const emailLike = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
    const res = await userApi.login(
      emailLike ? { email: t, password } : { username: t, password }
    );
    token.value = res.token;
    user.value = mergeApiUser(res.user);
    localStorage.setItem('token', res.token);
    localStorage.setItem('user_username', res.user?.username ?? t);
    return res;
  }

  /**
   * 注册：email、password 必填；nickname 可选
   */
  async function register(data: { email: string; password: string; nickname?: string }) {
    const res = await userApi.register(data);
    token.value = res.token;
    user.value = mergeApiUser(res.user);
    localStorage.setItem('token', res.token);
    localStorage.setItem('user_username', res.user?.username ?? data.email);
    return res;
  }

  /**
   * 登出
   */
  function logout() {
    disconnectChatStomp();
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user_username');
  }

  /**
   * 获取当前用户信息（首屏加载用，失败时静默，避免重复 Toast）
   */
  async function fetchCurrentUser() {
    if (!token.value) return;
    try {
      const raw = await userApi.getCurrentUser({ skipGlobalError: true });
      let merged = mergeApiUser(raw);
      if (merged?.username) {
        localStorage.setItem('user_username', merged.username);
      } else {
        const saved = localStorage.getItem('user_username');
        if (saved && merged) {
          merged = { ...merged, username: saved };
        }
      }
      user.value = merged;
    } catch (error: any) {
      // 401 或后端返回 200+code:401 的「未登录」：清除 token 并登出
      const msg = error?.message || '';
      if (error?.response?.status === 401 || msg.includes('401') || msg === '未登录') {
        logout();
      }
      throw error;
    }
  }

  /**
   * 更新用户信息
   */
  async function updateUser(data: Partial<User>) {
    if (!user.value) return;
    user.value = mergeApiUser(await userApi.updateUser(data)) ?? user.value;
  }

  /**
   * 更新个人资料（PATCH /api/users/me：username、nickname、avatar、phone、timezone、signature 等）
   */
  async function updateProfile(data: {
    username?: string;
    nickname?: string;
    email?: string;
    avatar?: string;
    phone?: string;
    gender?: string;
    timezone?: string;
    signature?: string;
  }) {
    if (!user.value) return;
    const updated = await userApi.updateProfile(data);
    user.value = mergeApiUser({ ...user.value, ...updated }) ?? user.value;
  }

  /**
   * 上传头像（POST /users/me/avatar，FormData 字段 file），返回并更新当前用户
   */
  async function uploadAvatar(file: File) {
    const updated = await userApi.uploadAvatar(file);
    if (user.value) user.value = mergeApiUser({ ...user.value, ...updated }) ?? user.value;
    return updated;
  }

  return {
    user,
    token,
    isLoggedIn,
    login,
    register,
    logout,
    fetchCurrentUser,
    updateUser,
    updateProfile,
    uploadAvatar,
  };
});
