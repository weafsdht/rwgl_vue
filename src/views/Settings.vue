<template>
  <div class="settings-page">
    <div class="settings-layout">
      <!-- 左侧导航 -->
      <aside class="settings-sidebar">
        <div class="sidebar-account">
          <div class="sidebar-avatar" :class="{ 'sidebar-avatar--has-img': userForm.avatar && !avatarImgError }">
            <img
              v-if="userForm.avatar && !avatarImgError"
              :key="avatarDisplayUrl"
              :src="avatarDisplayUrl"
              alt=""
              @error="avatarImgError = true"
            />
            <span v-else>{{ (userForm.nickname || userForm.username || 'A').trim()[0].toUpperCase() }}</span>
          </div>
          <span class="sidebar-account-text"> {{ userForm.nickname || '—' }}</span>
        </div>
        <nav class="sidebar-nav">
          <a
            v-for="item in navItems"
            :key="item.key"
            class="sidebar-nav-item"
            :class="{ active: activeNav === item.key }"
            href="javascript:void(0)"
            @click.prevent="activeNav = item.key"
          >
            {{ item.label }}
            <span v-if="item.badge" class="sidebar-nav-badge">{{ item.badge }}</span>
          </a>
        </nav>
      </aside>

      <!-- 右侧内容 -->
      <main class="settings-main">
        <template v-if="activeNav === 'profile'">
          <h1 class="settings-title">个人信息</h1>
          <div class="settings-form">
            <!-- 头像行：可点击整行，打开上传弹窗 -->
            <div
              class="form-row form-row--clickable"
              :class="{ 'form-row--disabled': avatarUploading }"
              @click="!avatarUploading && (showAvatarModal = true)"
            >
              <span class="form-label">头像</span>
              <div class="form-value form-value--avatar">
                <div
                  class="avatar-preview avatar-preview--sm"
                  :class="{
                    'avatar-preview--has-img': userForm.avatar && !avatarImgError,
                    'avatar-preview--uploading': avatarUploading,
                  }"
                >
                  <img
                    v-if="userForm.avatar && !avatarImgError"
                    :key="avatarDisplayUrl"
                    :src="avatarDisplayUrl"
                    alt=""
                    class="avatar-img"
                    @error="avatarImgError = true"
                  />
                  <span v-else class="avatar-initial">{{ (userForm.nickname || userForm.username || 'A').trim()[0].toUpperCase() }}</span>
                  <div v-if="avatarUploading" class="avatar-overlay">
                    <span class="avatar-overlay-spinner"></span>
                  </div>
                </div>
                <svg class="form-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </div>
            </div>

            <AvatarUploadModal
              v-model="showAvatarModal"
              @success="onAvatarUploadSuccess"
            />

            <!-- 昵称 -->
            <div class="form-row">
              <span class="form-label">用户名</span>
              <div class="form-value form-value--input">
                <n-input
                  v-model:value="userForm.nickname"
                  placeholder="未设置"
                  clearable
                  class="form-input"
                />
              </div>
            </div>

            <!-- 性别 -->
            <div class="form-row">
              <span class="form-label">性别</span>
              <div class="form-value form-value--gender">
                <n-select
                  v-model:value="userForm.gender"
                  :options="genderOptions"
                  placeholder="请选择"
                  class="form-select form-select--gender"
                />
              </div>
            </div>

            <!-- 邮箱地址（仅展示，修改在账号与安全） -->
            <div class="form-row">
              <span class="form-label">邮箱地址</span>
              <div class="form-value form-value--readonly">
                <span class="form-value-text">{{ userForm.email || '未绑定' }}</span>
              </div>
            </div>

            <!-- 个性签名（在邮箱下方） -->
            <div class="form-row form-row--multiline">
              <span class="form-label">个性签名</span>
              <div class="form-value form-value--textarea">
                <n-input
                  v-model:value="userForm.signature"
                  type="textarea"
                  placeholder="一句话介绍自己"
                  :maxlength="200"
                  show-count
                  :autosize="{ minRows: 3, maxRows: 6 }"
                  clearable
                  class="form-input form-input--textarea"
                />
              </div>
            </div>

            <!-- 保存 -->
            <div class="form-row form-row--actions">
              <button
                class="btn-save"
                :class="{ 'btn-save--disabled': !hasChanges || updating }"
                type="button"
                :disabled="!hasChanges || updating"
                @click="handleUpdateUser"
              >
                <span v-if="!updating">保存</span>
                <span v-else class="loading-spinner"></span>
              </button>
            </div>
          </div>
        </template>

        <template v-else-if="activeNav === 'account'">
          <h1 class="settings-title">账号与安全</h1>
          <div class="account-security-form">
            <section class="account-section">
              <h2 class="account-section-title">账号登录方式</h2>
              <div class="account-login-list">
                <div class="account-login-item">
                  <span class="account-login-icon account-login-icon--phone">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                      <line x1="12" y1="18" x2="12.01" y2="18"/>
                    </svg>
                  </span>
                  <div class="account-login-content">
                    <span class="account-login-label">手机号</span>
                    <span class="account-login-value">{{ userForm.phone || '未绑定' }}</span>
                  </div>
                  <button type="button" class="btn-account" @click="showVerifyPhoneModal = true">更改</button>
                </div>
                <div class="account-login-item">
                  <span class="account-login-icon account-login-icon--email">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </span>
                  <div class="account-login-content">
                    <span class="account-login-label">邮件地址</span>
                    <span class="account-login-value">{{ userForm.email || '未绑定' }}</span>
                  </div>
                  <button type="button" class="btn-account" @click="openChangeEmailModal">更改</button>
                </div>
                <div class="account-login-item">
                  <span class="account-login-icon account-login-icon--link">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                    </svg>
                  </span>
                  <div class="account-login-content">
                    <span class="account-login-label">第三方账号</span>
                    <span class="account-login-value account-login-value--muted">绑定后，可用来登录</span>
                  </div>
                  <svg class="account-login-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </div>
                <div class="account-login-item">
                  <span class="account-login-icon account-login-icon--password">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </span>
                  <div class="account-login-content">
                    <span class="account-login-label">密码</span>
                    <span class="account-login-value">已设置</span>
                  </div>
                  <button type="button" class="btn-account" @click="openPasswordModal">更改</button>
                </div>
              </div>
            </section>
          </div>

          <!-- 修改密码弹窗 -->
          <FormModal
            v-model="showPasswordModal"
            title="修改密码"
            confirm-text="确 定"
            cancel-text="取 消"
            :loading="passwordSubmitting"
            @confirm="handleConfirmPasswordModal"
          >
            <p class="password-modal-desc">修改后请使用新密码登录</p>
            <form
              :key="passwordModalFormKey"
              class="password-modal-form"
              autocomplete="off"
              @submit.prevent
            >
              <div class="form-row">
                <span class="form-label">原密码</span>
                <div class="form-value form-value--input">
                  <n-input
                    v-model:value="passwordForm.oldPassword"
                    type="password"
                    placeholder="请输入原密码"
                    show-password-on="click"
                    class="form-input"
                    :readonly="oldPasswordReadonly"
                    :input-props="oldPasswordInputProps"
                    @focus="onOldPasswordFocus"
                    @mousedown="onOldPasswordFocus"
                  />
                </div>
              </div>
              <div class="form-row">
                <span class="form-label">新密码</span>
                <div class="form-value form-value--input">
                  <n-input
                    v-model:value="passwordForm.newPassword"
                    type="password"
                    placeholder="至少 6 位"
                    show-password-on="click"
                    class="form-input"
                    :input-props="newPasswordInputProps"
                  />
                </div>
              </div>
              <div class="form-row">
                <span class="form-label">确认新密码</span>
                <div class="form-value form-value--input">
                  <n-input
                    v-model:value="passwordForm.confirmPassword"
                    type="password"
                    placeholder="再次输入新密码"
                    show-password-on="click"
                    class="form-input"
                    :input-props="confirmNewPasswordInputProps"
                  />
                </div>
              </div>
            </form>
          </FormModal>

          <FormModal
            v-model="showChangeEmailModal"
            title="更改邮箱"
            confirm-text="确 定"
            cancel-text="取 消"
            :loading="changeEmailSubmitting"
            @confirm="handleConfirmChangeEmail"
          >
            <p class="password-modal-desc">请输入常用邮箱，保存后可用于登录与找回</p>
            <div class="password-modal-form">
              <div class="form-row">
                <span class="form-label">邮箱</span>
                <div class="form-value form-value--input">
                  <n-input
                    v-model:value="changeEmailDraft"
                    type="text"
                    placeholder="name@example.com"
                    class="form-input"
                  />
                </div>
              </div>
            </div>
          </FormModal>

          <VerifyIdentityModal
            v-model="showVerifyPhoneModal"
            :phone="userForm.phone"
            @confirm="onVerifyPhoneConfirm"
          />
        </template>

        <template v-else-if="activeNav === 'tasks'">
          <h1 class="settings-title">任务归档</h1>
          <div class="settings-form">
            <div class="form-row form-row--archive-row">
              <span class="form-label">归档设置</span>
              <div class="form-value form-value--archive">
                <n-select
                  :value="archivePresetForSelect"
                  :options="autoArchiveSelectOptions"
                  class="form-select form-select--archive"
                  @update:value="onArchivePresetChange"
                />
                <div v-if="archivePresetForSelect === 'custom'" class="archive-custom-wrap">
                  <span class="archive-custom-label">完成后</span>
                  <n-input-number
                    v-model:value="customArchiveHours"
                    :min="1"
                    :max="8760"
                    :step="1"
                    size="medium"
                    class="archive-hours-input"
                    @update:value="onCustomArchiveHoursUpdate"
                  />
                  <span class="archive-custom-suffix">小时自动归档</span>
                </div>
              </div>
            </div>
          </div>
        </template>

        <template v-else-if="activeNav === 'tags'">
          <h1 class="settings-title">标签管理</h1>
          <div class="tags-panel">
            <div class="tags-head">
              <button type="button" class="btn-primary" @click="openTagModal()">新建标签</button>
            </div>
            <div v-if="tagsLoading" class="tags-loading">加载中…</div>
            <div v-else-if="tags.length === 0" class="tags-empty">暂无标签，点击「新建标签」添加</div>
            <div v-else class="tags-list">
              <div v-for="tag in tags" :key="tag.id" class="tag-card">
                <span class="tag-chip" :style="{ background: tag.color || '#e5e7eb', color: textColorFor(tag.color) }">{{ tag.name }}</span>
                <div class="tag-actions">
                  <button type="button" class="btn-account" @click="openTagModal(tag)">编辑</button>
                  <button type="button" class="btn-account btn-account--danger" @click="confirmDeleteTag(tag)">删除</button>
                </div>
              </div>
            </div>
          </div>

          <n-modal v-model:show="showTagModal" class="tag-modal" @after-leave="tagForm.name = ''; tagForm.color = TAG_COLOR_PALETTE[3];">
            <n-card
              class="tag-modal__card"
              :title="editingTag ? '编辑标签' : '新建标签'"
              :bordered="false"
              size="huge"
              role="dialog"
              aria-modal="true"
              style="width: 440px"
            >
              <div class="tag-modal__form">
                <div class="tag-modal__row">
                  <span class="tag-modal__label">名称</span>
                  <n-input v-model:value="tagForm.name" placeholder="标签名称" class="tag-modal__input" clearable />
                </div>
                <div class="tag-modal__row">
                  <span class="tag-modal__label">颜色</span>
                  <div class="tag-modal__color-swatches">
                    <button
                      v-for="c in TAG_COLOR_PALETTE"
                      :key="c"
                      type="button"
                      class="tag-modal__swatch"
                      :class="{ 'tag-modal__swatch--selected': tagForm.color === c }"
                      :style="{ backgroundColor: c }"
                      :aria-label="'选择颜色 ' + c"
                      @click="tagForm.color = c"
                    />
                    <div
                      class="tag-modal__swatch tag-modal__swatch--custom"
                      :class="{ 'tag-modal__swatch--selected': isCustomTagColor }"
                    >
                      <n-color-picker
                        v-model:value="tagForm.color"
                        :show-alpha="false"
                        size="small"
                        :modes="['hex']"
                        class="tag-modal__picker"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <template #footer>
                <div class="tag-modal__footer">
                  <button type="button" class="tag-modal__cancel" @click="showTagModal = false">取消</button>
                  <button
                    type="button"
                    class="btn-primary tag-modal__confirm"
                    :disabled="tagSubmitting || !tagForm.name?.trim()"
                    @click="submitTagForm()"
                  >
                    <span v-if="!tagSubmitting">确定</span>
                    <span v-else class="loading-spinner"></span>
                  </button>
                </div>
              </template>
            </n-card>
          </n-modal>

          <ConfirmModal
            v-model="showTagDeleteModal"
            title="删除标签"
            :content="deletingTag ? `确定删除标签「${deletingTag.name}」？删除后任务上的该标签会被移除。` : ''"
            confirm-text="确 定"
            cancel-text="取 消"
            :loading="tagDeleting"
            @confirm="doDeleteTag"
          />
        </template>

        <template v-else-if="activeNav === 'notifications'">
          <h1 class="settings-title">通知设置</h1>
          <div v-if="notifPrefsLoading" class="tags-loading">加载中…</div>
          <div v-else class="notif-panels">
            <section class="settings-form notif-panel">
              <h3 class="notif-panel-title">通知通道</h3>
              <div class="form-row form-row--notif">
                <span class="form-label">应用内通知</span>
                <n-switch v-model:value="notifDraft.channelInApp" />
              </div>
              <div class="form-row form-row--notif">
                <span class="form-label">邮件通知</span>
                <n-switch v-model:value="notifDraft.channelEmail" />
              </div>
              <div class="form-row form-row--notif">
                <span class="form-label">通知频率（分钟）</span>
                <n-input-number
                  v-model:value="notifFreqMinutes"
                  :min="1"
                  :max="10080"
                  :show-button="false"
                  placeholder="如 60"
                  class="notif-freq-input"
                />
              </div>
            </section>
            <section class="settings-form notif-panel">
              <h3 class="notif-panel-title">SMTP（邮件通知）</h3>
              <div class="notif-smtp-grid">
                <div class="notif-smtp-cell">
                  <span class="notif-field-label">服务器</span>
                  <n-input v-model:value="notifSmtp.smtpHost" placeholder="如 smtp.qq.com" clearable />
                </div>
                <div class="notif-smtp-cell notif-smtp-cell--port">
                  <span class="notif-field-label">端口</span>
                  <n-input-number
                    v-model:value="notifSmtp.smtpPort"
                    :min="1"
                    :max="65535"
                    :show-button="false"
                    placeholder="465"
                    class="notif-smtp-port"
                  />
                </div>
                <div class="notif-smtp-cell notif-smtp-cell--full">
                  <span class="notif-field-label">发件邮箱</span>
                  <n-input
                    v-model:value="notifSmtp.fromEmail"
                    :stateful="false"
                    :readonly="notifSmtpEmailReadonly"
                    placeholder="发件人邮箱"
                    clearable
                    :input-props="notifSmtpFromEmailInputProps"
                    @focus="onNotifSmtpEmailInteract"
                    @mousedown="onNotifSmtpEmailInteract"
                  />
                </div>
                <div class="notif-smtp-cell notif-smtp-cell--full">
                  <span class="notif-field-label">SMTP 授权码</span>
                  <n-input
                    v-model:value="notifSmtp.fromPassword"
                    :stateful="false"
                    :readonly="notifSmtpPasswordReadonly"
                    type="password"
                    placeholder="请输入授权码"
                    show-password-on="click"
                    :input-props="notifSmtpPasswordInputProps"
                    @focus="onNotifSmtpPasswordInteract"
                    @mousedown="onNotifSmtpPasswordInteract"
                  />
                </div>
                <div class="notif-smtp-cell notif-smtp-cell--ssl">
                  <span class="notif-field-label">SSL</span>
                  <n-switch v-model:value="notifSmtp.ssl" />
                </div>
              </div>
            </section>
            <div class="notif-actions">
              <button
                type="button"
                class="btn-save"
                :class="{ 'btn-save--disabled': notifSaving }"
                :disabled="notifSaving"
                @click="saveNotificationPreferences"
              >
                <span v-if="!notifSaving">保存</span>
                <span v-else class="loading-spinner" />
              </button>
            </div>
          </div>
        </template>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { NInput, NInputNumber, NSelect, NModal, NCard, NColorPicker, NSwitch } from 'naive-ui';
import ConfirmModal from '@/components/ConfirmModal.vue';
import FormModal from '@/components/FormModal.vue';
import '../styles/components.css';
import { useUserStore } from '@/stores/user';
import userApi from '@/api/user';
import tagApi from '@/api/tag';
import notificationApi from '@/api/notification';
import { getAvatarUrl } from '@/utils/request';
import AvatarUploadModal from '@/components/AvatarUploadModal.vue';
import VerifyIdentityModal from '@/components/VerifyIdentityModal.vue';
import type { Tag, NotificationPreferences } from '@/types';
import {
  AUTO_ARCHIVE_OPTIONS,
  getAutoArchiveAfter,
  setAutoArchiveAfter,
  parseCustomArchiveHours,
  type AutoArchiveValue,
} from '@/constants/archive';

const userStore = useUserStore();
const route = useRoute();

const activeNav = ref('profile');
const navKeys = ['profile', 'account', 'tasks', 'tags', 'notifications'];
function applyNavFromQuery() {
  const q = route.query.nav;
  if (q && typeof q === 'string' && navKeys.includes(q)) activeNav.value = q;
}
const navItems: { key: string; label: string; badge?: string | number }[] = [
  { key: 'profile', label: '个人信息' },
  { key: 'account', label: '账号与安全' },
  { key: 'tasks', label: '任务归档' },
  { key: 'tags', label: '标签管理' },
  { key: 'notifications', label: '通知设置' },
];

const notifPrefsLoading = ref(false);
const notifSaving = ref(false);
const notifDraft = ref<NotificationPreferences>({
  channelInApp: true,
  channelEmail: true,
});
/** 与 frequencyMinutes 绑定（null 表示不提交改动） */
const notifFreqMinutes = ref<number | null>(60);

const notifSmtp = reactive({
  smtpHost: '',
  smtpPort: null as number | null,
  fromEmail: '',
  fromPassword: '',
  ssl: true,
});

/** 避免浏览器把「发件邮箱 + 授权码」当成登录框自动填充：先只读，用户点击/聚焦后再编辑 */
const notifSmtpEmailReadonly = ref(true);
const notifSmtpPasswordReadonly = ref(true);

const notifSmtpFromEmailInputProps = {
  autocomplete: 'off',
  name: 'notification-smtp-from-email',
  id: 'settings-notification-smtp-from-email',
  'data-1p-ignore': 'true',
  'data-lpignore': 'true',
  'data-form-type': 'other',
} as const;

const notifSmtpPasswordInputProps = {
  autocomplete: 'new-password',
  name: 'notification-smtp-auth-code',
  id: 'settings-notification-smtp-auth-code',
  'data-1p-ignore': 'true',
  'data-lpignore': 'true',
  'data-form-type': 'other',
} as const;

function onNotifSmtpEmailInteract() {
  notifSmtpEmailReadonly.value = false;
}

function onNotifSmtpPasswordInteract() {
  notifSmtpPasswordReadonly.value = false;
}

function applyNotifPrefsFromApi(p: NotificationPreferences) {
  notifDraft.value = {
    channelInApp: p.channelInApp ?? true,
    channelEmail: p.channelEmail ?? true,
  };
  if (p.frequencyMinutes != null && Number.isFinite(Number(p.frequencyMinutes))) {
    notifFreqMinutes.value = Number(p.frequencyMinutes);
  }
  if (p.smtpHost !== undefined) {
    notifSmtp.smtpHost = p.smtpHost ?? '';
  }
  if (p.smtpPort !== undefined) {
    notifSmtp.smtpPort =
      p.smtpPort != null && Number.isFinite(Number(p.smtpPort)) ? Number(p.smtpPort) : null;
  }
  if (p.fromEmail !== undefined) {
    notifSmtp.fromEmail = p.fromEmail ?? '';
  }
  notifSmtp.fromPassword = '';
  if (p.ssl !== undefined) {
    notifSmtp.ssl = p.ssl !== false;
  }
}

async function loadNotificationPreferences() {
  notifPrefsLoading.value = true;
  try {
    const p = await notificationApi.getPreferences({ skipGlobalError: true });
    applyNotifPrefsFromApi(p);
  } catch {
    notifDraft.value = { channelInApp: true, channelEmail: true };
    notifFreqMinutes.value = 60;
    notifSmtp.smtpHost = '';
    notifSmtp.smtpPort = null;
    notifSmtp.fromEmail = '';
    notifSmtp.fromPassword = '';
    notifSmtp.ssl = true;
  } finally {
    notifPrefsLoading.value = false;
  }
}

async function saveNotificationPreferences() {
  if (notifSaving.value) return;
  notifSaving.value = true;
  try {
    const payload: Partial<NotificationPreferences> = {
      channelInApp: notifDraft.value.channelInApp,
      channelEmail: notifDraft.value.channelEmail,
      smtpHost: notifSmtp.smtpHost.trim() || undefined,
      smtpPort:
        notifSmtp.smtpPort != null && notifSmtp.smtpPort > 0 ? notifSmtp.smtpPort : undefined,
      fromEmail: notifSmtp.fromEmail.trim() || undefined,
      ssl: notifSmtp.ssl,
    };
    if (notifFreqMinutes.value != null && notifFreqMinutes.value > 0) {
      payload.frequencyMinutes = notifFreqMinutes.value;
    }
    const pwd = notifSmtp.fromPassword.trim();
    if (pwd) {
      payload.fromPassword = pwd;
    }
    const p = await notificationApi.updatePreferences(payload);
    applyNotifPrefsFromApi({ ...notifDraft.value, ...p });
    window.dispatchEvent(
      new CustomEvent('toast', { detail: { type: 'success', title: '已保存', message: '通知偏好已更新' } })
    );
  } catch (e: unknown) {
    window.dispatchEvent(
      new CustomEvent('toast', {
        detail: { type: 'error', title: '保存失败', message: (e as Error)?.message ?? '请稍后重试' },
      })
    );
  } finally {
    notifSaving.value = false;
  }
}

const updating = ref(false);

const userForm = ref({
  id: 0 as number,
  username: '',
  email: '',
  nickname: '',
  phone: '' as string,
  avatar: '' as string,
  gender: 'unknown' as string,
  signature: '' as string,
});

function normalizeGender(value: unknown): '' | 'male' | 'female' | 'unknown' {
  const v = String(value ?? '').trim().toLowerCase();
  if (!v) return '';
  if (v === 'male' || v === 'm' || v === '男' || v === '1') return 'male';
  if (v === 'female' || v === 'f' || v === '女' || v === '2') return 'female';
  if (v === 'unknown' || v === 'u' || v === '保密' || v === '0') return 'unknown';
  return '';
}

const genderOptions = [
  { label: '男', value: 'male' },
  { label: '女', value: 'female' },
  { label: '保密', value: 'unknown' },
];

const showAvatarModal = ref(false);
const showVerifyPhoneModal = ref(false);

const passwordForm = ref({ oldPassword: '', newPassword: '', confirmPassword: '' });
const passwordSubmitting = ref(false);
const showPasswordModal = ref(false);

const showChangeEmailModal = ref(false);
const changeEmailDraft = ref('');
const changeEmailSubmitting = ref(false);
/** 每次打开弹窗递增，强制重挂载输入框，削弱浏览器密码自动填充 */
const passwordModalFormKey = ref(0);
/** 先只读，用户点击/聚焦原密码框后再输入，避免一打开就被填入已存密码 */
const oldPasswordReadonly = ref(true);

const oldPasswordInputProps = {
  autocomplete: 'off',
  autocapitalize: 'off',
  spellcheck: false,
  'data-1p-ignore': 'true',
  'data-lpignore': 'true',
};

const newPasswordInputProps = {
  autocomplete: 'new-password',
  autocapitalize: 'off',
  spellcheck: false,
};

const confirmNewPasswordInputProps = {
  autocomplete: 'new-password',
  autocapitalize: 'off',
  spellcheck: false,
};

function onOldPasswordFocus() {
  oldPasswordReadonly.value = false;
}

// 标签管理
const tags = ref<Tag[]>([]);
const tagsLoading = ref(false);
const showTagModal = ref(false);
const editingTag = ref<Tag | null>(null);
const tagForm = ref({ name: '', color: '#2563eb' });
const tagSubmitting = ref(false);
const showTagDeleteModal = ref(false);
const deletingTag = ref<Tag | null>(null);
const tagDeleting = ref(false);

/** 标签颜色预设（与编辑项目一致的一排圆形色板） */
const TAG_COLOR_PALETTE = [
  '#E53935', '#D81B60', '#667eea', '#1890FF', '#06b6d4',
  '#22c55e', '#84cc16', '#eab308', '#f97316', '#64748b',
];
const isCustomTagColor = computed(() => {
  const c = tagForm.value.color;
  return !c || !TAG_COLOR_PALETTE.includes(c);
});

function textColorFor(bgHex: string | undefined): string {
  if (!bgHex || bgHex === '') return 'var(--text-primary)';
  const hex = bgHex.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#1f2937' : '#fff';
}

async function loadTags() {
  tagsLoading.value = true;
  try {
    tags.value = await tagApi.getList();
  } catch {
    tags.value = [];
  } finally {
    tagsLoading.value = false;
  }
}

function openTagModal(tag?: Tag) {
  editingTag.value = tag ?? null;
  tagForm.value = {
    name: tag?.name ?? '',
    color: tag?.color ?? TAG_COLOR_PALETTE[3],
  };
  showTagModal.value = true;
}

async function submitTagForm() {
  const name = tagForm.value.name?.trim();
  if (!name) {
    window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'error', title: '提示', message: '请输入标签名称' } }));
    return;
  }
  if (tagSubmitting.value) return;
  tagSubmitting.value = true;
  try {
    if (editingTag.value) {
      await tagApi.update(editingTag.value.id, { name, color: tagForm.value.color || undefined });
      window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'success', title: '已更新', message: '标签已保存' } }));
    } else {
      await tagApi.create({ name, color: tagForm.value.color || undefined });
      window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'success', title: '已创建', message: '标签已添加' } }));
    }
    showTagModal.value = false;
    await loadTags();
  } catch (e: unknown) {
    const msg = (e as Error)?.message ?? '操作失败';
    window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'error', title: '操作失败', message: msg } }));
  } finally {
    tagSubmitting.value = false;
  }
}

function confirmDeleteTag(tag: Tag) {
  deletingTag.value = tag;
  showTagDeleteModal.value = true;
}

async function doDeleteTag(): Promise<boolean> {
  if (!deletingTag.value) return false;
  if (tagDeleting.value) return false;
  tagDeleting.value = true;
  try {
    await tagApi.remove(deletingTag.value.id);
    showTagDeleteModal.value = false;
    deletingTag.value = null;
    await loadTags();
    window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'success', title: '已删除' } }));
    return true;
  } catch (e: unknown) {
    const msg = (e as Error)?.message ?? '删除失败';
    window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'error', title: '删除失败', message: msg } }));
    return false;
  } finally {
    tagDeleting.value = false;
  }
}

function openPasswordModal() {
  passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' };
  oldPasswordReadonly.value = true;
  passwordModalFormKey.value += 1;
  showPasswordModal.value = true;
  void nextTick(() => {
    passwordForm.value.oldPassword = '';
    window.setTimeout(() => {
      passwordForm.value = { ...passwordForm.value, oldPassword: '' };
    }, 0);
    window.setTimeout(() => {
      passwordForm.value = { ...passwordForm.value, oldPassword: '' };
    }, 120);
  });
}

const canSubmitPassword = computed(() => {
  const { oldPassword, newPassword, confirmPassword } = passwordForm.value;
  return (
    (oldPassword?.trim() ?? '').length > 0 &&
    (newPassword?.trim() ?? '').length >= 6 &&
    newPassword?.trim() === confirmPassword?.trim()
  );
});

const autoArchiveAfter = ref<AutoArchiveValue>(getAutoArchiveAfter());
const customArchiveHours = ref(24);

function syncCustomHoursFromArchive() {
  const h = parseCustomArchiveHours(String(autoArchiveAfter.value));
  customArchiveHours.value = h ?? 24;
}
syncCustomHoursFromArchive();

const archivePresetForSelect = computed(() => {
  const v = String(autoArchiveAfter.value);
  return v.startsWith('custom:') ? 'custom' : v;
});

const autoArchiveSelectOptions = [
  ...AUTO_ARCHIVE_OPTIONS.map((o) => ({ label: o.label, value: o.value })),
  { label: '自定义', value: 'custom' },
];

function persistArchiveSettingAndToast() {
  setAutoArchiveAfter(autoArchiveAfter.value);
  window.dispatchEvent(
    new CustomEvent('toast', {
      detail: { type: 'success', title: '已保存', message: '归档设置已更新' },
    })
  );
}

function onArchivePresetChange(val: string) {
  if (val === 'custom') {
    autoArchiveAfter.value = `custom:${customArchiveHours.value}` as AutoArchiveValue;
  } else {
    autoArchiveAfter.value = val as AutoArchiveValue;
  }
  persistArchiveSettingAndToast();
}

function onCustomArchiveHoursUpdate(n: number | null) {
  if (n == null || !Number.isFinite(n)) return;
  const clamped = Math.min(8760, Math.max(1, Math.round(n)));
  customArchiveHours.value = clamped;
  if (archivePresetForSelect.value === 'custom') {
    autoArchiveAfter.value = `custom:${clamped}` as AutoArchiveValue;
    persistArchiveSettingAndToast();
  }
}

function refreshArchiveSettingFromStorage() {
  autoArchiveAfter.value = getAutoArchiveAfter();
  syncCustomHoursFromArchive();
}
const avatarCacheBuster = ref(0);
const avatarDisplayUrl = computed(() => {
  const url = getAvatarUrl(userForm.value.avatar);
  if (!url) return '';
  return `${url}${url.includes('?') ? '&' : '?'}t=${avatarCacheBuster.value}`;
});
const avatarImgError = ref(false);
const avatarUploading = ref(false);

const initialForm = ref('');
const hasChanges = computed(() => {
  return JSON.stringify({
    nickname: userForm.value.nickname,
    gender: userForm.value.gender,
    signature: userForm.value.signature ?? '',
  }) !== initialForm.value;
});

onMounted(async () => {
  applyNavFromQuery();
  if (userStore.token && !userStore.user) {
    await userStore.fetchCurrentUser();
  }
  fillUserForm();
});

watch(() => route.query.nav, applyNavFromQuery);
watch(() => userStore.user, () => {
  fillUserForm();
}, { deep: true });

watch(activeNav, (nav) => {
  if (nav === 'tags') loadTags();
  if (nav === 'tasks') refreshArchiveSettingFromStorage();
  if (nav === 'notifications') {
    notifSmtpEmailReadonly.value = true;
    notifSmtpPasswordReadonly.value = true;
    loadNotificationPreferences();
  }
});

function fillUserForm() {
  const u = userStore.user;
  const savedUsername = localStorage.getItem('user_username');
  const username = u?.username ?? savedUsername ?? '';
  if (u) {
    userForm.value = {
      id: u.id,
      username: username || u.username || '',
      email: u.email ?? '',
      nickname: u.nickname || '',
      phone: u.phone || '',
      avatar: u.avatar || '',
      gender: normalizeGender(u.gender) || 'unknown',
      signature: u.signature ?? '',
    };
    initialForm.value = JSON.stringify({
      nickname: userForm.value.nickname,
      gender: userForm.value.gender,
      signature: userForm.value.signature ?? '',
    });
  } else if (userStore.token && savedUsername) {
    userForm.value.username = savedUsername;
  }
}

async function handleConfirmPasswordModal() {
  if (!canSubmitPassword.value) {
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'error', title: '提示', message: '请填写原密码，新密码至少 6 位且两次一致' },
    }));
    return false;
  }
  if (passwordSubmitting.value) return false;
  const { oldPassword, newPassword } = passwordForm.value;
  passwordSubmitting.value = true;
  try {
    const updated = await userApi.changePassword(oldPassword.trim(), newPassword.trim());
    if (updated) userStore.$patch({ user: updated });
    showPasswordModal.value = false;
    passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' };
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'success', title: '已更新', message: '密码已修改，请使用新密码登录' },
    }));
  } catch (e: unknown) {
    const msg = (e as Error)?.message ?? '修改失败';
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'error', title: '修改失败', message: msg },
    }));
    return false;
  } finally {
    passwordSubmitting.value = false;
  }
}

watch(() => userForm.value.avatar, () => {
  avatarImgError.value = false;
  avatarCacheBuster.value = Date.now();
});

async function onAvatarUploadSuccess(file: File) {
  avatarUploading.value = true;
  avatarImgError.value = false;
  try {
    const updated = await userStore.uploadAvatar(file);
    userForm.value.avatar = updated?.avatar ?? userStore.user?.avatar ?? '';
    avatarCacheBuster.value = Date.now();
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'success', title: '头像已更新', message: '个人头像已保存' },
    }));
  } catch (err: unknown) {
    const msg = (err as Error)?.message ?? '上传失败';
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'error', title: '更新失败', message: msg },
    }));
  } finally {
    avatarUploading.value = false;
  }
}

function onVerifyPhoneConfirm(_code: string) {
  window.dispatchEvent(new CustomEvent('toast', {
    detail: { type: 'info', title: '提示', message: '验证成功，更改手机号功能开发中' },
  }));
}

function openChangeEmailModal() {
  changeEmailDraft.value = (userStore.user?.email ?? userForm.value.email ?? '').trim();
  showChangeEmailModal.value = true;
}

function isValidEmailAddress(s: string): boolean {
  const t = s.trim();
  if (!t) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}

async function handleConfirmChangeEmail(): Promise<boolean> {
  const email = changeEmailDraft.value.trim();
  if (!isValidEmailAddress(email)) {
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'error', title: '提示', message: '请输入有效的邮箱地址' },
    }));
    return false;
  }
  if (changeEmailSubmitting.value) return false;
  changeEmailSubmitting.value = true;
  try {
    await userStore.updateProfile({ email });
    await userStore.fetchCurrentUser();
    fillUserForm();
    showChangeEmailModal.value = false;
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'success', title: '已更新', message: '邮箱已保存' },
    }));
    return true;
  } catch (e: unknown) {
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'error', title: '更新失败', message: (e as Error)?.message || '请稍后重试' },
    }));
    return false;
  } finally {
    changeEmailSubmitting.value = false;
  }
}

const handleUpdateUser = async () => {
  if (!hasChanges.value || updating.value) return;
  updating.value = true;
  try {
    const payload = {
      username: userForm.value.username?.trim() || undefined,
      nickname: userForm.value.nickname?.trim() || undefined,
      gender: normalizeGender(userForm.value.gender) || undefined,
      signature: (userForm.value.signature ?? '').trim(),
    };
    await userStore.updateProfile(payload);
    // 用服务端最新值回填，避免接口返回字段不完整导致“看起来没生效”
    await userStore.fetchCurrentUser();
    fillUserForm();
    initialForm.value = JSON.stringify({
      nickname: userForm.value.nickname,
      gender: userForm.value.gender,
      signature: userForm.value.signature ?? '',
    });
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'success', title: '更新成功', message: '个人信息已更新' },
    }));
  } catch (error: any) {
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'error', title: '更新失败', message: error.message || '请稍后重试' },
    }));
  } finally {
    updating.value = false;
  }
};
</script>

<style scoped>
@import '../styles/components.css';

.settings-page {
  padding: 0;
  height: 100%;
  overflow: auto;
}

.settings-layout {
  display: flex;
  gap: var(--spacing-xl);
  width: 100%;
  min-height: 100%;
}

/* 左侧导航 */
.settings-sidebar {
  flex-shrink: 0;
  width: 260px;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  border: 1px solid var(--border-subtle);
}

.sidebar-account {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
  padding-bottom: var(--spacing-xl);
  border-bottom: 1px solid var(--border-subtle);
}

.sidebar-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: 600;
  color: var(--text-secondary);
  overflow: hidden;
  flex-shrink: 0;
}

.sidebar-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sidebar-account-text {
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
  width: 100%;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: var(--spacing-md);
}

.sidebar-nav-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-radius: 10px;
  color: var(--text-primary);
  text-decoration: none;
  font-size: 1rem;
  transition: background 0.2s ease;
}

.sidebar-nav-item:hover {
  background: var(--bg-tertiary);
}

.sidebar-nav-item.active {
  background: var(--bg-tertiary);
  color: var(--accent-primary);
  font-weight: 500;
}

.sidebar-nav-badge {
  font-size: 12px;
  color: var(--text-tertiary);
  font-weight: 400;
}

/* 右侧内容 */
.settings-main {
  flex: 1;
  min-width: 0;
}

.settings-title {
  margin: 0 0 var(--spacing-xl);
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--text-primary);
}

.settings-form {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
  padding: var(--spacing-xl);
}

.form-row {
  display: flex;
  align-items: center;
  padding: var(--spacing-lg) 0;
  border-bottom: 1px solid var(--border-subtle);
}

.form-row:last-of-type {
  border-bottom: none;
}

.form-row--clickable {
  cursor: pointer;
}

.form-row--clickable:hover {
  background: var(--bg-tertiary);
  margin: 0 calc(-1 * var(--spacing-lg));
  padding-left: var(--spacing-lg);
  padding-right: var(--spacing-lg);
  border-radius: 10px;
}

.form-row--disabled {
  cursor: not-allowed;
  pointer-events: none;
}

.form-hint {
  margin: var(--spacing-sm) 0 0;
  font-size: var(--font-size-small);
  color: var(--text-tertiary);
}

.form-row--multiline {
  align-items: flex-start;
}

.form-row--multiline .form-label {
  padding-top: 10px;
}

.form-value--textarea {
  align-items: stretch;
  max-width: 480px;
}

.form-row--archive-row {
  align-items: flex-start;
}

.form-row--archive-row .form-label {
  padding-top: 8px;
}

.form-value--archive {
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-md);
}

.form-select--archive {
  max-width: 280px;
  width: 100%;
}

.archive-custom-wrap {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-sm);
}

.archive-custom-label,
.archive-custom-suffix {
  font-size: var(--font-size-small);
  color: var(--text-secondary);
}

.archive-hours-input {
  width: 140px;
  max-width: 100%;
}

.form-input--textarea {
  width: 100%;
}

.form-row--actions {
  padding-top: var(--spacing-xl);
  justify-content: flex-start;
}

.settings-hint {
  margin: 0 0 var(--spacing-md);
  font-size: var(--font-size-small);
  color: var(--text-tertiary);
  line-height: 1.5;
}

.settings-hint--compact {
  margin-bottom: var(--spacing-md);
}

.settings-hint code {
  font-size: 0.9em;
}

.notif-panels {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
  gap: var(--spacing-md);
  width: 100%;
  align-items: stretch;
}

.notif-panel {
  min-width: 0;
}

.notif-panel .form-row:last-of-type {
  border-bottom: none;
}

.notif-panel-title {
  margin: 0 0 var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-subtle);
}

.notif-actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-start;
  padding-top: var(--spacing-xs);
}

.notif-smtp-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(100px, 140px);
  gap: var(--spacing-md);
  align-items: end;
}

.notif-smtp-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.notif-smtp-cell--full {
  grid-column: 1 / -1;
}

.notif-smtp-cell--ssl {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-sm);
}

.notif-smtp-cell--ssl .notif-field-label {
  min-width: 72px;
  margin: 0;
}

.notif-field-label {
  font-size: var(--font-size-small);
  color: var(--text-secondary);
}

.notif-smtp-cell--port {
  max-width: 160px;
}

.notif-smtp-port {
  width: 100%;
}

.notif-inline-hint {
  font-size: 12px;
  color: var(--text-tertiary);
}

.notif-smtp-cell .req {
  color: var(--error-color, #f87171);
}

@media (max-width: 960px) {
  .notif-panels {
    grid-template-columns: 1fr;
  }

  .notif-smtp-grid {
    grid-template-columns: 1fr;
  }

  .notif-smtp-cell--port {
    max-width: none;
  }
}

.form-row--notif {
  align-items: center;
}

.form-row--notif .form-label {
  margin-bottom: 0;
  width: 140px;
}

.notif-freq-input {
  max-width: 200px;
}

.form-label {
  flex-shrink: 0;
  width: 96px;
  font-size: 1.05rem;
  color: var(--text-primary);
}

.form-value {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  min-width: 0;
}

.form-value--avatar {
  justify-content: flex-end;
}

.form-value--input {
  max-width: 360px;
}

.form-value--gender {
  flex: 0 0 auto;
  max-width: 200px;
  width: 100%;
}

.form-select.form-select--gender {
  flex: none;
  width: 100%;
  min-width: 0;
}

.form-value--readonly {
  color: var(--text-primary);
}
.form-value-text {
  font-size: 1rem;
}

.form-input,
.form-select {
  flex: 1;
  min-width: 0;
}

.form-input--readonly :deep(.n-input__input-el) {
  color: var(--text-tertiary);
}

.form-info-icon {
  flex-shrink: 0;
  font-size: 14px;
  color: var(--text-tertiary);
  cursor: help;
}

.form-chevron {
  width: 24px;
  height: 24px;
  color: var(--text-tertiary);
  flex-shrink: 0;
}

/* 头像 */
.avatar-preview {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--bg-tertiary);
  border: 2px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
}

.avatar-preview--sm {
  width: 48px;
  height: 48px;
}

.avatar-preview--has-img {
  padding: 0;
}

.avatar-preview--uploading {
  pointer-events: none;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-initial {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-secondary);
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-overlay-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: avatar-spin 0.8s linear infinite;
}

@keyframes avatar-spin {
  to { transform: rotate(360deg); }
}

.avatar-input-hidden {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}

/* 保存按钮 */
.btn-save {
  padding: 12px 40px;
  border-radius: 10px;
  border: none;
  background: var(--accent-primary);
  color: #fff;
  font-size: 1.05rem;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s ease, background 0.2s ease;
}

.btn-save:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-save--disabled,
.btn-save:disabled {
  background: var(--bg-tertiary);
  color: var(--text-tertiary);
  cursor: not-allowed;
}

/* 账号与安全 */
.account-security-form {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
  padding: var(--spacing-xl);
}

.account-section {
  margin-bottom: var(--spacing-lg);
}

.account-section:last-child {
  margin-bottom: 0;
}

.account-section-title {
  margin: 0 0 var(--spacing-sm);
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.account-section-desc {
  margin: 0 0 var(--spacing-lg);
  font-size: var(--font-size-small);
  color: var(--text-tertiary);
  line-height: 1.5;
}

.account-login-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.account-login-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: 10px;
  transition: background 0.2s ease;
}

.account-login-item:hover {
  background: var(--bg-tertiary);
}

.account-login-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.account-login-icon--user {
  background: rgba(37, 99, 235, 0.15);
  color: #2563eb;
}

.account-login-icon--phone {
  background: rgba(37, 99, 235, 0.15);
  color: #2563eb;
}

.account-login-icon--email {
  background: rgba(234, 179, 8, 0.2);
  color: #ca8a04;
}

.account-login-icon--password {
  background: rgba(34, 197, 94, 0.15);
  color: #16a34a;
}

.account-login-icon--link {
  background: rgba(37, 99, 235, 0.15);
  color: #2563eb;
}

.account-login-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.account-login-label {
  font-size: var(--font-size-small);
  color: var(--text-tertiary);
}

.account-login-value {
  font-size: var(--font-size-base);
  color: var(--text-primary);
  font-weight: 500;
}

.account-login-value--muted {
  font-weight: 400;
  color: var(--text-tertiary);
}

.account-login-info {
  font-size: 14px;
  color: var(--text-tertiary);
  cursor: help;
}

.btn-account {
  padding: 6px 14px;
  border-radius: 8px;
  border: 1px solid var(--border-medium);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: var(--font-size-small);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-account:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border-color: var(--accent-primary);
}

.account-login-chevron {
  flex-shrink: 0;
  color: var(--text-tertiary);
}

.password-modal-desc {
  margin: 0 0 var(--spacing-md);
  font-size: var(--font-size-small);
  color: var(--text-tertiary);
}

.password-modal-form .form-row {
  margin-bottom: var(--spacing-sm);
}

.password-modal-form .form-row:last-child {
  margin-bottom: 0;
}

.settings-placeholder {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
  padding: var(--spacing-xl);
  color: var(--text-tertiary);
}

/* 标签管理 */
.tags-panel {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
  padding: var(--spacing-xl);
}
.tags-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  flex-wrap: wrap;
}
.tags-desc {
  margin: 0;
  font-size: var(--font-size-small);
  color: var(--text-tertiary);
  line-height: 1.5;
  flex: 1;
  min-width: 200px;
}
.tags-loading,
.tags-empty {
  padding: var(--spacing-xl);
  text-align: center;
  color: var(--text-tertiary);
  font-size: var(--font-size-small);
}
.tags-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.tag-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: 10px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
}
.tag-chip {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: var(--font-size-small);
  font-weight: 500;
}
.tag-actions {
  display: flex;
  gap: var(--spacing-sm);
}
.btn-account--danger:hover {
  border-color: #ef4444;
  color: #ef4444;
}

/* 标签弹窗：与编辑项目统一风格（图二）- 圆形色板 + 取消/确定 */
.tag-modal__card {
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-soft);
}
.tag-modal__form {
  padding: 0;
}
.tag-modal__row {
  display: flex;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}
.tag-modal__row:last-child {
  margin-bottom: 0;
}
.tag-modal__label {
  flex-shrink: 0;
  width: 64px;
  font-size: var(--font-size-base);
  color: var(--text-primary);
}
.tag-modal__input {
  flex: 1;
  min-width: 0;
}
.tag-modal__input :deep(.n-input__input-el) {
  border-radius: 10px;
}
.tag-modal__color-swatches {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}
.tag-modal__swatch {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid transparent;
  padding: 0;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  flex-shrink: 0;
}
.tag-modal__swatch:hover {
  transform: scale(1.1);
}
.tag-modal__swatch--selected {
  border-color: var(--text-primary);
  box-shadow: 0 0 0 2px var(--card, #fff);
  transform: scale(1.05);
}
[data-theme="dark"] .tag-modal__swatch--selected {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px var(--bg-secondary);
}
.tag-modal__swatch--custom {
  position: relative;
  width: 28px;
  height: 28px;
  min-width: 28px;
  min-height: 28px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  clip-path: circle(14px at 14px 14px);
  padding: 0;
  cursor: pointer;
}
.tag-modal__picker {
  position: absolute;
  inset: 0;
  width: 28px !important;
  height: 28px !important;
  border-radius: 50%;
  overflow: hidden;
  clip-path: circle(14px at 14px 14px);
}
.tag-modal__picker :deep(.n-color-picker),
.tag-modal__picker :deep(.n-color-picker-trigger),
.tag-modal__picker :deep(.n-button) {
  width: 28px !important;
  height: 28px !important;
  min-width: 28px !important;
  min-height: 0 !important;
  max-width: 28px !important;
  max-height: 28px !important;
  padding: 0 !important;
  border-radius: 50% !important;
  border: none !important;
  background: transparent !important;
  overflow: hidden !important;
  clip-path: circle(14px at 14px 14px) !important;
}
.tag-modal__picker :deep(.n-color-picker-trigger__fill) {
  position: absolute !important;
  inset: 0 !important;
  width: 28px !important;
  height: 28px !important;
  border-radius: 50% !important;
  overflow: hidden !important;
  clip-path: circle(14px at 14px 14px) !important;
}
.tag-modal__picker :deep(.n-color-picker-trigger .n-color-picker-trigger__value),
.tag-modal__picker :deep(.n-button__content) {
  display: none !important;
}
.tag-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
}
.tag-modal__cancel {
  padding: 8px 16px;
  border-radius: 10px;
  border: 1px solid var(--border-medium);
  background: transparent;
  color: var(--text-secondary);
  font-size: var(--font-size-base);
  cursor: pointer;
}
.tag-modal__cancel:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}
.tag-modal__confirm {
  padding: 8px 20px;
  border-radius: 10px;
}

.tag-delete-desc {
  margin: 0;
  font-size: var(--font-size-small);
  color: var(--text-secondary);
  line-height: 1.5;
}

:deep(.n-input),
:deep(.n-select) {
  max-width: 100%;
}

:deep(.n-input .n-input__input-el),
:deep(.n-select .n-select-trigger) {
  border-radius: 10px;
  font-size: 1rem;
}

:deep(.n-select .n-select-trigger) {
  min-height: 44px;
}
</style>
