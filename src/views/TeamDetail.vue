<template>
  <div class="team-detail-page">
    <div class="page-header team-header">
      <router-link to="/teams" class="back-btn">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        返回
      </router-link>

      <div class="team-title-block">
        <div class="team-title-text">
          <h1 class="team-name">{{ team?.name ?? '团队' }}</h1>
          <p v-if="team?.description" class="team-subtitle">{{ team.description }}</p>
        </div>
      </div>

      <button
        v-if="team && canInvite"
        type="button"
        class="btn-invite-header"
        @click="showInviteModal = true"
      >
        <svg class="btn-invite-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="8.5" cy="7" r="4"/>
          <line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
        </svg>
        添加成员
      </button>
    </div>

    <div v-if="loading" class="loading">
      <div class="loader-ring"></div>
    </div>
    <div v-else-if="!team" class="empty-state">
      <p class="empty-text">团队不存在或无权限</p>
    </div>
    <div v-else>
      <section class="section">
        <h2 class="section-title">成员 ({{ members.length }})</h2>
        <div class="member-list">
          <div v-for="m in members" :key="m.id" class="member-card" :class="{ expanded: expandedMemberId === m.userId }">
            <div class="member-item" @click="toggleMember(m)">
              <span
                class="member-avatar"
                :class="{ 'member-avatar--has-img': memberAvatarSrc(m) && !memberAvatarError[m.userId] }"
              >
                <img
                  v-if="memberAvatarSrc(m) && !memberAvatarError[m.userId]"
                  :src="memberAvatarSrc(m)"
                  alt=""
                  @error="onMemberAvatarError(m.userId)"
                />
                <span v-else class="member-avatar-initial">{{
                  (m.nickname || m.email || '?').trim()[0].toUpperCase()
                }}</span>
              </span>
              <div class="member-info">
                <span class="member-name">{{ m.nickname || m.email }}</span>
                <span class="member-meta">{{ m.email }} · {{ m.status === 'pending' ? '待接受' : '已加入' }}</span>
              </div>
              <div class="member-stats-mini" v-if="memberDataMap[m.userId]">
                <span class="mini-stat">
                  <span class="mini-stat-num">{{ memberDataMap[m.userId].totalTasks }}</span>任务
                </span>
                <span class="mini-stat mini-stat--done">
                  <span class="mini-stat-num">{{ memberDataMap[m.userId].doneTasks }}</span>完成
                </span>
                <span class="mini-stat mini-stat--today">
                  <span class="mini-stat-num">{{ memberDataMap[m.userId].todayTasks }}</span>今日
                </span>
              </div>
              <svg class="member-expand-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
              <button
                v-if="canManage && m.status === 'active'"
                type="button"
                class="btn-account btn-account--danger"
                @click.stop="removeMember(m)"
              >
                移除
              </button>
            </div>

            <!-- 展开的详细信息 -->
            <div v-if="expandedMemberId === m.userId" class="member-detail">
              <div v-if="loadingMemberData" class="member-detail-loading">加载中...</div>
              <template v-else-if="memberDataMap[m.userId]">
                <!-- 统计概览 -->
                <div class="detail-stats">
                  <div class="detail-stat-card">
                    <span class="detail-stat-value">{{ memberDataMap[m.userId].totalTasks }}</span>
                    <span class="detail-stat-label">总任务</span>
                  </div>
                  <div class="detail-stat-card detail-stat-card--doing">
                    <span class="detail-stat-value">{{ memberDataMap[m.userId].doingTasks }}</span>
                    <span class="detail-stat-label">进行中</span>
                  </div>
                  <div class="detail-stat-card detail-stat-card--done">
                    <span class="detail-stat-value">{{ memberDataMap[m.userId].doneTasks }}</span>
                    <span class="detail-stat-label">已完成</span>
                  </div>
                  <div class="detail-stat-card detail-stat-card--overdue">
                    <span class="detail-stat-value">{{ memberDataMap[m.userId].overdueTasks }}</span>
                    <span class="detail-stat-label">已逾期</span>
                  </div>
                  <div class="detail-stat-card detail-stat-card--today">
                    <span class="detail-stat-value">{{ memberDataMap[m.userId].todayTasks }}</span>
                    <span class="detail-stat-label">今日任务</span>
                  </div>
                  <div class="detail-stat-card detail-stat-card--rate">
                    <span class="detail-stat-value">{{ memberDataMap[m.userId].completionRate }}%</span>
                    <span class="detail-stat-label">完成率</span>
                  </div>
                </div>

                <!-- 参与项目 -->
                <div class="detail-section" v-if="memberDataMap[m.userId].projects.length">
                  <h4 class="detail-section-title">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                    参与项目 ({{ memberDataMap[m.userId].projects.length }})
                  </h4>
                  <div class="detail-project-list">
                    <div
                      v-for="p in memberDataMap[m.userId].projects"
                      :key="p.id"
                      class="detail-project-item"
                    >
                      <span class="detail-project-dot" :style="{ background: p.color || 'var(--accent-primary)' }"></span>
                      <span class="detail-project-name">{{ p.name }}</span>
                      <span class="detail-project-count">{{ p.taskCount }} 个任务</span>
                    </div>
                  </div>
                </div>

                <!-- 今日任务 -->
                <div class="detail-section" v-if="memberDataMap[m.userId].todayTaskList.length">
                  <h4 class="detail-section-title">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    今日任务
                  </h4>
                  <div class="detail-task-list">
                    <div v-for="t in memberDataMap[m.userId].todayTaskList" :key="t.id" class="detail-task-item" @click.stop="openTask(t)">
                      <span class="detail-task-status" :class="'status--' + t.status"></span>
                      <span class="detail-task-title">{{ t.title }}</span>
                      <span v-if="t.dueTime" class="detail-task-due" :class="{ overdue: t.isOverdue }">{{ formatDate(t.dueTime) }}</span>
                    </div>
                  </div>
                </div>

                <!-- 全部任务 -->
                <div class="detail-section">
                  <h4 class="detail-section-title">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                    全部任务 ({{ memberDataMap[m.userId].tasks.length }})
                  </h4>
                  <div class="detail-task-list">
                    <div v-for="t in memberDataMap[m.userId].tasks.slice(0, showAllTasks[m.userId] ? undefined : 10)" :key="t.id" class="detail-task-item" @click.stop="openTask(t)">
                      <span class="detail-task-status" :class="'status--' + t.status"></span>
                      <span class="detail-task-title">{{ t.title }}</span>
                      <span v-if="t.projectName" class="detail-task-project">{{ t.projectName }}</span>
                      <span v-if="t.dueTime" class="detail-task-due" :class="{ overdue: t.isOverdue }">{{ formatDate(t.dueTime) }}</span>
                    </div>
                    <button
                      v-if="memberDataMap[m.userId].tasks.length > 10"
                      type="button"
                      class="detail-show-more"
                      @click.stop="showAllTasks[m.userId] = !showAllTasks[m.userId]"
                    >
                      {{ showAllTasks[m.userId] ? '收起' : `查看全部 ${memberDataMap[m.userId].tasks.length} 条` }}
                    </button>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </section>
    </div>

    <FormModal
      v-model="showInviteModal"
      title="添加成员"
      confirm-text="添 加"
      cancel-text="取 消"
      :loading="inviting"
      @confirm="handleInvite"
      @cancel="inviteEmail = ''"
    >
      <p class="invite-modal-hint">输入用户邮箱可直接将其加入团队，无需对方确认。</p>
      <n-input
        v-model:value="inviteEmail"
        placeholder="输入邮箱添加成员"
        class="invite-modal-input"
        type="text"
        autocomplete="email"
      />
    </FormModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { NInput } from 'naive-ui';
import FormModal from '@/components/FormModal.vue';
import teamApi from '@/api/team';
import taskApi from '@/api/task';
import projectApi from '@/api/project';
import { useUserStore } from '@/stores/user';
import { isProjectManager } from '@/constants/role';
import type { Team, TeamMember, Task, Project } from '@/types';
import dayjs from 'dayjs';
import { formatDate } from '@/utils/date';
import { getAvatarUrl } from '@/utils/url';
import { teamMemberToUser } from '@/composables/useProjectAssignees';
import '../styles/components.css';

interface MemberProject {
  id: number;
  name: string;
  color?: string;
  taskCount: number;
}

interface MemberData {
  totalTasks: number;
  doingTasks: number;
  doneTasks: number;
  overdueTasks: number;
  todayTasks: number;
  completionRate: number;
  projects: MemberProject[];
  tasks: Task[];
  todayTaskList: Task[];
}

const route = useRoute();
const userStore = useUserStore();
const teamId = computed(() => Number(route.params.id));
const loading = ref(true);
const team = ref<Team | null>(null);
const members = ref<TeamMember[]>([]);
const inviteEmail = ref('');
const inviting = ref(false);
const showInviteModal = ref(false);
const expandedMemberId = ref<number | null>(null);
const loadingMemberData = ref(false);
const memberDataMap = reactive<Record<number, MemberData>>({});
const showAllTasks = reactive<Record<number, boolean>>({});
/** 成员头像加载失败时回退首字母 */
const memberAvatarError = reactive<Record<number, boolean>>({});

function memberAvatarSrc(m: TeamMember): string {
  return getAvatarUrl(teamMemberToUser(m).avatar);
}

function onMemberAvatarError(userId: number) {
  memberAvatarError[userId] = true;
}

const canInvite = computed(() => isProjectManager(userStore.user?.role) || !!team.value?.isAdmin);
const canManage = computed(() => team.value?.isAdmin);

async function loadTeam() {
  if (!teamId.value) return;
  loading.value = true;
  try {
    team.value = await teamApi.getTeam(teamId.value);
    members.value = await teamApi.getTeamMembers(teamId.value);
    for (const k of Object.keys(memberAvatarError)) {
      delete memberAvatarError[Number(k)];
    }
  } catch {
    team.value = null;
    members.value = [];
  } finally {
    loading.value = false;
  }
}

async function toggleMember(m: TeamMember) {
  if (expandedMemberId.value === m.userId) {
    expandedMemberId.value = null;
    return;
  }
  expandedMemberId.value = m.userId;
  if (memberDataMap[m.userId]) return;
  await loadMemberData(m.userId);
}

async function loadMemberData(userId: number) {
  loadingMemberData.value = true;
  try {
    const [allTasks, allProjects] = await Promise.all([
      taskApi.getTasks(undefined, { skipGlobalError: true }).catch(() => [] as Task[]),
      projectApi.getProjects().catch(() => [] as Project[]),
    ]);

    const myTasks = allTasks.filter(
      (t) => t.assigneeId === userId || (t.assigneeIds ?? []).includes(userId)
    );

    const today = dayjs().format('YYYY-MM-DD');
    const todayTaskList = myTasks.filter((t) => {
      const due = t.dueTime ? dayjs(t.dueTime).format('YYYY-MM-DD') : '';
      const start = t.startTime ? dayjs(t.startTime).format('YYYY-MM-DD') : '';
      return due === today || start === today;
    });

    const doingTasks = myTasks.filter((t) => t.status === 'doing').length;
    const doneTasks = myTasks.filter((t) => t.status === 'done').length;
    const overdueTasks = myTasks.filter((t) => t.isOverdue && t.status !== 'done').length;
    const totalTasks = myTasks.length;
    const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    const projectMap = new Map<number, MemberProject>();
    for (const t of myTasks) {
      if (t.projectId) {
        if (!projectMap.has(t.projectId)) {
          const p = allProjects.find((pr) => pr.id === t.projectId);
          projectMap.set(t.projectId, {
            id: t.projectId,
            name: t.projectName || p?.name || `项目 #${t.projectId}`,
            color: t.projectColor || (p as Project & { color?: string })?.color,
            taskCount: 0,
          });
        }
        projectMap.get(t.projectId)!.taskCount++;
      }
    }

    memberDataMap[userId] = {
      totalTasks,
      doingTasks,
      doneTasks,
      overdueTasks,
      todayTasks: todayTaskList.length,
      completionRate,
      projects: Array.from(projectMap.values()),
      tasks: myTasks.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')),
      todayTaskList,
    };
  } catch {
    memberDataMap[userId] = {
      totalTasks: 0, doingTasks: 0, doneTasks: 0, overdueTasks: 0, todayTasks: 0,
      completionRate: 0, projects: [], tasks: [], todayTaskList: [],
    };
  } finally {
    loadingMemberData.value = false;
  }
}

function openTask(task: Task) {
  window.dispatchEvent(new CustomEvent('open-edit-task', { detail: { task } }));
}

async function handleInvite() {
  const email = inviteEmail.value?.trim();
  if (!email || !team.value) return false;
  inviting.value = true;
  try {
    await teamApi.inviteMember(team.value.id, email);
    inviteEmail.value = '';
    members.value = await teamApi.getTeamMembers(team.value.id);
    showInviteModal.value = false;
    window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'success', title: '已添加', message: email + ' 已加入团队' } }));
  } catch (e) {
    window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'error', title: '添加失败', message: (e as Error)?.message ?? '请稍后重试' } }));
    return false;
  } finally {
    inviting.value = false;
  }
  return true;
}

async function removeMember(m: TeamMember) {
  if (!team.value || m.status !== 'active') return;
  if (!confirm(`确定将 ${m.nickname || m.email} 移出团队？`)) return;
  try {
    await teamApi.removeMember(team.value.id, m.id);
    members.value = await teamApi.getTeamMembers(team.value.id);
    window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'success', title: '已移除' } }));
  } catch (e) {
    window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'error', title: '操作失败', message: (e as Error)?.message } }));
  }
}

onMounted(() => loadTeam());
watch(teamId, () => loadTeam());
</script>

<style scoped>
.team-detail-page { padding: 0; }
.back-btn {
  display: inline-flex; align-items: center; gap: 4px; padding: 6px 16px 6px 10px;
  border-radius: 20px; background: var(--accent-primary); color: var(--primary-foreground); font-size: var(--font-size-small);
  font-weight: 500; text-decoration: none; cursor: pointer; transition: opacity 0.2s; margin-bottom: var(--spacing-sm);
}
.back-btn:hover { opacity: 0.85; }
.back-btn svg { flex-shrink: 0; }
.team-header {
  display: flex; align-items: center; justify-content: space-between; gap: var(--spacing-md);
}
.team-title-block { margin: 0 auto; display: flex; align-items: center; gap: 12px; }
.team-title-text { display: flex; flex-direction: column; gap: 2px; }
.team-name { margin: 0; font-size: 22px; font-weight: 700; color: var(--text-primary); }
.team-subtitle { margin: 0; font-size: 12px; color: var(--text-tertiary); }
.btn-invite-header { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: var(--radius-md); border: 1px solid var(--accent-primary); background: rgba(0, 229, 255, 0.1); color: var(--accent-primary); font-size: var(--font-size-base); font-weight: 500; cursor: pointer; transition: all 0.2s; }
.btn-invite-header:hover { background: var(--accent-primary); color: var(--primary-foreground); box-shadow: 0 0 16px rgba(0, 229, 255, 0.3); }
.btn-invite-icon { flex-shrink: 0; }
.loading { display: flex; align-items: center; justify-content: center; min-height: 200px; }
.loader-ring { width: 40px; height: 40px; border: 3px solid var(--border-medium); border-top-color: var(--accent-primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty-state { padding: var(--spacing-xl); }
.empty-text { color: var(--text-tertiary); margin: 0; }
.section { margin-bottom: var(--spacing-xl); }
.section-title { margin: 0 0 var(--spacing-md); font-size: 1rem; font-weight: 600; color: var(--text-primary); }

/* 成员列表 */
.member-list { display: flex; flex-direction: column; gap: 6px; }
.member-card {
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  background: var(--bg-secondary);
  overflow: hidden;
  transition: border-color 0.2s;
}
.member-card.expanded {
  border-color: var(--accent-neon-border);
}
.member-item {
  display: flex; align-items: center; gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  cursor: pointer;
  transition: background 0.15s;
}
.member-item:hover { background: var(--bg-hover); }
.member-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(0, 229, 255, 0.15);
  color: var(--accent-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
  font-size: 14px;
  overflow: hidden;
}
.member-avatar--has-img {
  padding: 0;
  background: transparent;
}
.member-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.member-avatar-initial {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
.member-info { flex: 1; min-width: 0; }
.member-name { font-weight: 600; color: var(--text-primary); display: block; }
.member-meta { font-size: var(--font-size-small); color: var(--text-tertiary); display: block; }

/* 迷你统计 */
.member-stats-mini { display: flex; gap: 10px; }
.mini-stat { font-size: var(--font-size-small); color: var(--text-tertiary); }
.mini-stat-num { font-weight: 700; margin-right: 2px; color: var(--text-secondary); }
.mini-stat--done .mini-stat-num { color: var(--success); }
.mini-stat--today .mini-stat-num { color: var(--accent-primary); }

.member-expand-icon {
  flex-shrink: 0; color: var(--text-tertiary); transition: transform 0.2s;
}
.member-card.expanded .member-expand-icon {
  transform: rotate(180deg);
}

.btn-account { padding: 6px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-medium); background: var(--bg-tertiary); color: var(--text-primary); font-size: var(--font-size-small); cursor: pointer; }
.btn-account--danger:hover { border-color: var(--danger); color: var(--danger); }

/* 展开详情 */
.member-detail {
  padding: 0 var(--spacing-md) var(--spacing-md);
  border-top: 1px solid var(--border-subtle);
}
.member-detail-loading {
  padding: var(--spacing-md); color: var(--text-tertiary); text-align: center; font-size: var(--font-size-small);
}

/* 统计卡片 */
.detail-stats {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 8px;
  padding-top: var(--spacing-md);
}
.detail-stat-card {
  background: var(--bg-tertiary); border-radius: var(--radius-sm); padding: 10px 12px;
  text-align: center; border: 1px solid var(--border-subtle);
}
.detail-stat-value { display: block; font-size: 20px; font-weight: 700; color: var(--text-primary); }
.detail-stat-label { font-size: 11px; color: var(--text-tertiary); margin-top: 2px; display: block; }
.detail-stat-card--doing .detail-stat-value { color: var(--color-status-doing); }
.detail-stat-card--done .detail-stat-value { color: var(--success); }
.detail-stat-card--overdue .detail-stat-value { color: var(--danger); }
.detail-stat-card--today .detail-stat-value { color: var(--accent-primary); }
.detail-stat-card--rate .detail-stat-value { color: var(--chart-4, #7c4dff); }

/* 详情区块 */
.detail-section { margin-top: var(--spacing-md); }
.detail-section-title {
  margin: 0 0 8px; font-size: 13px; font-weight: 600; color: var(--text-secondary);
  display: flex; align-items: center; gap: 6px;
}
.detail-section-title svg { flex-shrink: 0; color: var(--accent-primary); }

/* 项目列表 */
.detail-project-list { display: flex; flex-direction: column; gap: 4px; }
.detail-project-item {
  display: flex; align-items: center; gap: 8px; padding: 6px 10px;
  border-radius: var(--radius-sm); background: var(--bg-tertiary); font-size: 13px;
}
.detail-project-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.detail-project-name { flex: 1; color: var(--text-primary); font-weight: 500; }
.detail-project-count { color: var(--text-tertiary); font-size: 12px; }

/* 任务列表 */
.detail-task-list { display: flex; flex-direction: column; gap: 3px; }
.detail-task-item {
  display: flex; align-items: center; gap: 8px; padding: 5px 10px;
  border-radius: var(--radius-sm); background: var(--bg-tertiary); font-size: 13px;
  cursor: pointer; transition: background 0.15s, border-color 0.15s;
  border: 1px solid transparent;
}
.detail-task-item:hover {
  background: var(--bg-hover); border-color: var(--accent-neon-border);
}
.detail-task-status {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
}
.detail-task-status.status--todo { background: var(--color-status-todo); }
.detail-task-status.status--doing { background: var(--color-status-doing); }
.detail-task-status.status--done { background: var(--color-status-done); }
.detail-task-status.status--stalled { background: var(--color-status-stalled); }

.detail-task-title { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text-primary); }
.detail-task-project { font-size: 11px; color: var(--text-tertiary); background: var(--bg-hover); padding: 1px 6px; border-radius: 4px; flex-shrink: 0; }
.detail-task-due { font-size: 11px; color: var(--text-tertiary); flex-shrink: 0; }
.detail-task-due.overdue { color: var(--danger); }

.detail-show-more {
  margin-top: 6px; padding: 6px; width: 100%; border: 1px dashed var(--border-subtle);
  border-radius: var(--radius-sm); background: transparent; color: var(--accent-primary);
  font-size: 12px; cursor: pointer; transition: all 0.15s;
}
.detail-show-more:hover { background: rgba(0, 229, 255, 0.06); border-color: var(--accent-neon-border); }

.invite-modal-hint { margin: 0 0 var(--spacing-sm); font-size: var(--font-size-small); color: var(--text-tertiary); }
.invite-modal-input { width: 100%; }
</style>
