import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import type { ApiResponse } from '@/types';
import { API_BASE_PATH } from '@/utils/url';

export {
  API_BASE_PATH,
  getBackendOrigin,
  getAvatarUrl,
  getAttachmentUrl,
  rewriteApiAssetToSameOrigin,
} from '@/utils/url';

/** 扩展请求配置：部分接口由调用方自行展示错误（如附件上传），避免重复 Toast */
declare module 'axios' {
  interface AxiosRequestConfig {
    skipGlobalError?: boolean;
  }
}

// 错误提示节流：同一文案 2 秒内只提示一次
let lastErrorMsg = '';
let lastErrorTime = 0;
const ERROR_DEBOUNCE_MS = 2000;

/**
 * 显示错误消息（节流：同一文案 2 秒内不重复）
 */
function showErrorMessage(message: string) {
  const now = Date.now();
  if (message === lastErrorMsg && now - lastErrorTime < ERROR_DEBOUNCE_MS) return;
  lastErrorMsg = message;
  lastErrorTime = now;

  const event = new CustomEvent('api-error', { detail: { message } });
  window.dispatchEvent(event);
}

/**
 * 将技术错误转为用户可理解的文案
 */
function getErrorMessage(err: { response?: { status?: number; data?: unknown }; request?: unknown }): string {
  const data = err.response?.data as { message?: string; code?: number } | undefined;
  const backendMsg = data?.message;

  // 优先使用后端返回的 message（若已本地化、友好）
  if (backendMsg && typeof backendMsg === 'string' && backendMsg.length < 100) {
    return backendMsg;
  }

  const status = err.response?.status;
  if (status === 401) return '登录已过期，请重新登录';
  if (status === 403) return '暂无权限';
  if (status === 404) return '请求的资源不存在';
  if (status === 503) return '服务暂时不可用，请稍后重试';
  if (status === 500) return '服务器繁忙，请稍后重试';
  if (status === 502) return '网关异常，请稍后重试';
  if (status === 400) return '请求参数错误';

  // 无 response（Network Error、超时等）
  if (!err.response) {
    return '网络连接异常，请检查网络或稍后重试';
  }

  return '操作失败，请稍后重试';
}

/**
 * 清除 token；若当前不在登录/注册页则整页跳转至登录页。
 * 在登录页请求失败若也返回 401（如密码错误），不应 `location.href` 重载，否则易白屏闪烁且打断 Vue。
 */
function clearTokenAndRedirectToLoginIfNeeded() {
  localStorage.removeItem('token');
  const path = window.location.pathname;
  if (path.includes('/login') || path.includes('/register')) {
    return;
  }
  setTimeout(() => {
    window.location.href = '/login';
  }, 300);
}

/**
 * 与后端接口约定：
 * - 基础路径 baseURL: '/api'（如 GET /api/tasks），或通过 VITE_API_BASE_URL 指定完整地址（如 http://192.168.1.220:8080）
 * - 鉴权：请求头 Authorization: Bearer <token>
 * - 响应：{ code: 0, message: 'success', data: ... }，业务数据在 data 中
 * - 任务状态 status 为 0-based：0=待办、1=进行中、2=完成、3=搁置（见 utils/task.ts）
 */
const responseHandler = <T>(res: AxiosResponse<ApiResponse<T>>): T => {
  if (res.data.code !== 0) {
    const errorMessage = res.data.message || '操作失败，请稍后重试';
    const code = Number(res.data.code);
    const skipGlobalError = Boolean(res.config?.skipGlobalError);
    // 未登录：静默清除 token 并跳转登录页，不弹 Toast
    if (code === 401) {
      clearTokenAndRedirectToLoginIfNeeded();
      throw new Error(errorMessage);
    }
    if (!skipGlobalError) showErrorMessage(errorMessage);
    throw new Error(errorMessage);
  }
  return res.data.data;
};

/**
 * 创建 axios 实例（baseURL 与 @/utils/url 中 API_BASE_PATH 一致）
 */
const instance: AxiosInstance = axios.create({
  baseURL: API_BASE_PATH,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 请求拦截器 - 添加 token
 */
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * 响应拦截器 - 统一错误处理
 */
instance.interceptors.response.use(
  (response) => {
    // 检查响应数据格式：后端可能返回 HTTP 200 + body { code: 401, message: "未登录" }
    const data = response.data;
    if (data && typeof data === 'object' && 'code' in data && data.code !== 0 && data.code !== 200) {
      const errorMessage = data.message || '请求失败';
      const code = Number(data.code);
      const skipGlobalError = Boolean(response.config?.skipGlobalError);
      // 未登录：静默清除 token 并跳转登录页，不弹 Toast
      if (code === 401) {
        clearTokenAndRedirectToLoginIfNeeded();
        return Promise.reject(new Error(errorMessage));
      }
      if (!skipGlobalError) showErrorMessage(errorMessage);
      return Promise.reject(new Error(errorMessage));
    }
    return response;
  },
  (error) => {
    const skipGlobalError = error.config?.skipGlobalError;
    const message = getErrorMessage(error);

    // 401：静默跳转登录页，不弹 Toast（已在登录/注册页时不重载）
    if (error.response?.status === 401) {
      clearTokenAndRedirectToLoginIfNeeded();
      return Promise.reject(Object.assign(error, { message }));
    }

    if (!skipGlobalError) showErrorMessage(message);

    if (!error.response && (error.message === 'Network Error' || !error.request)) {
      console.warn('[request] 请求未到达服务器，请检查 baseURL 与后端是否启动。当前 baseURL:', instance.defaults.baseURL);
    }

    return Promise.reject(Object.assign(error, { message }));
  }
);

/**
 * 封装的请求方法
 */
export const request = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return instance.get<ApiResponse<T>>(url, config).then(responseHandler);
  },
  
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return instance.post<ApiResponse<T>>(url, data, config).then(responseHandler);
  },
  
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return instance.patch<ApiResponse<T>>(url, data, config).then(responseHandler);
  },
  
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return instance.delete<ApiResponse<T>>(url, config).then(responseHandler);
  },
};

export default instance;
