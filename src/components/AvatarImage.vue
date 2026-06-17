<template>
  <span class="avatar-image-root" :class="rootClass">
    <img
      v-if="avatarSrc && !broken"
      :src="avatarSrc"
      :alt="altText"
      :class="imgClass"
      loading="lazy"
      @error="onImgError"
    />
    <!-- 仅在网络/解码失败时显示首字；加载中由父级背景占位 -->
    <span v-else-if="broken && initial" class="avatar-image-fallback">{{ initial }}</span>
  </span>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useUserStore } from '@/stores/user';
import { useAuthAvatarUrl } from '@/composables/useAuthAvatarUrl';

const props = withDefaults(
  defineProps<{
    /** 后端返回的原始 avatar 字段（相对路径或完整 URL） */
    path?: string | null;
    /** 加载失败或无图时的首字 */
    initial?: string;
    alt?: string;
    /** 加在根节点 */
    rootClass?: string;
    /** 加在 img 上 */
    imgClass?: string;
  }>(),
  { path: '', initial: '', alt: '', rootClass: '', imgClass: '' }
);

const userStore = useUserStore();
const { token } = storeToRefs(userStore);

const { avatarSrc } = useAuthAvatarUrl(() => props.path?.trim() ?? '', token);

const broken = ref(false);

watch(
  () => props.path,
  () => {
    broken.value = false;
  }
);

const altText = computed(() => props.alt || props.initial || '');

function onImgError() {
  broken.value = true;
}
</script>

<style scoped>
.avatar-image-root {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
}
.avatar-image-root img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: inherit;
}
.avatar-image-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border-radius: inherit;
}
</style>
