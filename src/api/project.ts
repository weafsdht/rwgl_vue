import type { AxiosRequestConfig } from 'axios';
import { request } from '@/utils/request';
import type { ApiResponse } from '@/types';
import type { Project, ProjectAttachment, ProjectPermission, ProjectVO } from '@/types';

const BASE = '/projects';

/**
 * 可注入的 HTTP 客户端（父组件可传入自建 axios / fetch 封装；路径为相对 baseURL，如 `/projects`）
 */
export interface ProjectHttpClient {
  get: (url: string) => Promise<unknown>;
  postJson: (url: string, body?: unknown) => Promise<unknown>;
  patchJson: (url: string, body?: unknown) => Promise<unknown>;
  delete: (url: string) => Promise<unknown>;
  postFormData: (url: string, formData: FormData) => Promise<unknown>;
}

/**
 * 解析响应：兼容一层 axios 的 `response.data` 包装；若内层为 `{ code, data }` 且 code 表成功则再取 data。
 */
export function parseApiResponse<T>(raw: unknown): T {
  let x: unknown = raw;
  if (x !== null && typeof x === 'object' && 'data' in x) {
    const inner = (x as { data: unknown }).data;
    if (inner !== undefined) x = inner;
  }
  if (x !== null && typeof x === 'object' && 'code' in x && 'data' in x) {
    const api = x as ApiResponse<T>;
    const c = Number((api as { code?: number }).code);
    if (c === 0 || c === 200) return api.data as T;
  }
  return x as T;
}

/** 使用全局 `request` 封装生成默认 ProjectHttpClient */
export function createRequestProjectHttpClient(req: typeof request): ProjectHttpClient {
  return {
    get: (url) => req.get(url),
    postJson: (url, body) => req.post(url, body),
    patchJson: (url, body) => req.patch(url, body),
    delete: (url) =>
      req.delete(url, {
        skipGlobalError: url.includes('/attachments'),
      } as AxiosRequestConfig),
    postFormData: (url, formData) =>
      req.post(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        skipGlobalError: true,
      } as AxiosRequestConfig),
  };
}

export const defaultProjectHttpClient = createRequestProjectHttpClient(request);

export async function createProject(
  client: ProjectHttpClient,
  data: Partial<Project>
): Promise<Project> {
  const raw = await client.postJson(BASE, data);
  return parseApiResponse<Project>(raw);
}

export async function updateProject(
  client: ProjectHttpClient,
  id: number,
  data: Partial<Project>
): Promise<Project> {
  const raw = await client.patchJson(`${BASE}/${id}`, data);
  return parseApiResponse<Project>(raw);
}

export async function fetchProjectApi(client: ProjectHttpClient, id: number): Promise<Project> {
  const raw = await client.get(`${BASE}/${id}`);
  return parseApiResponse<Project>(raw);
}

/** 失败时返回 []，不抛错 */
export async function listProjectAttachmentsSafe(
  client: ProjectHttpClient,
  projectId: number
): Promise<ProjectAttachment[]> {
  try {
    const raw = await client.get(`${BASE}/${projectId}/attachments`);
    const list = parseApiResponse<ProjectAttachment[]>(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function uploadProjectAttachment(
  client: ProjectHttpClient,
  projectId: number,
  file: File
): Promise<ProjectAttachment> {
  const formData = new FormData();
  formData.append('file', file);
  const rel = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
  if (rel) formData.append('relativePath', rel);
  const raw = await client.postFormData(`${BASE}/${projectId}/attachments`, formData);
  return parseApiResponse<ProjectAttachment>(raw);
}

export async function deleteProjectAttachment(
  client: ProjectHttpClient,
  projectId: number,
  attachmentId: number
): Promise<void> {
  await client.delete(`${BASE}/${projectId}/attachments/${attachmentId}`);
}

/** 仅要求具备 get(url) 的客户端（兼容旧代码） */
export interface ProjectApiClient {
  get: (url: string) => Promise<{ data?: unknown }>;
}

/**
 * 请求 GET /api/projects/{id}，从 response.data 解包后返回 ProjectVO
 * @deprecated 优先使用 fetchProjectApi(createRequestProjectHttpClient(request), id)
 */
export async function getProject(api: ProjectApiClient, id: number): Promise<ProjectVO> {
  const res = await api.get(`${BASE}/${id}`);
  const raw = res?.data;
  return parseApiResponse<ProjectVO>(raw);
}

export default {
  getProjects: () => {
    return request.get<Project[]>(BASE);
  },

  getProject: (id: number) => {
    return fetchProjectApi(defaultProjectHttpClient, id);
  },

  getProjectTaskStats: (id: number) => {
    return request.get(`${BASE}/${id}/task-stats`);
  },

  createProject: (data: Partial<Project>) => {
    return createProject(defaultProjectHttpClient, data);
  },

  updateProject: (id: number, data: Partial<Project>) => {
    return updateProject(defaultProjectHttpClient, id, data);
  },

  deleteProject: (id: number) => {
    return request.delete<void>(`${BASE}/${id}`);
  },

  shareToTeam: (projectId: number, teamId: number, permission: ProjectPermission = 'readonly') =>
    request.post(`${BASE}/${projectId}/shares`, { teamId, permission }),

  getProjectShares: (projectId: number) => request.get(`${BASE}/${projectId}/shares`),

  setMemberPermission: (projectId: number, userId: number, permission: ProjectPermission) =>
    request.patch<void>(`${BASE}/${projectId}/shares/${userId}`, { permission }),

  removeShare: (projectId: number, shareId: number) =>
    request.delete<void>(`${BASE}/${projectId}/shares/${shareId}`),

  applyEditPermission: (projectId: number) =>
    request.post(`${BASE}/${projectId}/edit-requests`, {}),

  getPendingEditRequests: (projectId?: number) =>
    request.get(`${BASE}/edit-requests`, {
      params: projectId != null ? { projectId } : undefined,
    }),

  resolveEditRequest: (requestId: number, approve: boolean) =>
    request.patch(`${BASE}/edit-requests/${requestId}`, { approve }),

  uploadProjectAttachment: (projectId: number, file: File) =>
    uploadProjectAttachment(defaultProjectHttpClient, projectId, file),

  getProjectAttachments: (projectId: number) =>
    listProjectAttachmentsSafe(defaultProjectHttpClient, projectId),

  deleteProjectAttachment: (projectId: number, attachmentId: number) =>
    deleteProjectAttachment(defaultProjectHttpClient, projectId, attachmentId),
};
