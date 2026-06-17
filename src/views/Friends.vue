<template>
  <div class="friends-page">
    <div class="page-header">
      <h1 class="page-title">我的好友</h1>
    </div>

    <div class="tab-bar">
      <div class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === tab.key }"
          @click="setTab(tab.key)"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <div class="friends-body">
      <!-- 收到的申请 -->
      <div v-show="activeTab === 'incoming'" class="panel">
        <div v-if="loading && !incoming.length" class="state-box">
          <div class="loader-ring"></div>
        </div>
        <div v-else-if="incoming.length === 0" class="state-box empty-state">
          <p>暂无收到的好友申请</p>
        </div>
        <div v-else class="request-list">
          <div
            v-for="req in incoming"
            :key="req.id"
            class="request-row"
            :class="{ 'request-row--highlight': highlightId === req.id }"
            :data-request-id="req.id"
          >
            <FriendUserCell mode="simple" :user="req.requester" show-email />
            <span class="request-time">{{ formatDate(req.createdAt) }}</span>
            <div class="request-actions">
              <button type="button" class="btn-secondary btn-compact" :disabled="actingId === req.id" @click="handleReject(req.id)">
                拒绝
              </button>
              <button type="button" class="btn-primary btn-compact" :disabled="actingId === req.id" @click="handleAccept(req.id)">
                {{ actingId === req.id ? '处理中…' : '同意' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 发出的申请 -->
      <div v-show="activeTab === 'outgoing'" class="panel">
        <div v-if="loading && !outgoing.length" class="state-box">
          <div class="loader-ring"></div>
        </div>
        <div v-else-if="outgoing.length === 0" class="state-box empty-state">
          <p>暂无发出的待处理申请</p>
        </div>
        <div v-else class="request-list">
          <div
            v-for="req in outgoing"
            :key="req.id"
            class="request-row"
          >
            <FriendUserCell mode="simple" :user="req.target" show-email />
            <span class="request-time">{{ formatDate(req.createdAt) }}</span>
            <div class="request-actions">
              <button type="button" class="btn-secondary btn-compact" :disabled="actingId === req.id" @click="handleCancel(req.id)">
                {{ actingId === req.id ? '处理中…' : '撤销' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 好友列表 -->
      <div v-show="activeTab === 'list'" class="panel">
        <div v-if="loading && !friends.length" class="state-box">
          <div class="loader-ring"></div>
        </div>
        <div v-else-if="friends.length === 0" class="state-box empty-state">
          <p>暂无好友</p>
        </div>
        <div v-else class="friend-list">
          <div
            v-for="u in friends"
            :key="u.id"
            class="friend-item friend-item--with-chat"
          >
            <div
              class="friend-row friend-row--clickable friend-row--main"
              role="button"
              tabindex="0"
              :aria-label="`查看 ${displayNameFor(u)} 的资料与备注`"
              @click="openFriendDetail(u)"
              @keydown.enter.prevent="openFriendDetail(u)"
              @keydown.space.prevent="openFriendDetail(u)"
            >
              <FriendUserCell mode="profile" :user="u" :remark="u.remark ?? undefined" />
            </div>
            <button
              type="button"
              class="btn-secondary btn-compact friend-chat-btn"
              :disabled="openingChatId === u.id"
              @click.stop="openChatWithFriend(u)"
            >
              {{ openingChatId === u.id ? '…' : '聊天' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 好友资料与备注 -->
    <n-modal
      v-model:show="detailVisible"
      preset="card"
      :title="detailUser ? displayNameFor(detailUser) : '资料'"
      style="width: 480px; max-width: 92vw"
      :mask-closable="!savingRemark"
      @after-leave="onDetailModalLeave"
    >
      <div v-if="detailUser" class="friend-detail">
        <dl class="detail-dl">
          <div class="detail-row">
            <dt>邮箱</dt>
            <dd class="detail-value">{{ detailUser.email || '—' }}</dd>
          </div>
          <div class="detail-row">
            <dt>性别</dt>
            <dd class="detail-value">{{ genderLabel(detailUser.gender) }}</dd>
          </div>
          <div class="detail-row detail-row--multiline">
            <dt>个性签名</dt>
            <dd class="detail-value detail-signature">{{ detailUser.signature?.trim() || '暂无简介' }}</dd>
          </div>
          <div class="detail-row detail-row--remark">
            <dt>备注</dt>
            <dd class="detail-remark-controls">
              <n-input
                v-model:value="detailRemarkDraft"
                type="text"
                placeholder="备注名"
                clearable
                :maxlength="512"
                :disabled="savingRemark"
                class="detail-remark-input"
                @blur="onRemarkBlur"
                @keydown.enter.prevent="onRemarkEnter"
              />
            </dd>
          </div>
        </dl>
      </div>
    </n-modal>

    <!-- 与首页一致：主按钮「+」、次按钮「刷新」（自下而上：刷新靠屏底，+ 在其上方） -->
    <div class="friends-fab-wrap">
      <button
        type="button"
        class="global-fab global-fab-primary"
        title="添加好友"
        @click="addModalVisible = true"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
      <button
        type="button"
        class="global-fab global-fab-secondary"
        title="刷新"
        :disabled="isRefreshing"
        @click="handleRefreshAll"
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
          <polyline points="23 4 23 10 17 10"/>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
      </button>
    </div>

    <n-modal
      v-model:show="addModalVisible"
      preset="card"
      title="添加好友"
      style="width: 420px; max-width: 92vw"
      :mask-closable="!submittingAdd"
      @after-leave="onAddModalLeave"
    >
      <p class="add-modal-hint">
        输入对方注册邮箱发起好友申请
      </p>
      <div class="add-modal-row">
        <n-input
          v-model:value="emailInput"
          type="text"
          placeholder="对方邮箱"
          class="add-modal-input"
          :disabled="submittingAdd"
          @keyup.enter="handleAddByEmail"
        />
        <button
          type="button"
          class="btn-primary add-modal-submit"
          :disabled="submittingAdd || !emailInput.trim()"
          @click="handleAddByEmail"
        >
          {{ submittingAdd ? '发送中…' : '发送申请' }}
        </button>
      </div>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NInput, NModal } from 'naive-ui';
import chatApi from '@/api/chat';
import friendApi, { createDebouncedRemarkSave } from '@/api/friend';
import FriendUserCell from '@/components/FriendUserCell.vue';
import { formatDate } from '@/utils/date';
import { loadFriendRemarks, removeFriendRemarkLocal, setFriendRemarkLocal } from '@/utils/friendRemarkStorage';
import type { FriendRequestVO, FriendUserVO, User } from '@/types';
import '../styles/components.css';

type TabKey = 'incoming' | 'outgoing' | 'list';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'list', label: '好友列表' },
  { key: 'incoming', label: '收到的申请' },
  { key: 'outgoing', label: '发出的申请' },
];

const addModalVisible = ref(false);

const STATUS_ACCEPTED = 1;

const route = useRoute();
const router = useRouter();

const activeTab = ref<TabKey>('list');
const loading = ref(true);
const isRefreshing = ref(false);
const incoming = ref<FriendRequestVO[]>([]);
const outgoing = ref<FriendRequestVO[]>([]);
const friends = ref<FriendUserVO[]>([]);

const detailVisible = ref(false);
const detailUser = ref<FriendUserVO | null>(null);
const detailRemarkDraft = ref('');
const savingRemark = ref(false);

const emailInput = ref('');
const submittingAdd = ref(false);
const actingId = ref<number | null>(null);
const highlightId = ref<number | null>(null);
const openingChatId = ref<number | null>(null);

/**
 * 解析后端 FriendUserVO 中的备注字段（remark / friendRemark 同值；null 表示无备注）。
 * 若对象上无这些字段，视为旧响应，由调用方走 localStorage 兜底。
 */
function remarkFromFriendPayload(u: Record<string, unknown>): {
  hasServerFields: boolean;
  text?: string;
  cleared: boolean;
} {
  const hasRemark = Object.prototype.hasOwnProperty.call(u, 'remark');
  const hasFriendRemark = Object.prototype.hasOwnProperty.call(u, 'friendRemark');
  const hasSnake = Object.prototype.hasOwnProperty.call(u, 'friend_remark');
  if (!hasRemark && !hasFriendRemark && !hasSnake) {
    return { hasServerFields: false, cleared: false };
  }
  const v = u.remark ?? u.friendRemark ?? u.friend_remark;
  if (v === null || v === undefined) return { hasServerFields: true, cleared: true };
  if (typeof v === 'string') {
    const t = v.trim();
    return t ? { hasServerFields: true, cleared: false, text: t } : { hasServerFields: true, cleared: true };
  }
  return { hasServerFields: true, cleared: true };
}

function mergeFriendRemarks(list: FriendUserVO[], localMap: Record<number, string>): FriendUserVO[] {
  return list.map((u) => {
    const p = remarkFromFriendPayload(u as unknown as Record<string, unknown>);
    if (p.hasServerFields) {
      if (p.cleared || !p.text) {
        setFriendRemarkLocal(u.id, '');
        return { ...u, remark: undefined, friendRemark: null };
      }
      removeFriendRemarkLocal(u.id);
      return { ...u, remark: p.text, friendRemark: p.text };
    }
    const local = localMap[u.id];
    const fallback = local ?? u.remark ?? (u.friendRemark != null ? String(u.friendRemark) : undefined);
    return { ...u, remark: fallback, friendRemark: fallback ?? null };
  });
}

function genderLabel(g?: User['gender']): string {
  if (g === 'male') return '男';
  if (g === 'female') return '女';
  if (g === 'unknown') return '未知';
  return '—';
}

function displayNameFor(u: User): string {
  return u.nickname?.trim() || u.username?.trim() || u.email || `用户 ${u.id}`;
}

function parseTab(q: unknown): TabKey | null {
  const t = String(q ?? '');
  if (t === 'incoming' || t === 'outgoing' || t === 'list') return t;
  return null;
}

function parseHighlight(q: unknown): number | null {
  const n = Number(q);
  return Number.isFinite(n) ? n : null;
}

function applyRouteQuery() {
  const tabQ = route.query.tab;
  if (tabQ === 'add') {
    addModalVisible.value = true;
    activeTab.value = 'list';
    const q = { ...route.query } as Record<string, string | string[] | undefined>;
    delete q.tab;
    router.replace({ path: route.path, query: q });
    highlightId.value = parseHighlight(route.query.highlight);
    return;
  }
  const t = parseTab(tabQ);
  if (t) activeTab.value = t;
  highlightId.value = parseHighlight(route.query.highlight);
}

async function loadAll() {
  loading.value = true;
  try {
    const [inc, out, fr] = await Promise.all([
      friendApi.getIncoming(),
      friendApi.getOutgoing(),
      friendApi.getFriends(),
    ]);
    incoming.value = inc ?? [];
    outgoing.value = out ?? [];
    const localMap = loadFriendRemarks();
    friends.value = mergeFriendRemarks((fr ?? []) as FriendUserVO[], localMap);
  } finally {
    loading.value = false;
  }
}

function serverRemarkText(u: FriendUserVO): string {
  return (u.remark ?? u.friendRemark ?? '').toString().trim();
}

/** 草稿与当前 detailUser 中已落库的备注一致时跳过 PATCH */
function isDraftSyncedWithServer(u: FriendUserVO, draft: string): boolean {
  const t = draft.trim();
  const s = serverRemarkText(u);
  if (t === '' && s === '') return true;
  return t === s;
}

/** PATCH 备注；防抖/失焦调用时不弹成功 Toast，仅手动保存、回车成功时提示 */
async function persistFriendRemark(options?: { showSuccessToast?: boolean }) {
  const u = detailUser.value;
  if (!detailVisible.value || !u) return;
  const draft = detailRemarkDraft.value;
  if (isDraftSyncedWithServer(u, draft)) return;

  const trimmed = draft.trim();
  if (trimmed.length > 512) {
    window.dispatchEvent(
      new CustomEvent('toast', {
        detail: { type: 'error', title: '备注过长', message: '备注最长 512 个字符' },
      })
    );
    return;
  }
  const payload: string | null = trimmed === '' ? null : trimmed;
  savingRemark.value = true;
  try {
    const updated = await friendApi.updateFriendRemark(u.id, payload);
    removeFriendRemarkLocal(u.id);
    const pr = remarkFromFriendPayload(updated as unknown as Record<string, unknown>);
    const text =
      pr.hasServerFields && !pr.cleared && pr.text
        ? pr.text
        : pr.hasServerFields && pr.cleared
          ? undefined
          : (updated.remark ?? updated.friendRemark) ?? undefined;
    const merged: FriendUserVO = {
      ...u,
      ...updated,
      remark: text ?? undefined,
      friendRemark: text ?? null,
    };
    detailUser.value = merged;
    const idx = friends.value.findIndex((f) => f.id === u.id);
    if (idx >= 0) friends.value[idx] = { ...friends.value[idx], ...merged };
    if (options?.showSuccessToast) {
      window.dispatchEvent(
        new CustomEvent('toast', {
          detail: { type: 'success', title: '已保存', message: '备注已更新' },
        })
      );
    }
  } catch (e) {
    if (payload != null) setFriendRemarkLocal(u.id, payload);
    else setFriendRemarkLocal(u.id, '');
    const merged: FriendUserVO = {
      ...u,
      remark: payload ?? undefined,
      friendRemark: payload,
    };
    detailUser.value = merged;
    const idx = friends.value.findIndex((f) => f.id === u.id);
    if (idx >= 0) friends.value[idx] = { ...friends.value[idx], ...merged };
    window.dispatchEvent(
      new CustomEvent('toast', {
        detail: {
          type: 'warning',
          title: '已暂存',
          message: (e as Error)?.message || '无法同步到服务端，备注已保存在本设备，网络恢复后可再试',
        },
      })
    );
  } finally {
    savingRemark.value = false;
  }
}

const { schedule: scheduleRemarkDebounced, cancel: cancelRemarkDebounced } = createDebouncedRemarkSave(
  () => {
    void persistFriendRemark({ showSuccessToast: false });
  },
  600
);

watch(detailRemarkDraft, () => {
  if (!detailVisible.value || !detailUser.value) return;
  scheduleRemarkDebounced();
});

async function onRemarkBlur() {
  cancelRemarkDebounced();
  await persistFriendRemark({ showSuccessToast: false });
}

async function onRemarkEnter() {
  cancelRemarkDebounced();
  await persistFriendRemark({ showSuccessToast: true });
}

/** 资料直接来自 GET /api/friends 的 FriendUserVO，避免再请求 GET /users/{id} 触发全局错误提示 */
async function openChatWithFriend(u: FriendUserVO) {
  if (openingChatId.value != null) return;
  openingChatId.value = u.id;
  try {
    const conv = await chatApi.open({ peerUserId: u.id });
    await router.push({ name: 'ChatThread', params: { conversationId: String(conv.id) } });
  } catch (e) {
    window.dispatchEvent(
      new CustomEvent('toast', {
        detail: { type: 'error', title: '无法打开会话', message: (e as Error)?.message || '请稍后重试' },
      })
    );
  } finally {
    openingChatId.value = null;
  }
}

function openFriendDetail(u: FriendUserVO) {
  cancelRemarkDebounced();
  const listRemark = u.remark?.trim() || (u.friendRemark != null ? String(u.friendRemark).trim() : '');
  detailUser.value = { ...u };
  detailRemarkDraft.value = listRemark;
  detailVisible.value = true;
}

function onDetailModalLeave() {
  cancelRemarkDebounced();
  detailUser.value = null;
  detailRemarkDraft.value = '';
}

function onAddModalLeave() {
  emailInput.value = '';
}

function setTab(key: TabKey) {
  activeTab.value = key;
  const q = { ...route.query, tab: key } as Record<string, string | string[]>;
  if (key !== 'incoming') {
    delete q.highlight;
    highlightId.value = null;
  }
  router.replace({ query: q });
}

async function handleRefreshAll() {
  if (isRefreshing.value) return;
  isRefreshing.value = true;
  try {
    await loadAll();
  } finally {
    isRefreshing.value = false;
  }
}

async function handleAddByEmail() {
  const email = emailInput.value.trim();
  if (!email || submittingAdd.value) return;
  submittingAdd.value = true;
  try {
    const vo = await friendApi.requestByEmail(email);
    if (vo.status === STATUS_ACCEPTED) {
      window.dispatchEvent(
        new CustomEvent('toast', {
          detail: { type: 'success', title: '已互为好友', message: '对方曾向你发起申请，已自动通过。' },
        })
      );
    } else {
      window.dispatchEvent(
        new CustomEvent('toast', {
          detail: { type: 'success', title: '已发送', message: '已发送，等待对方同意' },
        })
      );
    }
    emailInput.value = '';
    addModalVisible.value = false;
    await loadAll();
    setTab('outgoing');
  } catch (e) {
    const msg = (e as Error)?.message ?? '操作失败';
    window.dispatchEvent(
      new CustomEvent('toast', {
        detail: { type: 'error', title: '无法发送', message: msg },
      })
    );
  } finally {
    submittingAdd.value = false;
  }
}

async function handleAccept(id: number) {
  if (actingId.value != null) return;
  actingId.value = id;
  try {
    await friendApi.accept(id);
    window.dispatchEvent(
      new CustomEvent('toast', { detail: { type: 'success', title: '已同意', message: '已添加为好友' } })
    );
    await loadAll();
    if (highlightId.value === id) highlightId.value = null;
  } catch (e) {
    window.dispatchEvent(
      new CustomEvent('toast', {
        detail: { type: 'error', title: '操作失败', message: (e as Error)?.message ?? '请稍后重试' },
      })
    );
  } finally {
    actingId.value = null;
  }
}

async function handleReject(id: number) {
  if (actingId.value != null) return;
  actingId.value = id;
  try {
    await friendApi.reject(id);
    window.dispatchEvent(
      new CustomEvent('toast', { detail: { type: 'success', title: '已拒绝', message: '已拒绝该好友申请' } })
    );
    await loadAll();
    if (highlightId.value === id) highlightId.value = null;
  } catch (e) {
    window.dispatchEvent(
      new CustomEvent('toast', {
        detail: { type: 'error', title: '操作失败', message: (e as Error)?.message ?? '请稍后重试' },
      })
    );
  } finally {
    actingId.value = null;
  }
}

async function handleCancel(id: number) {
  if (actingId.value != null) return;
  actingId.value = id;
  try {
    await friendApi.cancel(id);
    window.dispatchEvent(
      new CustomEvent('toast', { detail: { type: 'success', title: '已撤销', message: '已撤销该好友申请' } })
    );
    await loadAll();
  } catch (e) {
    window.dispatchEvent(
      new CustomEvent('toast', {
        detail: { type: 'error', title: '操作失败', message: (e as Error)?.message ?? '请稍后重试' },
      })
    );
  } finally {
    actingId.value = null;
  }
}

function scrollToHighlight() {
  if (highlightId.value == null) return;
  nextTick(() => {
    const el = document.querySelector(`[data-request-id="${highlightId.value}"]`);
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
}

watch(
  () => route.query,
  () => {
    applyRouteQuery();
    scrollToHighlight();
  },
  { deep: true }
);

onMounted(() => {
  applyRouteQuery();
  loadAll().then(() => {
    scrollToHighlight();
  });
});
</script>

<style scoped>
.friends-page {
  padding: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
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

.tab-bar {
  margin-bottom: var(--spacing-md);
}

.tabs {
  display: flex;
  gap: 0;
  border-bottom: 2px solid var(--border-subtle);
  flex-wrap: wrap;
}

.tab-btn {
  position: relative;
  padding: 10px 16px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: var(--font-size-base);
  cursor: pointer;
  margin-bottom: -2px;
}

.tab-btn:hover {
  color: var(--text-primary);
}

.tab-btn.active {
  color: var(--accent-primary);
  font-weight: 600;
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -2px;
  height: 2px;
  background: var(--accent-primary);
}

.friends-body {
  flex: 1;
  min-height: 0;
}

.panel {
  padding: 0 0 var(--spacing-lg);
}

.panel-hint {
  margin: 0 0 var(--spacing-md);
  font-size: var(--font-size-small);
  color: var(--text-tertiary);
  line-height: 1.5;
}

.add-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.add-input {
  flex: 1;
  min-width: 200px;
  max-width: 400px;
}

.state-box {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 160px;
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

.empty-state p {
  margin: 0;
  color: var(--text-tertiary);
}

.request-list,
.friend-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.friend-item--with-chat {
  display: flex;
  align-items: stretch;
  gap: 10px;
  padding: 0;
  overflow: hidden;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
}

.friend-item--with-chat .friend-row--main {
  flex: 1;
  min-width: 0;
  border: none;
  border-radius: 0;
  background: transparent;
}

.friend-chat-btn {
  flex-shrink: 0;
  align-self: center;
  margin-right: var(--spacing-md);
}

.request-row,
.friend-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
}

.friend-row--clickable {
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.friend-row--clickable:hover {
  background: var(--bg-tertiary);
  border-color: var(--border-medium);
}

.friend-row--clickable:focus {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

.friend-row :deep(.friend-user-cell) {
  flex: 1;
  min-width: 0;
}

.friend-detail {
  padding-top: 4px;
}

.detail-loading {
  margin: 0;
  color: var(--text-tertiary);
  font-size: var(--font-size-small);
}

.detail-dl {
  margin: 0 0 var(--spacing-md);
}

.detail-row {
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 8px 12px;
  align-items: start;
  margin-bottom: 10px;
  font-size: var(--font-size-small);
}

.detail-row dt {
  margin: 0;
  color: var(--text-tertiary);
}

.detail-row dd {
  margin: 0;
  word-break: break-word;
}

/** 邮箱、性别、个性签名、备注输入等展示为高亮强调色 */
.detail-value {
  color: var(--accent-primary);
  font-weight: 500;
}

.detail-row--multiline {
  align-items: start;
}

.detail-row--multiline dt {
  padding-top: 2px;
}

.detail-signature {
  white-space: pre-wrap;
  line-height: 1.5;
}

.detail-row--remark {
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--border-subtle);
  align-items: center;
}

.detail-remark-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
}

.detail-remark-input {
  flex: 1;
  min-width: 0;
  max-width: none;
}

/** 与标签同字号，输入文字与「值」同色，避免突兀 */
.detail-remark-input :deep(.n-input-wrapper) {
  font-size: var(--font-size-small);
}

.detail-remark-input :deep(.n-input__input-el) {
  font-size: inherit;
  line-height: 1.45;
  color: var(--accent-primary);
  font-weight: 500;
}

.detail-remark-input :deep(.n-input__input-el::placeholder) {
  color: var(--text-tertiary);
  font-weight: 400;
}

.request-row--highlight {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 1px var(--accent-primary);
  animation: highlight-fade 2s ease 0.5s forwards;
}

@keyframes highlight-fade {
  to {
    box-shadow: none;
    border-color: var(--border-subtle);
  }
}

.request-row :deep(.friend-user-cell) {
  flex: 1;
  min-width: 0;
}

.request-time {
  flex-shrink: 0;
  font-size: var(--font-size-small);
  color: var(--text-tertiary);
}

.request-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.btn-compact {
  padding: 6px 14px;
  font-size: var(--font-size-small);
}

/* 与 MainLayout 全局 FAB 一致：列布局、间距、主/次按钮样式 */
.friends-fab-wrap {
  position: fixed;
  right: var(--spacing-lg);
  bottom: var(--spacing-lg);
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.friends-fab-wrap .global-fab {
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

.friends-fab-wrap .global-fab:hover:not(:disabled) {
  transform: scale(1.06);
  box-shadow: var(--shadow-hover);
}

.friends-fab-wrap .global-fab:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.friends-fab-wrap .global-fab-primary {
  background: var(--accent-gradient);
  color: var(--primary-foreground, #fff);
}

.friends-fab-wrap .global-fab-secondary {
  background: var(--bg-secondary);
  color: var(--accent-primary);
  border: 1px solid var(--accent-neon-border);
}

.friends-fab-wrap .global-fab-secondary:hover:not(:disabled) {
  background: var(--bg-tertiary);
  border-color: var(--accent-primary);
}

.friends-fab-wrap .global-fab-secondary svg.spinning {
  animation: spin 0.6s linear infinite;
}

.add-modal-hint {
  margin: 0 0 12px;
  font-size: var(--font-size-small);
  color: var(--text-tertiary);
  line-height: 1.5;
}

.add-modal-row {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.add-modal-submit {
  width: 100%;
}
</style>
