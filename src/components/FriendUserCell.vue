<template>
  <div class="friend-user-cell" :class="{ 'friend-user-cell--profile': mode === 'profile' }">
    <div class="friend-user-avatar" :class="{ 'friend-user-avatar--has-img': avatarSrc }">
      <img v-if="avatarSrc" :src="avatarSrc" alt="" @error="onImgError" />
      <span v-else>{{ initial }}</span>
    </div>
    <div class="friend-user-meta">
      <template v-if="mode === 'simple'">
        <span class="friend-user-name">{{ displayTitle }}</span>
        <span v-if="displaySub" class="friend-user-sub">{{ displaySub }}</span>
      </template>
      <template v-else>
        <span class="friend-user-name">{{ displayTitle }}</span>
        <div class="friend-user-signature-row">
          <svg
            class="friend-user-sig-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15a4 4 0 0 1-4 4H8l-5 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" />
            <path d="M8 10h8M8 14h5" />
          </svg>
          <span class="friend-user-signature-text">{{ signatureLine }}</span>
        </div>
        <div
          class="friend-user-presence"
          :class="{ 'friend-user-presence--online': presenceIsOnline }"
        >
          {{ presenceLine }}
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useUserStore } from '@/stores/user';
import { pickAvatarFromPayload } from '@/utils/user';
import { useAuthAvatarUrl } from '@/composables/useAuthAvatarUrl';
import { formatDate, fromNow } from '@/utils/date';
import type { User } from '@/types';

/**
 * 从 FriendUserVO 取「最后在线」时间（与后端 lastActiveAt 同源，多别名任取其一）。
 * 驼峰：lastActiveAt、lastOnlineAt、lastSeenAt；蛇形：last_active_at、last_online_at、last_seen_at。
 */
function pickLastOnlineAt(u: Record<string, unknown>): string | undefined {
  const keys = [
    'lastActiveAt',
    'lastOnlineAt',
    'lastSeenAt',
    'last_active_at',
    'last_online_at',
    'last_seen_at',
  ];
  for (const k of keys) {
    const v = u[k];
    if (v != null && String(v).trim() !== '') return String(v).trim();
  }
  return undefined;
}

const props = withDefaults(
  defineProps<{
    user: User;
    /** 我对好友的备注；有则主标题显示备注 */
    remark?: string;
    /** profile：头像+昵称/备注+签名+在线状态；simple：原有两行（申请列表等） */
    mode?: 'profile' | 'simple';
    /** 额外一行（如时间）；simple 模式用 */
    subtitle?: string;
    /** simple 模式下副行显示邮箱 */
    showEmail?: boolean;
  }>(),
  { remark: '', mode: 'simple', subtitle: '', showEmail: false }
);

const imgBroken = ref(false);

const resolvedPath = computed(() => {
  if (imgBroken.value) return '';
  return pickAvatarFromPayload(props.user as unknown as Record<string, unknown>) || '';
});

const userStore = useUserStore();
const { token } = storeToRefs(userStore);
const { avatarSrc: rawSrc } = useAuthAvatarUrl(resolvedPath, token);

const avatarSrc = computed(() => (imgBroken.value ? undefined : rawSrc.value));

watch(
  () => props.user,
  () => {
    imgBroken.value = false;
  },
  { deep: true }
);

function onImgError() {
  imgBroken.value = true;
}

const displayTitle = computed(() => {
  const r = props.remark?.trim();
  if (r) return r;
  return (
    props.user.nickname?.trim() ||
    props.user.username?.trim() ||
    props.user.email ||
    '用户'
  );
});

const displaySub = computed(() => {
  if (props.remark?.trim()) {
    const nick = props.user.nickname?.trim() || props.user.username || '—';
    const em = props.user.email || '';
    return em ? `昵称：${nick} · ${em}` : `昵称：${nick}`;
  }
  if (props.subtitle) return props.subtitle;
  if (props.showEmail && props.user.email) return props.user.email;
  return '';
});

/** 无签名时统一「暂无简介」 */
const signatureLine = computed(() => {
  const s = props.user.signature?.trim();
  return s ? s : '暂无简介';
});

const presenceIsOnline = computed(() => {
  const u = props.user as unknown as Record<string, unknown>;
  const online = u.online ?? u.isOnline ?? u.is_online;
  return online === true;
});

const presenceLine = computed(() => {
  const u = props.user as unknown as Record<string, unknown>;
  const online = u.online ?? u.isOnline ?? u.is_online;
  if (online === true) return '在线';
  const last = pickLastOnlineAt(u);
  if (last) {
    const rel = fromNow(last);
    const timeText = rel || formatDate(last);
    return timeText ? `最后在线 ${timeText}` : '离线';
  }
  return '离线';
});

const initial = computed(() => {
  const base =
    props.user.nickname?.trim() ||
    props.user.username?.trim() ||
    props.user.email ||
    '?';
  return base.trim()[0]?.toUpperCase() || '?';
});
</script>

<style scoped>
.friend-user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.friend-user-cell--profile {
  align-items: flex-start;
}

.friend-user-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--bg-tertiary, #f0f0f0);
  color: var(--text-secondary, #666);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  flex-shrink: 0;
  overflow: hidden;
}

.friend-user-avatar--has-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.friend-user-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1;
}

.friend-user-name {
  font-weight: 600;
  color: var(--text-primary, #1a1a1a);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 15px;
}

.friend-user-sub {
  font-size: 12px;
  color: var(--text-tertiary, #888);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.friend-user-signature-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  min-width: 0;
}

.friend-user-sig-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  margin-top: 2px;
  color: var(--text-tertiary, #888);
  opacity: 0.85;
}

.friend-user-signature-text {
  font-size: 12px;
  line-height: 1.45;
  color: var(--text-secondary, #666);
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.friend-user-presence {
  font-size: 12px;
  color: var(--text-tertiary, #888);
  line-height: 1.3;
}

.friend-user-presence--online {
  color: #22c55e;
}

[data-theme='dark'] .friend-user-presence--online {
  color: #4ade80;
}
</style>
