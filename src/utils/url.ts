/**
 * 后端 API 基础路径（与 request.ts 中 axios baseURL 一致）
 */
export const API_BASE_PATH =
  typeof import.meta.env.VITE_API_BASE_URL === 'string' && import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')
    : '/api';

/**
 * 将后端返回的「带绝对域名的 /api 资源 URL」改为当前页面同源。
 *
 * 典型场景：数据库存的是 `http://192.168.x.x:8080/api/files/...` 或 `http://127.0.0.1:8080/api/...`，
 * 浏览器从端口转发 / 另一台机器访问前端时直连该地址会失败；改为 `location.origin + /api/...` 可走 Vite 代理或同源网关。
 */
export function rewriteApiAssetToSameOrigin(url: string): string {
  const t = url.trim();
  /** SSR / 无 window 时无法比较 origin，原样返回 */
  if (typeof window === 'undefined') return t;

  const rewriteIfApiPath = (u: URL): string | null => {
    if (!u.pathname.startsWith('/api')) return null;
    if (u.origin === window.location.origin) return null;
    return `${window.location.origin}${u.pathname}${u.search}${u.hash}`;
  };

  try {
    if (t.startsWith('http://') || t.startsWith('https://')) {
      const u = new URL(t);
      return rewriteIfApiPath(u) ?? t;
    }
    if (t.startsWith('//')) {
      const u = new URL(`${window.location.protocol}${t}`);
      const rw = rewriteIfApiPath(u);
      if (rw) return rw;
      return `${window.location.protocol}${t}`;
    }
  } catch {
    /* 非合法 URL 时保持原样 */
  }
  return t;
}

/**
 * 后端资源（如图片）的 origin，用于拼接相对路径的头像/附件 URL。
 * 优先级：VITE_API_BASE → VITE_API_BASE_URL 的 origin → 当前页 origin
 */
export function getBackendOrigin(): string {
  const explicitBase = import.meta.env.VITE_API_BASE;
  if (typeof explicitBase === 'string' && explicitBase.trim()) {
    const s = explicitBase.trim().replace(/\/$/, '');
    if (s.startsWith('http://') || s.startsWith('https://')) {
      try {
        return new URL(s).origin;
      } catch {
        return s;
      }
    }
    return s;
  }
  if (typeof API_BASE_PATH === 'string' && (API_BASE_PATH.startsWith('http://') || API_BASE_PATH.startsWith('https://'))) {
    try {
      return new URL(API_BASE_PATH).origin;
    } catch {
      return typeof window !== 'undefined' ? window.location.origin : '';
    }
  }
  return typeof window !== 'undefined' ? window.location.origin : '';
}

/** 内联预览等场景，不做改写 */
function isDataOrBlobUrl(s: string): boolean {
  const t = s.trim();
  const low = t.toLowerCase();
  return low.startsWith('data:') || low.startsWith('blob:');
}

/**
 * 头像与附件共用：绝对地址先同源改写；相对路径用 getBackendOrigin() 拼成绝对后再同源改写
 * （避免配置了内网 origin 时 /api 资源仍直连失败，最终尽量走当前页 + Vite 代理）。
 */
function resolveAssetDisplayUrl(raw: string): string {
  const s = raw.trim();
  if (isDataOrBlobUrl(s)) return s;
  if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('//')) {
    return rewriteApiAssetToSameOrigin(s);
  }
  const origin = getBackendOrigin();
  const absolute = origin + (s.startsWith('/') ? s : '/' + s);
  return rewriteApiAssetToSameOrigin(absolute);
}

/**
 * 将后端返回的头像路径转为可请求的完整 URL。
 */
export function getAvatarUrl(avatar: string | undefined): string {
  if (!avatar || !avatar.trim()) return '';
  return resolveAssetDisplayUrl(avatar);
}

/**
 * 附件展示用 URL；逻辑与 getAvatarUrl 一致（见 FRONTEND_FIXES.md）。
 */
export function getAttachmentUrl(fileUrl: string | undefined): string {
  if (!fileUrl || !fileUrl.trim()) return '';
  return resolveAssetDisplayUrl(fileUrl);
}
