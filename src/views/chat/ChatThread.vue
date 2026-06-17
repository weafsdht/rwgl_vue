<template>
  <div class="chat-thread-page">
    <header class="thread-header">
      <h1 class="thread-title">{{ title }}</h1>
    </header>

    <div ref="scrollRef" class="thread-messages" @scroll="onScroll">
      <div v-if="loading && !messages.length" class="state-inner">
        <div class="loader-ring"></div>
      </div>
      <template v-else>
        <div v-if="loadingMore" class="load-more">加载更早消息…</div>
        <div
          v-for="m in messages"
          :key="m.id"
          class="msg-row"
          :class="{ 'msg-row--mine': isMine(m) }"
        >
          <n-avatar
            v-if="!isMine(m)"
            round
            :size="36"
            :src="peerAvatarSrc"
            class="msg-avatar"
          >
            {{ peerInitial }}
          </n-avatar>
          <div class="msg-col">
            <div class="msg-bubble">
              <template v-if="msgTypeOf(m) === 0">
                <p class="msg-text">{{ m.content || '' }}</p>
              </template>
              <template v-else-if="msgTypeOf(m) === 1">
                <a :href="imgUrl(m)" target="_blank" rel="noopener noreferrer" class="msg-img-wrap">
                  <img :src="imgUrl(m)" alt="" class="msg-img" />
                </a>
              </template>
              <template v-else>
                <a :href="imgUrl(m)" :download="fileNameOf(m)" class="msg-file" target="_blank" rel="noopener">
                  📎 {{ fileNameOf(m) }}
                </a>
              </template>
              <div v-if="isMine(m) && readByPeerOf(m)" class="msg-read">已读</div>
            </div>
            <div class="msg-meta">{{ formatTime(messageTime(m)) }}</div>
          </div>
          <n-avatar
            v-if="isMine(m)"
            round
            :size="36"
            :src="myAvatarSrc"
            class="msg-avatar"
          >
            {{ myInitial }}
          </n-avatar>
        </div>
      </template>
    </div>

    <footer class="thread-input">
      <input ref="fileRef" type="file" class="file-input" @change="onFile" />
      <button type="button" class="btn-secondary btn-icon" title="图片/文件" :disabled="sending" @click="pickFile">
        +
      </button>
      <n-input
        v-model:value="draft"
        type="textarea"
        placeholder="输入消息，Enter 发送"
        :autosize="{ minRows: 1, maxRows: 4 }"
        :disabled="sending"
        class="thread-textarea"
        @keydown.enter.prevent="sendText"
      />
      <button type="button" class="btn-primary btn-compact" :disabled="sending || !draft.trim()" @click="sendText">
        发送
      </button>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { NInput, NAvatar } from 'naive-ui';
import { storeToRefs } from 'pinia';
import { useUserStore } from '@/stores/user';
import { useAuthAvatarUrl } from '@/composables/useAuthAvatarUrl';
import { pickAvatarFromPayload } from '@/utils/user';
import chatApi from '@/api/chat';
import { addChatRealtimeListener } from '@/services/chatStomp';
import { getAttachmentUrl } from '@/utils/request';
import type { ChatMessageVO, ChatRealtimeEvent, User } from '@/types';
import {
  msgTypeOf,
  messageTime,
  senderIdOf,
  fileUrlOf,
  fileNameOf,
  peerLabel,
} from '@/utils/chat';
import type { ChatConversationVO } from '@/types';
import { formatDate } from '@/utils/date';

const props = defineProps<{ conversationId: string }>();

const route = useRoute();
const userStore = useUserStore();
const { user, token } = storeToRefs(userStore);

const peerAvatarPath = ref('');
const peerInitial = ref('?');
const { avatarSrc: peerAvatarSrc } = useAuthAvatarUrl(peerAvatarPath, token);

const myAvatarPath = computed(() =>
  user.value ? pickAvatarFromPayload(user.value as unknown as Record<string, unknown>) ?? '' : ''
);
const { avatarSrc: myAvatarSrc } = useAuthAvatarUrl(myAvatarPath, token);

const myInitial = computed(() => {
  const u = user.value;
  const ch = u?.nickname?.trim()?.[0] || u?.username?.trim()?.[0];
  return ch || '?';
});

const conversationId = computed(() => Number(props.conversationId || route.params.conversationId));

const title = ref('聊天');
const messages = ref<ChatMessageVO[]>([]);
const loading = ref(true);
const loadingMore = ref(false);
const sending = ref(false);
const draft = ref('');
const scrollRef = ref<HTMLElement | null>(null);
const fileRef = ref<HTMLInputElement | null>(null);
let offRt: (() => void) | null = null;
let hasMoreOlder = true;

async function loadTitle() {
  const id = conversationId.value;
  if (!Number.isFinite(id)) return;
  try {
    const list: ChatConversationVO[] = (await chatApi.list()) ?? [];
    const c = list.find((x) => x.id === id);
    if (c) {
      title.value = peerLabel(c);
      const p = c.peer;
      if (p && typeof p === 'object') {
        peerAvatarPath.value =
          pickAvatarFromPayload(p as unknown as Record<string, unknown>) ?? '';
        const pu = p as User;
        const nick = pu.nickname?.trim()?.[0];
        const un = pu.username?.trim()?.[0];
        peerInitial.value = nick || un || peerLabel(c)[0] || '?';
      } else {
        peerAvatarPath.value = '';
        peerInitial.value = peerLabel(c)[0] || '?';
      }
    } else {
      title.value = `会话 ${id}`;
      peerAvatarPath.value = '';
      peerInitial.value = '?';
    }
  } catch {
    title.value = `会话 ${id}`;
    peerAvatarPath.value = '';
    peerInitial.value = '?';
  }
}

function isMine(m: ChatMessageVO): boolean {
  const sid = senderIdOf(m);
  return sid != null && user.value?.id != null && sid === user.value.id;
}

function readByPeerOf(m: ChatMessageVO): boolean {
  return Boolean(m.readByPeer ?? m.read_by_peer);
}

function imgUrl(m: ChatMessageVO): string {
  return getAttachmentUrl(fileUrlOf(m));
}

function formatTime(iso: string) {
  if (!iso) return '';
  try {
    return formatDate(iso);
  } catch {
    return iso;
  }
}

function sortMessages(arr: ChatMessageVO[]) {
  return [...arr].sort((a, b) => a.id - b.id);
}

async function loadInitial() {
  const id = conversationId.value;
  if (!Number.isFinite(id)) return;
  loading.value = true;
  try {
    await loadTitle();
    const raw = await chatApi.messages(id, { limit: 50 });
    messages.value = sortMessages(raw ?? []);
    await nextTick();
    scrollToBottom();
    await markReadLast();
  } finally {
    loading.value = false;
  }
}

async function loadOlder() {
  const id = conversationId.value;
  if (!Number.isFinite(id) || !messages.value.length || loadingMore.value || !hasMoreOlder) return;
  const first = messages.value[0];
  if (!first) return;
  loadingMore.value = true;
  const el = scrollRef.value;
  const prevH = el?.scrollHeight ?? 0;
  try {
    const older = await chatApi.messages(id, { beforeMessageId: first.id, limit: 30 });
    const list = older ?? [];
    if (list.length < 30) hasMoreOlder = false;
    if (list.length) {
      const merged = sortMessages([...list, ...messages.value]);
      messages.value = merged;
      await nextTick();
      if (el) {
        el.scrollTop = el.scrollHeight - prevH;
      }
    } else {
      hasMoreOlder = false;
    }
  } finally {
    loadingMore.value = false;
  }
}

function scrollToBottom() {
  const el = scrollRef.value;
  if (el) el.scrollTop = el.scrollHeight;
}

function onScroll() {
  const el = scrollRef.value;
  if (!el || loadingMore.value) return;
  if (el.scrollTop < 80) void loadOlder();
}

async function markReadLast() {
  const id = conversationId.value;
  const last = messages.value[messages.value.length - 1];
  if (!Number.isFinite(id) || !last) return;
  try {
    await chatApi.markRead(id, { lastReadMessageId: last.id });
  } catch {
    /* ignore */
  }
}

async function sendText() {
  const text = draft.value.trim();
  const id = conversationId.value;
  if (!text || !Number.isFinite(id) || sending.value) return;
  sending.value = true;
  try {
    const msg = await chatApi.sendText(id, text);
    draft.value = '';
    messages.value = sortMessages([...messages.value, msg]);
    await nextTick();
    scrollToBottom();
    await markReadLast();
  } catch (e) {
    window.dispatchEvent(
      new CustomEvent('toast', {
        detail: { type: 'error', title: '发送失败', message: (e as Error)?.message || '请稍后重试' },
      })
    );
  } finally {
    sending.value = false;
  }
}

function pickFile() {
  fileRef.value?.click();
}

async function onFile(ev: Event) {
  const input = ev.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  const id = conversationId.value;
  if (!file || !Number.isFinite(id) || sending.value) return;
  const isImg = file.type.startsWith('image/');
  sending.value = true;
  try {
    const msg = await chatApi.upload(id, file, isImg);
    messages.value = sortMessages([...messages.value, msg]);
    await nextTick();
    scrollToBottom();
    await markReadLast();
  } catch (e) {
    window.dispatchEvent(
      new CustomEvent('toast', {
        detail: { type: 'error', title: '发送失败', message: (e as Error)?.message || '请稍后重试' },
      })
    );
  } finally {
    sending.value = false;
  }
}

function onRealtime(ev: ChatRealtimeEvent) {
  const cid = conversationId.value;
  if (ev.conversationId !== cid) return;
  if (ev.type === 'NEW_MESSAGE' && ev.message) {
    const msg = ev.message;
    if (!messages.value.some((x) => x.id === msg.id)) {
      messages.value = sortMessages([...messages.value, msg]);
      void nextTick().then(() => {
        scrollToBottom();
        void markReadLast();
      });
    }
  }
  if (ev.type === 'READ_RECEIPT') {
    const up = ev.readUpToMessageId;
    if (up == null) return;
    messages.value = messages.value.map((m) => {
      if (isMine(m) && m.id <= up) {
        return { ...m, readByPeer: true, read_by_peer: true };
      }
      return m;
    });
  }
}

watch(
  () => conversationId.value,
  () => {
    hasMoreOlder = true;
    messages.value = [];
    title.value = '聊天';
    peerAvatarPath.value = '';
    peerInitial.value = '?';
    void loadInitial();
  }
);

onMounted(() => {
  void loadInitial();
  offRt = addChatRealtimeListener(onRealtime);
});

onUnmounted(() => {
  offRt?.();
  offRt = null;
});
</script>

<style scoped>
.chat-thread-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  width: 100%;
}

.thread-header {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-secondary);
}

.thread-title {
  margin: 0;
  font-size: var(--font-size-title);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.thread-messages {
  flex: 1;
  min-height: 200px;
  overflow-y: auto;
  padding: var(--spacing-md) var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.state-inner {
  display: flex;
  justify-content: center;
  padding: 24px;
}

.loader-ring {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-subtle);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.load-more {
  text-align: center;
  font-size: var(--font-size-small);
  color: var(--text-tertiary);
}

.msg-row {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 10px;
  max-width: min(92%, 720px);
}

.msg-row--mine {
  flex-direction: row-reverse;
  align-self: flex-end;
  margin-left: auto;
}

.msg-avatar {
  flex-shrink: 0;
  margin-top: 2px;
}

.msg-col {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 0 1 auto;
  max-width: calc(100% - 46px);
}

.msg-row--mine .msg-col {
  align-items: flex-end;
}

.msg-bubble {
  position: relative;
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
}

.msg-row--mine .msg-bubble {
  background: rgba(0, 229, 255, 0.12);
  border-color: var(--accent-neon-border);
}

.msg-text {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--text-primary);
}

.msg-img {
  max-width: min(280px, 70vw);
  max-height: 320px;
  border-radius: 8px;
  vertical-align: middle;
}

.msg-file {
  color: var(--accent-primary);
  text-decoration: none;
}

.msg-file:hover {
  text-decoration: underline;
}

.msg-read {
  margin-top: 4px;
  font-size: 11px;
  color: var(--text-tertiary);
  text-align: right;
}

.msg-meta {
  margin-top: 4px;
  font-size: 11px;
  color: var(--text-tertiary);
}

.thread-input {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
  padding: var(--spacing-md) var(--spacing-lg);
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-secondary);
}

.file-input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}

.btn-icon {
  width: 40px;
  height: 40px;
  padding: 0;
  font-size: 22px;
  line-height: 1;
}

.thread-textarea {
  flex: 1;
  min-width: 0;
}
</style>
