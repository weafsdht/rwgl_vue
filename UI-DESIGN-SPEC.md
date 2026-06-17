# TaskFlow UI Design 设计规范文档

> 完整的功能界面 UI 设计参数与实现规范  
> 版本：1.0 | 更新日期：2025-02-18

---

## 一、项目概述

**TaskFlow** 是企业级任务管理应用，采用深色主题、卡片化布局，以亮绿色为主强调色，营造现代科技感界面。

### 1.1 技术栈
- **框架**: React + Vite
- **路由**: React Router v7
- **样式**: Tailwind CSS v4 + CSS 变量
- **拖拽**: react-dnd
- **图表**: Recharts
- **图标**: Lucide React

### 1.2 路由结构
| 路径 | 页面 | 功能 |
|------|------|------|
| `/auth` | Auth | 登录/注册 |
| `/` | Dashboard | 数据概览 |
| `/kanban` | Kanban | 看板视图 |
| `/list` | ListView | 任务列表 |
| `/calendar` | CalendarView | 日历视图 |

---

## 二、设计令牌 (Design Tokens)

### 2.1 色彩系统

#### 浅色模式 (:root)
| 变量名 | 值 | 用途 |
|--------|-----|------|
| `--background` | `#ffffff` | 页面背景 |
| `--foreground` | `oklch(0.145 0 0)` | 主文本 |
| `--card` | `#ffffff` | 卡片背景 |
| `--primary` | `#030213` | 主色 |
| `--secondary` | `oklch(0.95 0.0058 264.53)` | 次级背景 |
| `--muted` | `#ececf0` | 弱化背景 |
| `--muted-foreground` | `#717182` | 辅助文本 |
| `--destructive` | `#d4183d` | 危险/错误 |
| `--border` | `rgba(0,0,0,0.1)` | 边框 |

#### 深色模式 (.dark) - 默认主题
| 变量名 | 值 | 用途 |
|--------|-----|------|
| `--background` | `#1a1a1e` | 页面背景 |
| `--foreground` | `oklch(0.95 0.01 260)` | 主文本 |
| `--card` | `#24242a` | 卡片背景 |
| `--primary` | `#22c55e` | 主色（亮绿） |
| `--primary-foreground` | `#0a0a0c` | 主色上的文字 |
| `--secondary` | `oklch(0.32 0.02 260)` | 次级背景 |
| `--muted` | `oklch(0.32 0.02 260)` | 弱化背景 |
| `--muted-foreground` | `oklch(0.65 0.02 260)` | 辅助文本 |
| `--destructive` | `oklch(0.55 0.2 25)` | 危险/错误 |
| `--border` | `oklch(0.32 0.02 260)` | 边框 |

#### 图表色板 (Chart Colors)
| 变量 | 色值 | 用途 |
|------|------|------|
| `--chart-1` | `#22c55e` | 图表主色 |
| `--chart-2` | `#eab308` | 图表辅色1 |
| `--chart-3` | `oklch(0.65 0.2 290)` | 紫色 |
| `--chart-4` | `oklch(0.7 0.15 200)` | 青色 |
| `--chart-5` | `oklch(0.7 0.15 25)` | 橙色 |

#### 侧边栏专用色
| 变量 | 深色值 |
|------|--------|
| `--sidebar` | `#1a1a1e` |
| `--sidebar-foreground` | `oklch(0.9 0.01 260)` |
| `--sidebar-primary` | `#22c55e` |
| `--sidebar-accent` | `oklch(0.28 0.02 260)` |
| `--sidebar-border` | `oklch(0.28 0.02 260)` |

### 2.2 圆角系统
| 变量 | 值 | 换算 |
|------|-----|------|
| `--radius` | `0.875rem` (14px) | 深色模式 |
| `--radius-sm` | `calc(var(--radius) - 4px)` | 10px |
| `--radius-md` | `calc(var(--radius) - 2px)` | 12px |
| `--radius-lg` | `var(--radius)` | 14px |
| `--radius-xl` | `calc(var(--radius) + 4px)` | 18px |

### 2.3 字体
| 变量 | 值 |
|------|-----|
| `--font-size` | `16px` |
| `--font-weight-medium` | `500` |
| `--font-weight-normal` | `400` |

### 2.4 排版层级
| 元素 | 字号 | 字重 | 行高 |
|------|------|------|------|
| h1 | `var(--text-2xl)` | 500 | 1.5 |
| h2 | `var(--text-xl)` | 500 | 1.5 |
| h3 | `var(--text-lg)` | 500 | 1.5 |
| h4 | `var(--text-base)` | 500 | 1.5 |
| label/button | `var(--text-base)` | 500 | 1.5 |
| input | `var(--text-base)` | 400 | 1.5 |

---

## 三、布局规范

### 3.1 整体布局
- **结构**: 左侧窄边栏 + 主内容区
- **主内容区**: `container mx-auto`，`max-w-7xl` (1280px)
- **内边距**: `p-4 md:p-8` (移动端 16px，桌面 32px)

### 3.2 侧边栏 (DashboardLayout - Sidebar)
| 参数 | 值 | 说明 |
|------|-----|------|
| 宽度 (md) | `72px` | 窄版，仅图标 |
| 宽度 (lg) | `224px` (w-56) | 宽版，图标+文字 |
| 背景 | `bg-sidebar` | `#1a1a1e` |
| 边框 | `border-r border-sidebar-border` | 右侧边框 |
| Logo 区域 | `p-4` | 上下左右 16px |
| Logo 图标 | `w-8 h-8` | 32×32px |
| 导航项 | `px-3 py-2.5` | 内边距 |
| 导航间距 | `space-y-1` | 4px |
| 激活态 | `bg-primary/20 text-primary` | 20% 透明主色背景 |
| 用户头像 | `w-9 h-9 rounded-full` | 36×36px 圆形 |

### 3.3 顶部搜索栏 (Header)
| 参数 | 值 |
|------|-----|
| 定位 | `sticky top-0 z-10` |
| 背景 | `bg-background/80 backdrop-blur-sm` |
| 内边距 | `px-6 py-4` |
| 搜索框宽度 | `max-w-2xl` |
| 搜索框内边距 | `pl-10 pr-4 py-2` |
| 搜索框圆角 | `rounded-xl` |
| 搜索图标 | `w-4 h-4`，左侧 `left-3` |

---

## 四、页面级 UI 规范

### 4.1 Dashboard（数据概览）

#### 页面标题
- 字号: `text-2xl`
- 字重: `font-bold`
- 颜色: `text-foreground`

#### 统计卡片 (Stats Cards)
| 参数 | 值 |
|------|-----|
| 布局 | `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4` |
| 背景 | `bg-card` |
| 内边距 | `p-6` |
| 圆角 | `rounded-2xl` |
| 阴影 | `shadow-lg shadow-black/5` |
| 边框 | `border border-border` |
| 标签 | `text-xs font-medium uppercase tracking-wide text-muted-foreground` |
| 数值 | `text-3xl font-bold mt-2` |

####  Completed 卡片进度条
| 参数 | 值 |
|------|-----|
| 容器 | `h-1.5 bg-secondary rounded-full overflow-hidden` |
| 进度条 | `h-full bg-primary rounded-full` |
| 宽度 | 动态 `width: ${progressPercent}%` |

#### 图表容器
| 参数 | 值 |
|------|-----|
| 高度 | `h-96` (384px) |
| 内边距 | `p-6` |
| 标题 | `font-semibold mb-4 text-foreground` |

#### 饼图 (PieChart)
| 参数 | 值 |
|------|-----|
| 内半径 | `60` |
| 外半径 | `80` |
| 扇形间距 | `paddingAngle={5}` |
| 色板 | `#22c55e, #eab308, #a855f7, #06b6d4, #f97316` |

#### 柱状图 (BarChart)
| 参数 | 值 |
|------|-----|
| 柱圆角 | `radius={[8, 8, 0, 0]}` |
| 柱颜色 | `#22c55e` |
| 坐标轴 | `stroke="rgba(255,255,255,0.5)"` |

#### Tooltip 样式
```css
backgroundColor: '#24242a'
border: '1px solid rgba(255,255,255,0.1)'
borderRadius: '12px'
color: '#fff'
```

---

### 4.2 Kanban（看板）

#### 列容器 (KanbanColumn)
| 参数 | 值 |
|------|-----|
| 最小宽度 | `min-w-[300px]` |
| 圆角 | `rounded-2xl` |
| 默认背景 | `bg-card/50 border-border` |
| 拖拽悬停 | `bg-primary/5 border-primary/30` |
| 列头内边距 | `p-4` |

#### 列头
| 元素 | 样式 |
|------|------|
| 状态点 | `w-3 h-3 rounded-full` |
| 状态点-待办 | `bg-muted-foreground` |
| 状态点-进行中 | `bg-[#eab308]` |
| 状态点-完成 | `bg-primary` |
| 计数徽章 | `px-2.5 py-0.5 rounded-lg text-xs font-medium bg-secondary text-muted-foreground` |
| 添加按钮 | `p-1.5 hover:bg-secondary rounded-xl` |

#### 任务卡片 (TaskCard)
| 参数 | 值 |
|------|-----|
| 背景 | `bg-card` |
| 内边距 | `p-4` |
| 圆角 | `rounded-2xl` |
| 阴影 | `shadow-lg shadow-black/5` |
| 边框 | `border border-border` |
| 间距 | `mb-3` |
| 悬停 | `hover:shadow-xl hover:border-primary/20` |
| 拖拽透明度 | `opacity: 0.4` |

#### 优先级标签
| 优先级 | 背景 | 文字 |
|--------|------|------|
| high | `bg-destructive/20` | `text-destructive` |
| medium | `bg-[#eab308]/20` | `text-[#eab308]` |
| low | `bg-primary/20` | `text-primary` |
| 基础 | `text-xs font-semibold px-2 py-1 rounded-lg uppercase tracking-wide` |

#### 空状态
- 边框: `border-2 border-dashed border-border`
- 圆角: `rounded-2xl`
- 内边距: `p-8`
- 文本: `text-sm text-muted-foreground`

#### 浮动操作按钮 (FAB)
| 参数 | 值 |
|------|-----|
| 定位 | `fixed bottom-8 right-8` |
| 尺寸 | `w-14 h-14` (56×56px) |
| 背景 | `bg-[#eab308]` |
| 文字 | `text-black` |
| 圆角 | `rounded-full` |
| 阴影 | `shadow-xl shadow-[#eab308]/30` |
| 悬停 | `hover:scale-105` |
| z-index | `z-50` |

---

### 4.3 ListView（任务列表）

#### 容器
| 参数 | 值 |
|------|-----|
| 背景 | `bg-card` |
| 圆角 | `rounded-2xl` |
| 阴影 | `shadow-lg shadow-black/5` |
| 边框 | `border border-border` |

#### 工具栏
| 参数 | 值 |
|------|-----|
| 内边距 | `p-4` |
| 边框 | `border-b border-border` |
| 标题 | `text-lg font-semibold text-foreground` |

#### 搜索框
| 参数 | 值 |
|------|-----|
| 内边距 | `pl-9 pr-4 py-2` |
| 圆角 | `rounded-xl` |
| 字号 | `text-sm` |

#### 表格
| 元素 | 样式 |
|------|------|
| 表头背景 | `bg-secondary/30` |
| 表头文字 | `text-muted-foreground font-medium` |
| 单元格 | `px-6 py-4` |
| 行悬停 | `hover:bg-secondary/20` |

#### 状态标签
| 状态 | 样式 |
|------|------|
| done | `bg-primary/20 text-primary` |
| in-progress | `bg-[#eab308]/20 text-[#eab308]` |
| todo | `bg-secondary text-muted-foreground` |
| 基础 | `px-2.5 py-1 rounded-lg text-xs font-medium capitalize` |

#### 优先级文字
| 优先级 | 样式 |
|--------|------|
| high | `text-destructive font-medium` |
| medium | `text-[#eab308] font-medium` |
| low | `text-muted-foreground` |

#### 头像
- 尺寸: `w-6 h-6`
- 背景: `bg-primary/20 text-primary`
- 字号: `text-[10px] font-bold`

---

### 4.4 CalendarView（日历）

#### 容器
| 参数 | 值 |
|------|-----|
| 高度 | `h-[calc(100vh-140px)]` |
| 圆角 | `rounded-2xl` |
| 阴影 | `shadow-lg shadow-black/5` |

#### 月导航栏
| 参数 | 值 |
|------|-----|
| 内边距 | `p-4` |
| 月份 | `text-primary` |
| 年份 | `text-muted-foreground font-light` |
| 切换按钮 | `p-2 hover:bg-secondary rounded-xl` |

#### 星期表头
| 参数 | 值 |
|------|-----|
| 背景 | `bg-secondary/20` |
| 文字 | `text-xs font-semibold text-muted-foreground uppercase tracking-wide` |
| 内边距 | `py-3` |

#### 日期格
| 参数 | 值 |
|------|-----|
| 最小高度 | `min-h-[100px]` |
| 内边距 | `p-2` |
| 非当月 | `bg-secondary/5 text-muted-foreground/60` |

#### 日期数字
| 状态 | 样式 |
|------|------|
| 今天 | `bg-primary text-primary-foreground shadow-lg` |
| 其他 | `text-foreground group-hover:bg-secondary` |
| 尺寸 | `w-7 h-7 rounded-full text-sm font-medium` |

#### 任务块
| 参数 | 值 |
|------|-----|
| 字号 | `text-[10px]` |
| 内边距 | `px-2 py-1` |
| 圆角 | `rounded-lg` |
| 完成 | `bg-primary/20 border-primary/30 text-primary line-through` |
| 高优 | `bg-destructive/20 border-destructive/30 text-destructive` |
| 默认 | `bg-[#eab308]/20 border-[#eab308]/30 text-[#eab308]` |

---

### 4.5 Auth（登录/注册）

#### 容器
| 参数 | 值 |
|------|-----|
| 最小高度 | `min-h-screen` |
| 背景 | `bg-background` |
| 内边距 | `p-4` |

#### 卡片
| 参数 | 值 |
|------|-----|
| 背景 | `bg-card` |
| 内边距 | `p-8` |
| 圆角 | `rounded-2xl` |
| 阴影 | `shadow-2xl shadow-black/20` |
| 最大宽度 | `max-w-md` |

#### 标题
- 主标题: `text-3xl font-bold tracking-tight mb-2`
- 副标题: `text-muted-foreground`

#### 切换按钮组
| 参数 | 值 |
|------|-----|
| 容器 | `bg-secondary p-1 rounded-xl mb-6` |
| 按钮 | `flex-1 py-2 text-sm font-medium rounded-lg` |
| 选中 | `bg-background shadow-sm text-foreground` |
| 未选中 | `text-muted-foreground hover:text-foreground` |

#### 输入框
| 参数 | 值 |
|------|-----|
| 内边距 | `px-4 py-2.5` |
| 圆角 | `rounded-xl` |
| 边框 | `border border-border` |
| 背景 | `bg-background` |
| 焦点 | `focus:ring-2 focus:ring-primary/30 focus:border-primary/50` |

#### 主按钮
| 参数 | 值 |
|------|-----|
| 背景 | `bg-primary hover:bg-primary/90` |
| 文字 | `text-primary-foreground font-semibold` |
| 内边距 | `py-2.5` |
| 圆角 | `rounded-xl` |

#### Demo 按钮
- 背景: `bg-foreground text-background`
- 悬停: `hover:opacity-90`

---

## 五、通用组件规范

### 5.1 按钮
| 类型 | 样式 |
|------|------|
| 主按钮 | `bg-primary text-primary-foreground` |
| 次级 | `bg-secondary text-secondary-foreground` |
| 危险 | `text-destructive hover:bg-destructive/10` |
| 图标按钮 | `p-2 rounded-xl hover:bg-secondary` |

### 5.2 输入框
- 统一圆角: `rounded-xl`
- 焦点环: `focus:ring-2 focus:ring-primary/30 focus:border-primary/50`
- 占位符: `placeholder:text-muted-foreground`

### 5.3 徽章/标签
- 小标签: `px-2 py-0.5 rounded-lg text-xs font-medium`
- 状态色: 见各页面状态映射表

### 5.4 加载态
- 图标: `Loader2` + `animate-spin`
- 颜色: `text-primary`

---

## 六、数据模型

### Task 接口
```typescript
interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  assignee?: string;
  dueDate?: string;
  subtasks?: Subtask[];
  tags?: string[];
}
```

### Status 类型
- `todo` - 待办
- `in-progress` - 进行中
- `done` - 已完成

### Priority 类型
- `low` - 低
- `medium` - 中
- `high` - 高

---

## 七、响应式断点

| 断点 | 宽度 | 用途 |
|------|------|------|
| 默认 | < 768px | 移动端 |
| md | ≥ 768px | 平板，显示侧边栏 |
| lg | ≥ 1024px | 桌面，侧边栏显示文字 |

---

## 八、动效与过渡

| 场景 | 类名 |
|------|------|
| 主题切换 | `transition-colors duration-300` |
| 按钮/链接 | `transition-colors` / `transition-all` |
| 卡片悬停 | `hover:shadow-xl hover:border-primary/20 transition-all` |
| FAB | `hover:scale-105 transition-all` |
| 拖拽 | `opacity: 0.4` (dragging) |

---

## 九、文件结构

```
src/
├── app/
│   ├── App.tsx              # 路由与布局入口
│   ├── components/
│   │   └── DashboardLayout.tsx  # 主布局（侧边栏+头部+内容区）
│   ├── context/
│   │   └── AuthContext.tsx
│   └── pages/
│       ├── Auth.tsx
│       ├── Dashboard.tsx
│       ├── Kanban.tsx
│       ├── ListView.tsx
│       └── CalendarView.tsx
├── styles/
│   ├── index.css            # 入口
│   ├── theme.css            # 设计令牌
│   ├── tailwind.css
│   └── fonts.css
└── lib/
    ├── utils.ts             # cn(), Task 类型
    └── useTasks.ts          # 任务数据 Hook
```

---

*文档由 TaskFlow 项目自动整理生成*
