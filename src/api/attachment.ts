import http, { request } from '@/utils/request';
import type { Attachment } from '@/types';

const BASE = '/tasks';

/**
 * 附件上传接口：后端应将文件存储到华为云 OBS 对象存储，
 * 并将返回的 Attachment.fileUrl 指向 OBS 的访问地址。
 */
export default {
  /**
   * 上传附件（后端接收后存入华为云 OBS，返回带 fileUrl 的 Attachment）
   * @param tagIds 可选，附件关联的标签 ID 列表（后端支持时传入）
   */
  uploadAttachment: (taskId: number, file: File, tagIds?: number[]) => {
    const formData = new FormData();
    formData.append('file', file);
    if (tagIds?.length) {
      formData.append('tagIds', JSON.stringify(tagIds));
    }
    return request.post<Attachment>(`${BASE}/${taskId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      skipGlobalError: true, // 由编辑任务弹窗统一展示「上传附件失败」Toast，避免重复
    });
  },

  /**
   * 获取任务附件列表（失败由调用方处理；避免拦截器弹「网络异常」Toast，编辑弹窗/附件页已 catch）
   */
  getAttachments: (taskId: number) => {
    return request.get<Attachment[]>(`${BASE}/${taskId}/attachments`, { skipGlobalError: true });
  },

  /**
   * 删除附件
   */
  deleteAttachment: (taskId: number, attachmentId: number) => {
    return request.delete<void>(`${BASE}/${taskId}/attachments/${attachmentId}`);
  },

  /**
   * 重命名附件
   */
  renameAttachment: (taskId: number, attachmentId: number, fileName: string) => {
    return request.patch<Attachment>(`${BASE}/${taskId}/attachments/${attachmentId}`, { fileName });
  },

  /**
   * 更新附件（所属任务、标签、文件名；与 rename 同一路径，需一并传 fileName，避免后端二次 PATCH 校验缺字段）
   */
  updateAttachment: (
    taskId: number,
    attachmentId: number,
    data: { taskId?: number; tagIds?: number[]; fileName?: string }
  ) => {
    return request.patch<Attachment>(`${BASE}/${taskId}/attachments/${attachmentId}`, data);
  },

  /**
   * 下载附件（根本办法：按 ID 下载 + 先看状态码）
   * - 请求：GET /api/attachments/{id}/download，带 Authorization: Bearer <token>（由 axios 统一注入）。
   * - 只有 response.ok === true（状态码 2xx）时，才把响应体当文件返回（blob）；调用方再 response.blob() 后保存或预览。
   * - 只要 !response.ok，绝不返回 body，直接 throw，避免把错误 JSON 当文件保存导致“损坏”；失败时用 response.json().message 抛出，由调用方提示「下载失败」。
   */
  downloadAttachment: async (attachmentId: number): Promise<Blob> => {
    const res = await http.get<Blob>(`/attachments/${attachmentId}/download`, {
      responseType: 'blob',
      skipGlobalError: true,
      validateStatus: () => true,
    });

    const status = res.status ?? 0;
    const ok = status >= 200 && status < 300;

    if (!ok) {
      let message = res.statusText || '下载失败';
      const data = res.data;
      if (data instanceof Blob) {
        try {
          const text = await data.text();
          const json = JSON.parse(text) as { message?: string; code?: number };
          if (json?.message) message = json.message;
          else if (text) message = text;
        } catch {
          if (status === 404) message = '附件不存在';
          else if (status >= 500) message = '服务异常';
        }
      }
      throw new Error(message);
    }

    // 防护：后端误返回 200 且 body 为 JSON 错误时，绝不当文件返回（避免“下载的 PDF 是 JSON”）
    const data = res.data as Blob;
    if (data instanceof Blob && data.size > 0 && data.size < 4096) {
      const firstByte = await data.slice(0, 1).arrayBuffer().then((b) => new Uint8Array(b)[0]);
      if (firstByte === 0x7b) {
        const text = await data.text();
        try {
          const json = JSON.parse(text) as { code?: number; message?: string };
          if (typeof json?.code === 'number' && json.code !== 0) {
            throw new Error(json?.message || '服务暂时不可用，请稍后重试');
          }
          throw new Error('服务返回格式异常，请稍后重试');
        } catch (e) {
          const msg = (e as Error)?.message ?? '';
          if (e instanceof Error && (msg.includes('服务') || msg.includes('请稍后'))) throw e;
          throw new Error('下载失败');
        }
      }
    }

    return data as Blob;
  },
};
