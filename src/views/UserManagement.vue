<template>
  <div class="user-management-page">
    <div class="page-header">
      <h1 class="page-title">用户管理</h1>
    </div>

    <div v-if="loading" class="loading">
      <div class="loader-ring"></div>
    </div>
    <div v-else-if="loadError" class="empty-state empty-state-error">
      <p class="empty-text">{{ loadError }}</p>
      <button type="button" class="btn-retry" @click="loadUsers">重新加载</button>
    </div>
    <div v-else>
      <div class="search-bar">
        <n-input
          key="user-mgmt-search-username"
          v-model:value="searchUsername"
          :stateful="false"
          :input-props="{
            id: 'user-mgmt-search-username',
            name: 'user-mgmt-search-username',
            autocomplete: 'off',
          }"
          placeholder="搜索用户名"
          clearable
          class="search-input"
        />
        <n-select
          v-model:value="searchRole"
          :options="searchRoleOptions"
          placeholder="全部角色"
          clearable
          class="search-role"
        />
      </div>
      <section class="user-list-section">
        <h2 class="user-list-title">用户列表</h2>
        <div class="user-list">
          <div class="user-list-header" role="row">
            <span class="user-list-header-avatar-spacer" aria-hidden="true"></span>
            <div class="user-list-header-content">
              <div class="user-list-header-core">
                <span class="user-item-cell user-item-cell--name">用户名</span>
                <span class="user-item-cell user-item-cell--gender">性别</span>
                <span class="user-item-cell user-item-cell--email">邮箱</span>
              </div>
              <span class="user-item-cell user-item-cell--role">角色</span>
            </div>
            <div class="user-list-header-actions">
              <span class="user-list-header-actions-title">操作</span>
            </div>
          </div>
          <div
            v-for="u in filteredUsers"
            :key="u.id"
            class="user-item"
          >
            <span
              class="user-item-avatar"
              :class="{ 'user-item-avatar--has-img': u.avatar && !avatarErrors[u.id] }"
            >
              <img
                v-if="u.avatar && !avatarErrors[u.id]"
                :src="getAvatarUrl(u.avatar)"
                alt=""
                @error="onAvatarError(u.id)"
              />
              <span v-else class="user-item-avatar-initial">{{ (u.nickname || u.username || u.email || 'A').trim()[0].toUpperCase() }}</span>
            </span>
            <div class="user-item-content">
              <div class="user-item-content-row">
                <div class="user-item-content-core">
                  <span class="user-item-cell user-item-cell--name">{{ u.nickname || u.username || u.email || '—' }}</span>
                  <span class="user-item-cell user-item-cell--gender">{{ genderLabel(u) }}</span>
                  <span class="user-item-cell user-item-cell--email">{{ u.email || '—' }}</span>
                </div>
                <span class="user-item-cell user-item-cell--role">{{ u.roleLabel ?? '—' }}</span>
              </div>
            </div>
            <div class="user-item-actions">
              <button type="button" class="btn-account" @click.stop="openRoleModal(u)">修改权限</button>
              <button type="button" class="btn-account" @click.stop="openPasswordModal(u)">修改密码</button>
              <button type="button" class="btn-account btn-account--danger" @click.stop="openDeleteModal(u)">删除</button>
            </div>
          </div>
        </div>
        <p v-if="filteredUsers.length === 0" class="user-list-empty">暂无用户或未匹配筛选条件</p>
      </section>
    </div>

    <!-- 修改权限（角色）弹窗 -->
    <FormModal
      v-model="showRoleModal"
      title="修改权限"
      confirm-text="确 定"
      cancel-text="取 消"
      @confirm="handleConfirmRole"
    >
      <div class="role-modal-body">
        <p v-if="editingUser" class="role-modal-user">{{ editingUser.nickname || editingUser.username }}（{{ editingUser.email }}）</p>
        <n-select
          v-model:value="editingRole"
          :options="roleOptions"
          :to="false"
          placeholder="选择角色"
          class="role-select"
        />
      </div>
    </FormModal>

    <!-- 修改密码弹窗 -->
    <FormModal
      v-model="showPasswordModal"
      title="修改密码"
      confirm-text="确 定"
      cancel-text="取 消"
      :loading="passwordSubmitting"
      @confirm="handleConfirmPassword"
      @cancel="onPasswordModalLeave"
    >
      <div class="role-modal-body">
        <p v-if="passwordUser" class="role-modal-user">{{ passwordUser.nickname || passwordUser.username }}（{{ passwordUser.email }}）</p>
        <n-input
          :key="passwordUser ? `user-mgmt-new-password-${passwordUser.id}` : 'user-mgmt-new-password'"
          v-model:value="newPassword"
          type="password"
          :stateful="false"
          :input-props="{
            id: 'user-mgmt-new-password',
            name: 'new-password',
            autocomplete: 'new-password',
          }"
          placeholder="请输入新密码"
          show-password-on="click"
          class="password-input"
          @keydown.enter.prevent="handleConfirmPassword"
        />
      </div>
    </FormModal>

    <!-- 删除用户确认 -->
    <ConfirmModal
      v-model="showDeleteModal"
      title="确认删除"
      :content="deleteUser ? `确定要删除用户「${deleteUser.nickname || deleteUser.username}」吗？此操作不可恢复。` : ''"
      confirm-text="确 定"
      cancel-text="取 消"
      :loading="deleteSubmitting"
      @confirm="handleConfirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { NSelect } from 'naive-ui';
import ConfirmModal from '@/components/ConfirmModal.vue';
import FormModal from '@/components/FormModal.vue';
import adminApi from '@/api/admin';
import { ROLE_OPTIONS } from '@/constants/role';
import type { AdminUserVO } from '@/types';
import { getAvatarUrl } from '@/utils/url';
import { normalizeAdminUserVo } from '@/utils/user';
import '../styles/components.css';

const users = ref<AdminUserVO[]>([]);
const loading = ref(true);
const loadError = ref('');
const showRoleModal = ref(false);
const editingUser = ref<AdminUserVO | null>(null);
const editingRole = ref<number>(0);
const showPasswordModal = ref(false);
const passwordUser = ref<AdminUserVO | null>(null);
const newPassword = ref('');
const passwordSubmitting = ref(false);
const showDeleteModal = ref(false);
const deleteUser = ref<AdminUserVO | null>(null);
const deleteSubmitting = ref(false);
const searchUsername = ref('');
const searchRole = ref<number | null | undefined>(undefined);

function genderLabel(u: AdminUserVO): string {
  const g = u.gender;
  if (g === 'male') return '男';
  if (g === 'female') return '女';
  if (g === 'unknown') return '未知';
  if (g === '' || g == null) return '—';
  return String(g);
}

/** 头像加载失败时 fallback 到首字母，按用户 id 记录 */
const avatarErrors = ref<Record<number, boolean>>({});

function onAvatarError(userId: number) {
  avatarErrors.value = { ...avatarErrors.value, [userId]: true };
}

const roleOptions = ROLE_OPTIONS.map((o) => ({ label: o.label, value: o.value }));
const searchRoleOptions = [
  { label: '全部角色', value: undefined },
  ...ROLE_OPTIONS.map((o) => ({ label: o.label, value: o.value })),
];

const filteredUsers = computed(() => {
  let list = users.value;
  const kw = searchUsername.value?.trim().toLowerCase();
  if (kw) {
    list = list.filter((u) => (u.username ?? '').toLowerCase().includes(kw));
  }
  if (searchRole.value != null) {
    list = list.filter((u) => Number(u.role) === searchRole.value);
  }
  return list;
});

async function loadUsers() {
  loading.value = true;
  loadError.value = '';
  try {
    const list = await adminApi.getUsers();
    avatarErrors.value = {};
    users.value = (list ?? []).map(normalizeAdminUserVo);
  } catch (e) {
    loadError.value = (e as Error)?.message ?? '加载用户列表失败';
    users.value = [];
  } finally {
    loading.value = false;
  }
}

function openRoleModal(row: AdminUserVO) {
  editingUser.value = row;
  editingRole.value = Number(row.role);
  showRoleModal.value = true;
}

function onPasswordModalLeave() {
  newPassword.value = '';
  passwordUser.value = null;
}

function openPasswordModal(row: AdminUserVO) {
  passwordUser.value = row;
  newPassword.value = '';
  showPasswordModal.value = true;
  nextTick(() => {
    newPassword.value = '';
  });
}

async function handleConfirmPassword() {
  const pwd = newPassword.value?.trim();
  if (!passwordUser.value) return false;
  if (!pwd || pwd.length < 6) {
    window.dispatchEvent(
      new CustomEvent('toast', {
        detail: { type: 'error', title: '提示', message: '密码至少 6 位' },
      })
    );
    return false;
  }
  passwordSubmitting.value = true;
  try {
    await adminApi.updatePassword(passwordUser.value.id, pwd);
    showPasswordModal.value = false;
    passwordUser.value = null;
    newPassword.value = '';
    await loadUsers();
    window.dispatchEvent(
      new CustomEvent('toast', {
        detail: { type: 'success', title: '已更新', message: '密码已修改' },
      })
    );
  } catch (e) {
    window.dispatchEvent(
      new CustomEvent('toast', {
        detail: { type: 'error', title: '修改失败', message: (e as Error)?.message ?? '请稍后重试' },
      })
    );
    return false;
  } finally {
    passwordSubmitting.value = false;
  }
}

function openDeleteModal(row: AdminUserVO) {
  deleteUser.value = row;
  showDeleteModal.value = true;
}

async function handleConfirmDelete() {
  if (!deleteUser.value) return false;
  deleteSubmitting.value = true;
  try {
    await adminApi.deleteUser(deleteUser.value.id);
    showDeleteModal.value = false;
    deleteUser.value = null;
    await loadUsers();
    window.dispatchEvent(
      new CustomEvent('toast', {
        detail: { type: 'success', title: '已删除', message: '用户已删除' },
      })
    );
  } catch (e) {
    window.dispatchEvent(
      new CustomEvent('toast', {
        detail: { type: 'error', title: '删除失败', message: (e as Error)?.message ?? '请稍后重试' },
      })
    );
    return false;
  } finally {
    deleteSubmitting.value = false;
  }
}

async function handleConfirmRole() {
  if (!editingUser.value) return;
  try {
    await adminApi.updateRole(editingUser.value.id, Number(editingRole.value));
    showRoleModal.value = false;
    editingUser.value = null;
    await loadUsers();
    window.dispatchEvent(
      new CustomEvent('toast', {
        detail: { type: 'success', title: '已更新', message: '用户权限已修改' },
      })
    );
  } catch (e) {
    window.dispatchEvent(
      new CustomEvent('toast', {
        detail: { type: 'error', title: '修改失败', message: (e as Error)?.message ?? '请稍后重试' },
      })
    );
    return false; // 阻止弹窗关闭
  }
}

onMounted(() => {
  loadUsers();
});
</script>

<style scoped>
.user-management-page {
  padding: 0;
}

.page-header {
  margin-bottom: var(--spacing-md);
}

.page-title {
  margin: 0;
  font-size: var(--font-size-h1);
  font-weight: 700;
  color: var(--text-primary);
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.loader-ring {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-medium);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-state-error {
  padding: var(--spacing-lg);
  text-align: center;
}

.empty-state-error .empty-text {
  color: var(--text-secondary);
  margin-bottom: var(--spacing-sm);
}

.btn-retry {
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--accent-primary);
  background: transparent;
  color: var(--accent-primary);
  font-size: var(--font-size-base);
  cursor: pointer;
}

.btn-retry:hover {
  background: rgba(45, 212, 191, 0.1);
}

.search-bar {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
  align-items: center;
}

.search-input {
  max-width: 220px;
}

.search-role {
  width: 140px;
}

.user-list-section {
  background: var(--card, var(--bg-secondary));
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
  padding: var(--spacing-xl);
}

.user-list-title {
  margin: 0 0 var(--spacing-sm);
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.user-list-desc {
  margin: 0 0 var(--spacing-lg);
  font-size: var(--font-size-small);
  color: var(--text-tertiary);
  line-height: 1.5;
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-list-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-lg);
  margin-bottom: 6px;
  border-bottom: 1px solid var(--border-subtle);
  font-size: var(--font-size-small);
  font-weight: 600;
  color: var(--text-tertiary);
  letter-spacing: 0.02em;
}

/* 与左侧头像列同宽，不显示「头像」文案 */
.user-list-header-avatar-spacer {
  flex-shrink: 0;
  width: 40px;
  pointer-events: none;
}

.user-list-header-content {
  flex: 1;
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(7rem, 12rem);
  align-items: center;
  gap: var(--spacing-md);
}

/** 用户名 | 性别 | 邮箱：左右各 1fr，性别列居中于两者之间 */
.user-list-header-core {
  display: grid;
  grid-template-columns: 1fr minmax(3.25rem, 5rem) 1fr;
  align-items: center;
  gap: var(--spacing-md);
  min-width: 0;
}

.user-list-header .user-item-cell {
  color: var(--text-tertiary);
  font-weight: 600;
}

.user-list-header-core .user-item-cell--name {
  justify-self: start;
  text-align: start;
}

.user-list-header-core .user-item-cell--gender {
  justify-self: center;
  text-align: center;
}

.user-list-header-core .user-item-cell--email {
  justify-self: start;
  text-align: start;
}

.user-list-header-actions {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 0;
  min-width: 16rem;
  color: var(--text-tertiary);
  font-size: var(--font-size-small);
  font-weight: 600;
}

.user-list-header-actions-title {
  width: 100%;
  text-align: center;
  line-height: 1.4;
  padding-bottom: 2px;
}

.user-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: 10px;
  transition: background 0.2s ease;
}

.user-item:hover {
  background: var(--bg-tertiary);
}

.user-item-avatar {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(37, 99, 235, 0.15);
  color: #2563eb;
}

.user-item-avatar--has-img {
  padding: 0;
  background: transparent;
}

.user-item-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-item-avatar-initial {
  font-size: 1rem;
  font-weight: 600;
}

.user-item-content {
  flex: 1;
  min-width: 0;
}

.user-item-content-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(7rem, 12rem);
  align-items: center;
  gap: var(--spacing-md);
}

.user-item-content-core {
  display: grid;
  grid-template-columns: 1fr minmax(3.25rem, 5rem) 1fr;
  align-items: center;
  gap: var(--spacing-md);
  min-width: 0;
}

.user-item-cell {
  min-width: 0;
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.4;
}

.user-item-content-core .user-item-cell--name {
  justify-self: start;
  text-align: start;
}

.user-item-content-core .user-item-cell--email {
  justify-self: start;
  text-align: start;
}

.user-item-cell--role {
  text-align: start;
}

.user-item-content-core .user-item-cell--gender {
  font-weight: 500;
  color: var(--text-secondary);
  justify-self: center;
  text-align: center;
}

.user-item-actions {
  flex-shrink: 0;
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  align-items: center;
  justify-content: center;
  min-width: 16rem;
}

.user-list-empty {
  margin: var(--spacing-lg) 0 0;
  font-size: var(--font-size-small);
  color: var(--text-tertiary);
  text-align: center;
}

/* 与系统 btn-secondary / 深色主题一致：描边、青字 hover，删除为淡红 */
.btn-account {
  padding: 8px 18px;
  border-radius: 999px;
  border: 1px solid var(--border-medium);
  background: var(--bg-tertiary);
  color: var(--text-primary);
  font-size: var(--font-size-small);
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease;
}

.btn-account:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
  background: rgba(0, 229, 255, 0.08);
}

.btn-account--danger {
  border-color: rgba(239, 68, 68, 0.35);
  color: #fca5a5;
  background: rgba(239, 68, 68, 0.1);
}

.btn-account--danger:hover {
  border-color: rgba(239, 68, 68, 0.55);
  color: #fecaca;
  background: rgba(239, 68, 68, 0.18);
}

.role-modal-body {
  padding: 8px 0;
}

.role-modal-user {
  margin: 0 0 12px;
  color: var(--text-secondary);
  font-size: var(--font-size-small);
}

.role-select {
  width: 100%;
}

.password-input {
  width: 100%;
}

.delete-confirm-text {
  margin: 0;
  color: var(--text-primary);
  font-size: var(--font-size-base);
}
</style>
