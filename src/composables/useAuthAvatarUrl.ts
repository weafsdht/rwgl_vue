import { ref, watch, onBeforeUnmount, toValue, type MaybeRefOrGetter, type Ref } from 'vue';
import http, { getAvatarUrl } from '@/utils/request';

/**
 * 需鉴权的同源 `/api/...` 头像：`<img src>` 无法带 Bearer，用 axios 拉 blob 再 object URL。
 * `avatarPath` 支持 ref / computed / getter。
 */
export function useAuthAvatarUrl(
  avatarPath: MaybeRefOrGetter<string>,
  token: Ref<string | null | undefined>
) {
  const src = ref<string | undefined>();
  let objectUrlToRevoke: string | null = null;

  function revokeBlob() {
    if (objectUrlToRevoke) {
      URL.revokeObjectURL(objectUrlToRevoke);
      objectUrlToRevoke = null;
    }
  }

  async function load() {
    revokeBlob();
    const raw = toValue(avatarPath);
    const path = typeof raw === 'string' ? raw.trim() : '';
    if (!path) {
      src.value = undefined;
      return;
    }
    const full = getAvatarUrl(path);
    if (!full) {
      src.value = undefined;
      return;
    }
    if (/^(data:|blob:)/i.test(full)) {
      src.value = full;
      return;
    }

    let apiRel: string | null = null;
    try {
      const u = new URL(full, window.location.origin);
      if (u.origin === window.location.origin && u.pathname.startsWith('/api/')) {
        apiRel = u.pathname.slice(4) + u.search;
      }
    } catch {
      /* 非标准 URL 时走下方直链 */
    }

    if (!apiRel || !token.value) {
      const sep = full.includes('?') ? '&' : '?';
      src.value = `${full}${sep}t=${Date.now()}`;
      return;
    }

    try {
      const res = await http.get<Blob>(apiRel, {
        responseType: 'blob',
        skipGlobalError: true,
        validateStatus: (s) => s >= 200 && s < 300,
      });
      const blob = res.data as unknown;
      if (!(blob instanceof Blob) || blob.size === 0) throw new Error('empty blob');
      const o = URL.createObjectURL(blob);
      objectUrlToRevoke = o;
      src.value = o;
    } catch {
      const sep = full.includes('?') ? '&' : '?';
      src.value = `${full}${sep}t=${Date.now()}`;
    }
  }

  watch(
    () => [toValue(avatarPath), token.value] as const,
    () => {
      void load();
    },
    { immediate: true }
  );

  onBeforeUnmount(() => {
    revokeBlob();
    src.value = undefined;
  });

  return { avatarSrc: src };
}
