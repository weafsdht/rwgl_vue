<template>
  <div class="teams-page">
    <div class="page-header">
      <h1 class="page-title">团队</h1>
      <button
        v-if="isPM"
        type="button"
        class="btn-primary"
        :disabled="creating"
        @click="openCreate"
      >
        <span v-if="!creating">新建团队</span>
        <span v-else class="loading-spinner"></span>
      </button>
    </div>

    <div v-if="loading" class="loading">
      <div class="loader-ring"></div>
    </div>
    <div v-else-if="teams.length === 0" class="empty-state">
      <p class="empty-text">{{ isPM ? '暂无团队，点击上方「新建团队」创建' : '暂无团队，等待被邀请加入' }}</p>
    </div>
    <div v-else class="team-list">
      <router-link
        v-for="t in teams"
        :key="t.id"
        :to="{ name: 'TeamDetail', params: { id: t.id } }"
        class="team-card"
      >
        <span class="team-card-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </span>
        <div class="team-card-content">
          <span class="team-card-name">{{ t.name }}</span>
          <span class="team-card-meta">{{ t.memberCount ?? 0 }} 人 · {{ t.isAdmin ? '管理员' : '成员' }}</span>
        </div>
        <svg class="team-card-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
      </router-link>
    </div>

    <FormModal
      v-model="showCreateModal"
      title="新建团队"
      confirm-text="创 建"
      cancel-text="取 消"
      :loading="creating"
      @confirm="handleCreate"
    >
      <div class="form-body">
        <div class="form-row">
          <span class="form-label">团队名称</span>
          <n-input v-model:value="createForm.name" placeholder="请输入团队名称" class="form-input" />
        </div>
        <div class="form-row">
          <span class="form-label">描述</span>
          <n-input v-model:value="createForm.description" type="textarea" placeholder="选填" class="form-input" />
        </div>
      </div>
    </FormModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { NInput } from 'naive-ui';
import FormModal from '@/components/FormModal.vue';
import { useTeamStore } from '@/stores/team';
import { useUserStore } from '@/stores/user';
import { isProjectManager } from '@/constants/role';
import teamApi from '@/api/team';
import type { Team } from '@/types';
import '../styles/components.css';

const teamStore = useTeamStore();
const userStore = useUserStore();
const loading = ref(true);
const teams = ref<Team[]>([]);
const showCreateModal = ref(false);
const creating = ref(false);
const createForm = ref({ name: '', description: '' });

const isPM = computed(() => isProjectManager(userStore.user?.role));

async function loadTeams() {
  loading.value = true;
  try {
    const list = await teamApi.getMyTeams().catch(() => []);
    teams.value = list ?? [];
    teamStore.myTeams = list ?? [];
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  createForm.value = { name: '', description: '' };
  showCreateModal.value = true;
}

async function handleCreate() {
  const name = createForm.value.name?.trim();
  if (!name) {
    window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'error', title: '提示', message: '请输入团队名称' } }));
    return false;
  }
  creating.value = true;
  try {
    await teamApi.createTeam({ name, description: createForm.value.description?.trim() || undefined });
    showCreateModal.value = false;
    await loadTeams();
    teamStore.fetchMyTeams().catch(() => {});
    window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'success', title: '已创建', message: '团队已创建' } }));
  } catch (e) {
    window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'error', title: '创建失败', message: (e as Error)?.message ?? '请稍后重试' } }));
    return false;
  } finally {
    creating.value = false;
  }
}

onMounted(() => {
  loadTeams();
});
</script>

<style scoped>
.teams-page { padding: 0; }
.page-header { margin-bottom: var(--spacing-md); }
.page-title { margin: 0 0 var(--spacing-xs); font-size: var(--font-size-h1); font-weight: 700; color: var(--text-primary); }
.page-desc { margin: 0 0 var(--spacing-md); font-size: var(--font-size-small); color: var(--text-tertiary); }
.loading { display: flex; align-items: center; justify-content: center; min-height: 200px; }
.loader-ring { width: 40px; height: 40px; border: 3px solid var(--border-medium); border-top-color: var(--accent-primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty-state { padding: var(--spacing-xl); text-align: center; }
.empty-text { color: var(--text-tertiary); margin: 0; }
.team-list { display: flex; flex-direction: column; gap: 8px; }
.team-card { display: flex; align-items: center; gap: var(--spacing-md); padding: var(--spacing-md) var(--spacing-lg); background: var(--bg-secondary); border-radius: var(--radius-lg); border: 1px solid var(--border-subtle); text-decoration: none; color: inherit; transition: background 0.2s; }
.team-card:hover { background: var(--bg-tertiary); }
.team-card-icon { flex-shrink: 0; width: 44px; height: 44px; border-radius: 10px; background: rgba(37, 99, 235, 0.15); color: #2563eb; display: flex; align-items: center; justify-content: center; }
.team-card-content { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.team-card-name { font-weight: 600; color: var(--text-primary); }
.team-card-meta { font-size: var(--font-size-small); color: var(--text-tertiary); }
.team-card-chevron { flex-shrink: 0; color: var(--text-tertiary); width: 20px; height: 20px; }
.form-body { padding: 8px 0; }
.form-row { margin-bottom: var(--spacing-sm); }
.form-row:last-child { margin-bottom: 0; }
.form-label { display: block; margin-bottom: 4px; font-size: var(--font-size-small); color: var(--text-secondary); }
.form-input { width: 100%; }
.btn-primary { padding: 10px 20px; border-radius: 10px; border: none; background: var(--accent-primary); color: #fff; font-size: var(--font-size-base); cursor: pointer; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.loading-spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; }
</style>
