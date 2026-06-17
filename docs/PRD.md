# 个人任务管理系统 PRD（当前可用功能版）

**版本**：2.0（基于实际实现整理）  
**更新日期**：2026-02  
**定位**：个人效率工具，前后端分离，Spring Boot 3 后端 + Vue 3 前端

---

# 一、产品概述

## 1.1 产品定位

个人任务管理系统，支持任务全生命周期管理、多视图展示、项目归类、标签体系、统计复盘等核心能力。目标用户：学生、自由职业者、开发者、知识工作者。

## 1.2 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Spring Boot 3.2、MyBatis Plus、Spring Security + JWT、MySQL 5.7、Redis、Flyway |
| 前端 | Vue 3 + TypeScript + Pinia + Naive UI（TaskFlow 项目） |
| 存储 | 本地目录 / 华为云 OBS（附件与头像） |

---

# 二、已实现功能清单

## 2.1 用户系统

| 功能 | 状态 | 接口 / 说明 |
|------|------|-------------|
| 邮箱注册 | ✅ | POST /api/auth/register |
| 邮箱登录 | ✅ | POST /api/auth/login（JSON 或 form-urlencoded） |
| JWT 鉴权 | ✅ | 请求头 `Authorization: Bearer <token>` |
| 获取当前用户 | ✅ | GET /api/users/me |
| 更新个人资料 | ✅ | PATCH /api/users/me（username、nickname、avatar、phone、timezone） |
| 上传头像 | ✅ | POST /api/users/me/avatar（FormData 字段 `file`，JPG/PNG/GIF/WebP ≤ 2MB） |
| 修改密码 | ✅ | PATCH /api/users/me/password（Body：oldPassword、newPassword，新密码至少 6 位；需校验原密码，原密码错误返回 400「原密码错误」；成功返回最新用户信息） |

**UserVO 字段**：id（6 位唯一展示用，如 123456）、email、username、nickname、avatar、phone、timezone。用户名唯一，重复返回 400「用户名已被使用」。

---

## 2.2 任务管理系统（核心）

| 功能 | 状态 | 接口 / 说明 |
|------|------|-------------|
| 创建任务 | ✅ | POST /api/tasks |
| 任务列表 | ✅ | GET /api/tasks（支持 projectId、status、archived、startTimeFrom/To、dueTimeFrom/To） |
| 任务详情 | ✅ | GET /api/tasks/{id} |
| 更新任务 | ✅ | PATCH /api/tasks/{id} |
| 删除任务 | ✅ | DELETE /api/tasks/{id} |
| 看板数据 | ✅ | GET /api/tasks/board（或共用 GET /api/tasks 前端分组） |
| 任务归档列表 | ✅ | GET /api/tasks/archived |
| 恢复归档任务 | ✅ | POST /api/tasks/{id}/restore |
| 任务评论列表 | ✅ | GET /api/tasks/{taskId}/comments |
| 发表评论 | ✅ | POST /api/tasks/{taskId}/comments（body: `{ "content": "..." }`） |
| 删除评论 | ✅ | DELETE /api/comments/{id} |
| 任务附件上传 | ✅ | POST /api/tasks/{taskId}/attachments（FormData 字段 `file`） |
| 任务附件列表 | ✅ | GET /api/tasks/{taskId}/attachments |
| 删除附件 | ✅ | DELETE /api/attachments/{id} |
| 附件下载 | ✅ | GET /api/attachments/files/{filename} |

**任务字段**：id、title、description、projectId、projectName、projectColor、status、priority、startTime、dueTime、remindAt、repeatRule、estimateMinutes、actualMinutes、sortOrder、completedAt、archivedAt 等。

**任务状态 status（0-based）**：0=待办、1=进行中、2=完成、3=搁置。

**归档规则**：任务完成（status=2）时写入 completedAt；定时任务每小时将「已完成且 completedAt 超过 24 小时」的任务设置 archivedAt；列表与看板自动排除已归档任务。

---

## 2.3 多视图系统

| 视图 | 状态 | 说明 |
|------|------|------|
| 列表视图 | ✅ | GET /api/tasks 支持筛选 |
| 看板视图 | ✅ | GET /api/tasks/board 或 GET /api/tasks 前端分组 |
| 日历视图 | ✅ | GET /api/tasks 传 startTimeFrom/To、dueTimeFrom/To 做时间范围 |
| 甘特图 | ✅ | 同上，按时间轴渲染 |

---

## 2.4 项目系统

| 功能 | 状态 | 接口 / 说明 |
|------|------|-------------|
| 创建项目 | ✅ | POST /api/projects |
| 项目列表 | ✅ | GET /api/projects |
| 项目详情 | ✅ | GET /api/projects/{id} |
| 更新项目 | ✅ | PATCH /api/projects/{id}（name、description、cover/color） |
| 删除项目 | ✅ | DELETE /api/projects/{id} |
| 项目任务统计 | ✅ | GET /api/projects/{id}/task-stats（todo/doing/done/onHold/total） |

**项目颜色**：ProjectVO 的 cover 与 color 同值，前端可用 `data.color ?? data.cover` 渲染色条。

---

## 2.5 标签系统

| 功能 | 状态 | 接口 / 说明 |
|------|------|-------------|
| 标签列表 | ✅ | GET /api/tags |
| 创建标签 | ✅ | POST /api/tags |
| 删除标签 | ✅ | DELETE /api/tags/{id} |
| 任务绑定标签 | ✅ | PATCH /api/tasks/{id} 传 tagIds |

---

## 2.6 通知系统

| 功能 | 状态 | 接口 / 说明 |
|------|------|-------------|
| 通知列表 | ✅ | GET /api/notifications |
| 标记已读 | ✅ | PATCH /api/notifications/{id}/read |

---

## 2.7 统计与复盘

| 功能 | 状态 | 接口 / 说明 |
|------|------|-------------|
| 今日完成 + 7 天趋势 | ✅ | GET /api/statistics |

---

## 2.8 AI 能力（预留）

| 功能 | 状态 | 接口 / 说明 |
|------|------|-------------|
| 自然语言解析任务 | ⚠️ | POST /api/ai/parse-task 接口预留 |

---

# 三、API 速查表

## 3.1 鉴权

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register | 注册 |
| POST | /api/auth/login | 登录 |
| GET | /api/health | 健康检查（免鉴权） |

## 3.2 用户

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/users/me | 当前用户 |
| PATCH | /api/users/me | 更新个人资料 |
| PATCH | /api/users/me/password | 修改密码（Body：oldPassword、newPassword；新密码至少 6 位；须提供原密码，否则 400；成功返回最新用户信息） |
| POST | /api/users/me/avatar | 上传头像（FormData file） |

## 3.3 任务

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/tasks | 任务列表（可选 projectId、status、archived、时间范围） |
| GET | /api/tasks/archived | 已归档任务 |
| POST | /api/tasks/{id}/restore | 恢复归档 |
| GET | /api/tasks/board | 看板数据 |
| GET | /api/tasks/{id} | 任务详情 |
| POST | /api/tasks | 创建任务 |
| PATCH | /api/tasks/{id} | 更新任务 |
| DELETE | /api/tasks/{id} | 删除任务 |
| GET | /api/tasks/{taskId}/comments | 评论列表 |
| POST | /api/tasks/{taskId}/comments | 发表评论 |
| DELETE | /api/comments/{id} | 删除评论 |
| POST | /api/tasks/{taskId}/attachments | 上传附件 |
| GET | /api/tasks/{taskId}/attachments | 附件列表 |
| DELETE | /api/attachments/{id} | 删除附件 |
| GET | /api/attachments/files/{filename} | 下载附件 |

## 3.4 项目

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/projects | 项目列表 |
| GET | /api/projects/{id} | 项目详情 |
| GET | /api/projects/{id}/task-stats | 项目任务统计 |
| POST | /api/projects | 创建项目 |
| PATCH | /api/projects/{id} | 更新项目 |
| DELETE | /api/projects/{id} | 删除项目 |

## 3.5 标签

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/tags | 标签列表 |
| POST | /api/tags | 创建标签 |
| DELETE | /api/tags/{id} | 删除标签 |

## 3.6 通知与统计

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/notifications | 通知列表 |
| PATCH | /api/notifications/{id}/read | 标记已读 |
| GET | /api/statistics | 今日完成 + 7 天趋势 |

---

# 四、统一响应格式

```json
{
  "code": 0,
  "message": "success",
  "data": <业务数据>
}
```

- `code: 0` 表示成功；非 0 表示业务错误（如 400、401、404、500）。
- 业务数据在 `data` 中；看板为 `data` 内 `{ todo, doing, done, onHold }` 或任务数组。

---

# 五、数据库表结构（概要）

| 表名 | 说明 |
|------|------|
| user | 用户（含 username、phone、avatar） |
| project | 项目 |
| task | 任务（含 completed_at、archived_at） |
| subtask | 子任务（checklist） |
| tag | 标签 |
| task_tag | 任务-标签多对多 |
| task_comment | 任务评论 |
| task_attachment | 任务附件 |
| notification | 通知 |
| task_statistics_daily | 每日统计 |

---

# 六、前端对接要点

## 6.1 鉴权

请求头：`Authorization: Bearer <token>`

## 6.2 baseURL

- 本机：`http://localhost:8080`
- 局域网：`http://<后端IP>:8080`（如 `http://192.168.1.220:8080`）

## 6.3 头像展示

后端返回的 `avatar` 为相对路径（如 `/api/attachments/files/xxx.jpg`），前端需拼接 API 根地址：

```ts
const avatarUrl = user?.avatar
  ? (user.avatar.startsWith('http') ? user.avatar : apiOrigin + user.avatar)
  : ''
```

## 6.4 附件 / 头像上传

FormData 字段名必须为 **`file`**。

## 6.5 任务状态

status 为 0–3 整数，与看板列对应：0=待办、1=进行中、2=完成、3=搁置。

## 6.6 项目颜色

`data.color ?? data.cover` 用于色条与主题色。

---

# 七、未实现 / 待扩展功能

| 模块 | 未实现项 |
|------|----------|
| 用户 | 手机号登录、OAuth、多设备登录、2FA |
| 任务 | 番茄钟、任务模板、富文本/Markdown、操作日志 |
| 视图 | 自定义筛选视图、保存视图配置 |
| 项目 | 项目里程碑、项目归档、年度目标 |
| 提醒 | 邮件通知、Push、定时触发提醒 |
| 标签 | 上下级标签 |
| 搜索 | 最近搜索记录 |
| 统计 | 周报、月报、热力图、AI 总结 |
| 自动化 | IF-THEN 规则、自动提醒 |

---

# 八、API 文档

启动应用后访问：**http://localhost:8080/swagger-ui.html**

---

*本文档基于当前后端实现整理，供产品、前端、测试参考。*
