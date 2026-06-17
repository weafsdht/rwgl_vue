# TaskFlow - 企业级任务管理系统

基于 Vue 3 + TypeScript + Pinia + Naive UI 构建的现代化任务管理前端应用。

## 技术栈

- **框架**: Vue 3 (Composition API)
- **构建工具**: Vite
- **语言**: TypeScript
- **状态管理**: Pinia (Hooks 风格)
- **UI 组件库**: Naive UI
- **路由**: Vue Router
- **图表**: ECharts
- **拖拽**: SortableJS
- **HTTP 客户端**: Axios
- **日期处理**: Day.js

## 功能特性

### 核心功能

- ✅ **用户系统**: 登录、注册、用户信息管理
- ✅ **任务系统**: 
  - CRUD 操作
  - 多层级子任务（支持 Checklist 模式）
  - 优先级管理（高/中/低）
  - 状态管理（待办/进行中/已完成/搁置）
  - 时间管理（预估时长、实际耗时、开始时间、截止时间）
  - 逾期提醒和标识
- ✅ **多视图系统**:
  - 看板视图（拖拽式任务管理）
  - 列表视图
  - 日历视图（规划中）
  - 甘特图（规划中）
- ✅ **项目系统**: 项目管理 + 进度统计
- ✅ **标签系统**: 多对多标签绑定
- ✅ **通知系统**: 截止提醒、任务分配通知
- ✅ **统计系统**: 每日完成数、趋势图表、完成率分析
- ✅ **搜索系统**: 全局搜索、模糊搜索、实时搜索建议
- ✅ **深色模式**: 支持主题切换

### 扩展功能

- 🤖 **AI 任务解析**: 通过自然语言自动解析任务信息
- 📎 **附件管理**: 新建/编辑任务中上传附件；后端需将文件存入**华为云 OBS 对象存储**，接口见 `api/attachment.ts`。下载与预览统一走 **`GET /api/attachments/{id}/download`**（带鉴权），前端仅在校验 `response.ok` 后将响应当文件处理；云上部署说明见 [DEPLOY.md](DEPLOY.md)。
- 📦 **任务归档**: 侧栏「归档」页可查看已归档任务并恢复；**任务完成 24 小时后由后端自动归档**（后端需在状态变为完成时写入 `completedAt`，并定时或按需将「完成且 completedAt 超过 24 小时」的任务设置 `archivedAt`；列表/看板接口需排除 `archivedAt` 有值的任务）
- 💬 **评论系统**: 任务评论功能（API 已实现）
- ⏰ **时间追踪**: 预估时长和实际耗时记录
- 📊 **子任务进度**: 自动计算子任务完成进度

## 文档

- **[PRD 产品需求文档](docs/PRD.md)**：完整 API 速查、已实现功能清单、前端对接要点

## 项目结构

```
src/
├── api/              # API 接口封装
│   ├── task.ts      # 任务相关接口
│   ├── user.ts      # 用户相关接口
│   ├── project.ts   # 项目相关接口
│   ├── tag.ts       # 标签相关接口
│   ├── notification.ts  # 通知相关接口
│   ├── statistics.ts    # 统计相关接口
│   └── ai.ts        # AI 接口
├── components/       # 组件
│   ├── TaskCard.vue      # 任务卡片
│   ├── TaskBoard.vue     # 看板视图
│   ├── BoardColumn.vue   # 看板列
│   ├── TaskEditor.vue    # 任务编辑器
│   └── NotificationList.vue  # 通知列表
├── composables/     # Composables (Hooks)
│   ├── useTasks.ts
│   ├── useProjects.ts
│   └── useNotifications.ts
├── constants/       # 常量定义
│   └── colors.ts    # 颜色体系
├── layouts/         # 布局组件
│   └── MainLayout.vue
├── router/          # 路由配置
│   └── index.ts
├── stores/          # Pinia Stores
│   ├── user.ts
│   ├── task.ts
│   ├── project.ts
│   ├── tag.ts
│   └── notification.ts
├── styles/          # 样式文件
│   ├── variables.css    # CSS 变量
│   └── global.css       # 全局样式
├── types/           # TypeScript 类型定义
│   └── index.ts
├── utils/           # 工具函数
│   ├── request.ts   # Axios 封装
│   └── date.ts      # 日期工具
├── views/           # 页面组件
│   ├── Login.vue
│   ├── Register.vue
│   ├── Dashboard.vue
│   ├── Board.vue
│   ├── Tasks.vue
│   ├── Projects.vue
│   ├── Statistics.vue
│   └── Settings.vue
├── App.vue          # 根组件
└── main.ts          # 入口文件
```

## 设计规范

### 颜色体系

- **状态颜色**:
  - 待办/进行中: `#1890FF` (蓝色)
  - 已完成: `#52C41A` (绿色)
  - 搁置: `#BFBFBF` (灰色)
  - 逾期: `#FF4D4F` (红色)

- **优先级颜色**:
  - 高: `#FF4D4F` (红色)
  - 中: `#FA8C16` (橙色)
  - 低: `#1890FF` (蓝色)

### 字体与字号

- 基础字号: `14px`
- 小字号: `12px`
- 标题字号: `16px`
- 仪表盘字号: `30px`
- H1 字号: `24px`

## 开发指南

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

应用将在 `http://localhost:3000` 启动。

### 前端 API 配置（跨设备访问后端）

当后端跑在 `192.168.1.220:8080`、前端在别的设备或浏览器访问时：

1. **通过 Vite 代理（开发时）**  
   在 `vite.config.ts` 里已把 `/api` 的 proxy target 设为 `http://192.168.1.220:8080`，本机访问 `http://localhost:3000` 时请求会转发到该后端。

2. **直连后端（打包后或别机访问开发机时）**  
   在项目根目录新建 `.env`（可复制 `.env.example`），设置（需带 `/api`）：
   ```bash
   VITE_API_BASE_URL=http://192.168.1.220:8080/api
   ```
   这样 `src/utils/request.ts` 中的 axios baseURL 会使用该地址。配置后请先访问 `http://192.168.1.220:8080/api/health` 确认能通，再试登录和看板。

### 构建生产版本

```bash
npm run build
```

### 代码检查

```bash
npm run lint
```

## API 接口

### 后端要求

后端 API 应遵循以下规范：

- **基础路径**: `/api`
- **认证方式**: JWT Token (Bearer Token)
- **响应格式**:
  ```json
  {
    "code": 0,
    "message": "success",
    "data": {}
  }
  ```

### 鉴权与角色

- **项目管理、统计模块、任务关联项目**仅**系统管理员（role=0）或项目经理（role=1）**可操作。
- **普通用户（role=2）**可查看被共享的项目及项目下任务统计（GET 项目列表、项目详情、项目任务统计），但**不能**：创建/更新/删除项目，管理共享与编辑权限申请，查看项目进度/统计/里程碑，调用任何统计接口；**不能**在创建或更新任务时设置或修改「所属项目」。
- 普通用户仍可创建、编辑、删除**不关联项目**的个人任务。后端对越权操作返回 **403**，文案如：「仅项目经理或系统管理员可执行此操作」「仅项目经理或系统管理员可将任务关联到项目」等。

### 核心接口

#### 用户接口

- `GET /api/users/me` - 获取当前用户信息
- `PATCH /api/users/me` - 更新个人资料
- `PATCH /api/users/me/password` - 修改当前用户密码（Body: `{ "oldPassword": "原密码", "newPassword": "新密码" }`，新密码至少 6 位；原密码错误返回 400「原密码错误」；成功返回 200 及最新用户信息）

#### 任务接口

- `GET /api/tasks` - 获取任务列表
- `POST /api/tasks` - 创建任务
- `PATCH /api/tasks/{id}` - 更新任务
- `DELETE /api/tasks/{id}` - 删除任务
- `GET /api/tasks/board` - 获取看板数据

#### 项目接口

- `GET /api/projects` - 获取项目列表
- `PATCH /api/projects/{id}` - 更新项目（请求体：name/description/cover 或 color，仅项目创建人可更新）
- `GET /api/projects/{id}/task-stats` - 获取项目任务统计（TaskStatsVO: todo/doing/done/onHold/total），鉴权与项目详情一致，无权限返回 404

#### 标签接口

- `GET /api/tags` - 获取标签列表
- `POST /api/tags` - 创建标签（Body: `{ "name": "标签名", "color": "#hex" }`，color 可选）
- `PATCH /api/tags/{id}` - 更新标签（Body: name / color 可选）
- `DELETE /api/tags/{id}` - 删除标签

#### 统计接口

- `GET /api/statistics/completion-rate` - 完成率（query: scope, projectId, timeDimension, startDate, endDate）
- `GET /api/statistics/average-completion-time` - 平均完成时长
- `GET /api/statistics/overdue-rate` - 超期率
- `GET /api/statistics/work-saturation` - 工作饱和度（query: startDate, endDate, allMembers）
- `GET /api/statistics/dashboard` - 仪表盘汇总（个人维度 + hasAnyWarning 等）

#### AI 接口

- `POST /api/ai/parse-task` - AI 解析任务文本

## 响应式设计

- **桌面端**: 完整布局，侧边栏展开
- **移动端**: 侧边栏自动折叠，卡片纵向堆叠

## 最佳实践

1. **Composables 抽离逻辑**: 使用 `useTasks()`, `useProjects()`, `useSubTasks()`, `useSearch()` 等
2. **统一响应封装**: 所有 API 响应统一处理，自动错误提示
3. **错误处理**: 
   - 全局 axios 拦截器 + UI 提示
   - 防抖机制防止重复错误提示
   - 友好的错误消息展示
4. **类型安全**: 严格的 TypeScript 类型检查
5. **状态管理**: Pinia Hooks 风格，逻辑与视图解耦
6. **响应式设计**: 支持桌面端和移动端
7. **主题系统**: 支持深色模式切换

## 错误处理

系统已实现完善的错误处理机制：

- ✅ 全局错误拦截器自动捕获 API 错误
- ✅ 根据 HTTP 状态码显示友好错误消息
- ✅ 防抖机制防止重复错误提示
- ✅ 401 错误自动跳转登录页
- ✅ 500 错误显示友好的服务器错误提示

## 新增功能说明

### 子任务系统
- 支持多层级子任务管理
- Checklist 模式，可勾选完成
- 自动计算完成进度
- 子任务排序和拖拽（规划中）

### 时间管理
- 预估时长设置
- 实际耗时记录
- 开始时间和截止时间管理
- 时间统计和分析

### 搜索功能
- 全局搜索（任务、项目）
- 实时搜索建议
- 防抖优化
- 快速跳转到搜索结果

### 深色模式
- 一键切换主题
- 主题偏好本地存储
- 自动应用主题样式

## 许可证

MIT
