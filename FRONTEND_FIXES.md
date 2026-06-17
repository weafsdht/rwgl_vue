# 前端修复与约定说明

本文档记录前端与后端约定、下载/预览等关键逻辑，便于联调与复用到其他项目。

---

## 5. 附件与下载

### 5.1 头像与附件展示 URL（`getAvatarUrl` / `getAttachmentUrl`）

实现见 **`src/utils/url.ts`**，与附件「下载」分离：展示用 `<img src>` 等**不会**带 `Authorization`。

- **`rewriteApiAssetToSameOrigin(url)`**  
  解析为绝对 URL 后：若 `pathname` 以 `/api` 开头、且与 `window.location.origin` **不同源**，则返回 `当前页 origin + pathname + search + hash`；否则原样返回。SSR / 无 `window` 时直接返回入参。

- **`getAvatarUrl` / `getAttachmentUrl`（二者一致）**  
  - `data:`、`blob:`：不改写。  
  - `http(s):`、`//`：先走同源改写。  
  - 相对路径：用 `getBackendOrigin()` 拼成绝对地址后，**再**做一次同源改写（即使用错内网 origin，只要路径是 `/api/...`，也会尽量改到当前页同源，便于走 Vite 代理）。

**仍裂图时**：资源不是 `/api/...`（如 `/uploads/...`）不会被改写，需在 Vite `proxy` 中转发对应路径，或让后端只返回可走代理的地址；若资源必须带 token，需后端匿名/签名 URL 或前端 `fetch` + blob URL。

联调后请 **`npm run build` 或重启开发服务** 并**硬刷新**再验。

### 5.2 附件下载：2xx 校验与 200+JSON 防护

**问题**：若后端返回错误时仍把响应体当文件保存或预览（例如 200 + JSON 或 4xx/5xx + JSON），用户会看到「下载的 PDF 是 JSON」或「文件损坏」。

**根本办法**：

1. **只用「按 ID 下载」接口**  
   使用 `GET /api/attachments/{id}/download`（带 `Authorization: Bearer <token>`），不要用 `fileUrl` 直接做下载链接或在新标签打开。

2. **先看状态码，再当文件处理**  
   - 只有 **response.ok === true（2xx）** 时，才把响应体当文件：`response.blob()` 后再保存或预览。  
   - 只要 **!response.ok**，不要把响应体当文件，应提示「下载失败」，并用 `response.json().message` 做提示。

3. **防护「200 + JSON」**  
   若后端错误地返回 **200 OK** 且 body 为 JSON（如 `{"code":500,"message":"服务暂时不可用,请稍后重试"}`）：  
   - 只对**小响应（< 4KB）**做检测，避免大文件被误判。  
   - 用**首字节是否为 `{`（0x7b）**判断是否像 JSON（只读 1 字节，小响应再 `blob.text()`），不把整个大 body 当字符串读。  
   - 若判定为 JSON：  
     - `code !== 0`：不返回 body，直接 `throw new Error(message)`。  
     - `code === 0` 或无 `code`：视为异常，`throw new Error('服务返回格式异常，请稍后重试')`，不把这段 JSON 当文件返回。  
   - 若 `JSON.parse` 抛 `SyntaxError`，则当作非 JSON，正常返回 blob。

**后端建议**：错误时使用 **4xx/5xx 状态码** 并返回 JSON，便于前端用 `response.ok` 判断，无需依赖 body 内容。

---

#### 在本项目（TaskFlow）中的用法

- 统一下载逻辑在 **`src/api/attachmentDownload.ts`**：  
  - `downloadAttachment(options)`：带鉴权请求 `GET /api/attachments/{id}/download`，校验 2xx 与 200+JSON，返回 `{ blob, fileName }` 或抛错。  
  - `triggerSave(result)`：用返回的 blob 触发浏览器另存为。

- **调用示例（附件库「下载」按钮）**：

```ts
import { downloadAttachment, triggerSave } from '@/api/attachmentDownload';
import { getBackendOrigin } from '@/utils/request';
import { useUserStore } from '@/stores/user';

// 在组件的下载处理函数中：
const userStore = useUserStore();

async function handleDownload(att: { id: number; fileName?: string }) {
  try {
    const result = await downloadAttachment({
      apiBaseUrl: getBackendOrigin(),
      attachmentId: att.id,
      fileName: att.fileName || '附件',
      getToken: () => userStore.token ?? null,
    });
    triggerSave(result);
    // Toast「下载成功」
  } catch (e) {
    // Toast (e as Error).message，如「服务暂时不可用，请稍后重试」
  }
}
```

- **注意**：成功时只调用 `triggerSave(result)` 并提示成功；失败时在 `catch` 里用 `e.message` 做 Toast，**不要把响应当文件保存或预览**。

---

#### 在含「附件库」的其他前端项目中的用法

1. 将本仓库的 **`src/api/attachmentDownload.ts`** 拷到你的前端项目（或通过 monorepo 引用）。
2. 在附件库的「下载」按钮里：  
   - 调用 `downloadAttachment({ apiBaseUrl, attachmentId, fileName, getToken })`；  
   - 成功则 `triggerSave(result)` 并 Toast「下载成功」；  
   - 失败则 `catch` 后 Toast `e.message`（如「服务暂时不可用，请稍后重试」），不要把响应当文件保存或预览。

这样即使用户点击下载时后端错误地返回 200 + JSON，前端也会弹出错误提示，而不会把 JSON 当成 PDF 保存或打开。
