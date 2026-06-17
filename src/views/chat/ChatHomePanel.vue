<template>
  <div class="chat-home">
    <div class="chat-home__inner">
      <div class="chat-home__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <p class="chat-home__title">选择会话</p>
      <p class="chat-home__hint">在左侧列表中选择一个会话，或前往「我的好友」发起聊天</p>
    </div>
  </div>
</template>

<style scoped>
.chat-home {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  padding: var(--spacing-xl);
  background: var(--bg-primary);
}

.chat-home__inner {
  text-align: center;
  max-width: 360px;
}

.chat-home__icon {
  width: 56px;
  height: 56px;
  margin: 0 auto var(--spacing-md);
  color: var(--text-tertiary);
  opacity: 0.85;
}

.chat-home__icon svg {
  width: 100%;
  height: 100%;
}

.chat-home__title {
  margin: 0 0 var(--spacing-sm);
  font-size: var(--font-size-lead);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.chat-home__hint {
  margin: 0;
  font-size: var(--font-size-small);
  line-height: var(--line-height-relaxed);
  color: var(--text-tertiary);
}
</style>
