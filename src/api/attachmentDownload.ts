/**
 * 附件统一下载：GET /api/attachments/{id}/download
 *
 * 1. 原有逻辑：仅当 status 为 2xx 时才把响应当文件返回；非 2xx 用 response.json().message 抛出。
 * 2. 防护 200+JSON：若后端错误地返回 200 OK 且 body 为 JSON（如 {"code":500,"message":"..."}），
 *    对小响应（< 4KB）用首字节是否为 `{`（0x7b）判断，若为 JSON 且 code !== 0 或 code === 0 均抛出，不把 JSON 当文件返回。
 *
 * 用法：见下方 downloadAttachment 与 triggerSave。
 */

const SAFE_SIZE = 4 * 1024; // 4KB，仅对小响应做 JSON 检测，避免大文件误判
const JSON_FIRST_BYTE = 0x7b; // '{'

export interface DownloadAttachmentOptions {
  /** 后端 baseURL，如 https://api.example.com 或空字符串（走相对路径 /api，适合开发时 Vite 代理） */
  apiBaseUrl?: string;
  /** 附件 ID */
  attachmentId: number;
  /** 保存时使用的文件名（可选，不传则用响应头或默认） */
  fileName?: string;
  /** 获取当前用户 token */
  getToken: () => string | null;
}

export interface DownloadAttachmentResult {
  blob: Blob;
  fileName: string;
}

/**
 * 请求附件下载流，校验 2xx 与 200+JSON 防护，返回 blob 与文件名；失败则 throw Error(message)。
 * 调用方可用 triggerSave(result) 触发浏览器保存，或用 blob 做预览。
 */
export async function downloadAttachment(
  options: DownloadAttachmentOptions
): Promise<DownloadAttachmentResult> {
  const { apiBaseUrl, attachmentId, fileName: preferredName, getToken } = options;
  const token = getToken();
  const base = apiBaseUrl?.replace(/\/$/, '') || '';
  const url = `${base}/api/attachments/${attachmentId}/download`;

  const response = await fetch(url, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  // 1. 非 2xx：不返回 body，用 response.json().message 抛出
  if (!response.ok) {
    let message = '下载失败';
    try {
      const data = (await response.json()) as { message?: string };
      if (data?.message && typeof data.message === 'string') {
        message = data.message;
      }
    } catch {
      message = response.statusText || `下载失败（${response.status}）`;
    }
    throw new Error(message);
  }

  const blob = await response.blob();

  // 2. 防护 200+JSON：仅对小响应做检测，首字节为 { 则按 JSON 处理
  if (blob.size < SAFE_SIZE && blob.size > 0) {
    const buf = await blob.slice(0, 1).arrayBuffer();
    const firstByte = new Uint8Array(buf)[0];
    if (firstByte === JSON_FIRST_BYTE) {
      const text = await blob.text();
      try {
        const data = JSON.parse(text) as { code?: number; message?: string };
        if (typeof data.code === 'number' && data.code !== 0) {
          throw new Error(data.message || '服务暂时不可用，请稍后重试');
        }
        // code === 0 或 无 code：均视为异常，不把 JSON 当文件返回
        throw new Error('服务返回格式异常，请稍后重试');
      } catch (e) {
        if (e instanceof SyntaxError) {
          // 非 JSON，当作正常文件返回
        } else {
          throw e;
        }
      }
    }
  }

  // 从 Content-Disposition 或参数取文件名
  let fileName = preferredName || '下载';
  const disposition = response.headers.get('Content-Disposition');
  if (disposition) {
    const match = /filename\*?=(?:UTF-8'')?([^;]+)/i.exec(disposition);
    if (match?.[1]) {
      try {
        fileName = decodeURIComponent(match[1].trim().replace(/^["']|["']$/g, ''));
      } catch {
        fileName = match[1].trim().replace(/^["']|["']$/g, '');
      }
    }
  }

  return { blob, fileName };
}

/**
 * 用 downloadAttachment 的结果触发浏览器保存（另存为）。
 */
export function triggerSave(result: DownloadAttachmentResult): void {
  const { blob, fileName } = result;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
