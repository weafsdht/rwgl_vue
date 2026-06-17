/**
 * API 统一响应格式
 */
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

/**
 * 用户信息
 */
export interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  nickname?: string;
  /** 手机号 */
  phone?: string;
  /** 性别：male/female/unknown 或空 */
  gender?: 'male' | 'female' | 'unknown' | '';
  /** 个性签名（展示于个人信息等） */
  signature?: string;
  timezone?: string;
  createdAt: string;
  /** 角色码：0=系统管理员，1=项目经理，2=普通用户（GET /api/users/me、登录/注册返回） */
  role?: number;
  /** 角色名称，用于展示 */
  roleLabel?: string;
}

/** 管理员-用户列表项（GET /api/admin/users） */
export interface AdminUserVO {
  id: number;
  uid?: number;
  email: string;
  username: string;
  nickname?: string;
  /** 头像路径或 URL（与 Task/用户 VO 一致） */
  avatar?: string;
  /** 后端可能仅返回驼峰/蛇形之一，由 normalizeAdminUserVo 合并到 avatar */
  avatarUrl?: string;
  avatar_url?: string;
  /** 与 User 一致：male / female / unknown / 空 */
  gender?: User['gender'];
  role: number;
  roleLabel: string;
}

/** 团队成员/邀请：用于邀请好友页 */
export interface MemberInvite {
  id: number;
  email: string;
  /** 显示名（当前用户可为「我」） */
  displayName?: string;
  avatar?: string;
  /** active=已加入, pending=待接受邀请 */
  status: 'active' | 'pending';
  /** 角色 */
  role: 'admin' | 'user';
  /** 邀请链接（仅 pending 时有） */
  inviteLink?: string;
  /** 调度/主页链接（参考图） */
  schedulingPage?: string;
}

/**
 * 任务
 */
export interface Task {
  id: number;
  title: string;
  description?: string;
  status: 'todo' | 'doing' | 'done' | 'stalled';
  /** 1-5 星优先级，兼容旧接口的 high/medium/low */
  priority: 'high' | 'medium' | 'low' | number;
  dueTime?: string;
  startTime?: string;
  projectId?: number;
  /** 接口返回的所属项目名称，列表/看板展示用 */
  projectName?: string;
  /** 接口返回的项目颜色（与 cover 同值），用于色条/标签 */
  projectColor?: string;
  parentId?: number;
  assigneeId?: number;
  assignee?: User;
  /** 多负责人时的 id 列表（后端可选支持） */
  assigneeIds?: number[];
  /** 多负责人时的用户信息（接口返回） */
  assignees?: User[];
  tags?: Tag[];
  /** 接口可能只返回 tagIds，前端用其解析为 tags 展示 */
  tagIds?: number[];
  subtasks?: SubTask[];
  // 时间管理
  estimateMinutes?: number; // 预估时长（分钟）
  actualMinutes?: number; // 实际耗时（分钟）
  // 重复任务
  repeatRule?: RepeatRule;
  /** 提醒时间（ISO 或 YYYY-MM-DD HH:mm:ss） */
  remindAt?: string;
  // 内容扩展
  content?: string; // 富文本内容
  attachments?: Attachment[];
  comments?: Comment[];
  // 元数据
  createdAt: string;
  updatedAt: string;
  /** 创建人用户 id（接口可能为 createdById / created_by） */
  createdById?: number;
  creator?: User;
  /** 最近一次指派操作人（若有审计字段） */
  assignedById?: number;
  assignedBy?: User;
  isOverdue?: boolean;
  sortOrder?: number; // 排序顺序
  /** 任务完成时间（状态变为 done 时由后端设置）；用于 24 小时后自动归档 */
  completedAt?: string;
  /** 归档时间；有值表示已归档，看板/列表不展示，仅在归档页显示 */
  archivedAt?: string;
  /** 后端返回的最近变更摘要（若有审计/聚合字段） */
  activitySummary?: string;
  /** 列表接口未带 comments 数组时，后端可返回评论条数 */
  commentCount?: number;
  /** 列表接口未带 attachments 数组时，后端可返回附件个数 */
  attachmentCount?: number;
}

/**
 * 子任务
 */
export interface SubTask {
  id: number;
  taskId: number;
  title: string;
  isDone: boolean;
  sortOrder: number;
  createdAt: string;
}

/**
 * 重复规则
 */
export interface RepeatRule {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  interval: number; // 间隔
  endDate?: string; // 结束日期
  daysOfWeek?: number[]; // 周几（0-6，0为周日）
  dayOfMonth?: number; // 每月第几天
}

/**
 * 附件
 */
export interface Attachment {
  id: number;
  taskId: number;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType?: string;
  createdAt: string;
}

/**
 * 项目附件 VO（与后端 ProjectAttachmentVO 对齐）
 * 下载：GET /api/attachments/{id}/download（与任务附件共用下载接口）
 */
export interface ProjectAttachment {
  id: number;
  projectId: number;
  /** 展示用文件名 */
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType?: string;
  /** 上传时若传 relativePath（如文件夹上传），后端可回显 */
  relativePath?: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * 评论
 */
export interface Comment {
  id: number;
  taskId: number;
  userId: number;
  user?: User;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * 项目
 */
export interface Project {
  id: number;
  name: string;
  description?: string;
  color?: string;
  progress: number;
  taskCount: number;
  completedCount: number;
  createdAt: string;
  /** 当前用户在该项目上的权限：owner=创建人，edit=可编辑，readonly=只读（仅共享项目有） */
  myPermission?: 'owner' | 'edit' | 'readonly';
  /** 项目负责人 id 列表（可选，后端支持时返回） */
  assigneeIds?: number[];
  assignees?: User[];
  assigneeId?: number;
  assignee?: User;
  /** 关联的团队 id 列表（同步项目给团队全员只读） */
  teamIds?: number[];
  /** 关联的团队信息（列表/详情返回用于展示） */
  teams?: Team[];
}

/** 项目共享权限：只读 / 编辑 */
export type ProjectPermission = 'readonly' | 'edit';

/** 团队（项目经理创建，被邀请用户可见） */
export interface Team {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  /** 当前用户是否为创建人/管理员 */
  isAdmin?: boolean;
  memberCount?: number;
}

/** 团队成员 */
export interface TeamMember {
  id: number;
  userId: number;
  teamId: number;
  email: string;
  nickname?: string;
  avatar?: string;
  /** active=已加入，pending=待接受邀请 */
  status: 'active' | 'pending';
  isAdmin?: boolean;
  joinedAt?: string;
}

/** 项目共享记录（共享给团队或成员） */
export interface ProjectShare {
  id: number;
  projectId: number;
  teamId?: number;
  teamName?: string;
  userId?: number;
  permission: ProjectPermission;
  createdAt: string;
}

/** 编辑权限申请（只读用户申请，项目经理审批） */
export interface EditPermissionRequest {
  id: number;
  projectId: number;
  projectName?: string;
  userId: number;
  userNickname?: string;
  userEmail?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

/** 项目任务统计（与后端 TaskStatsVO 一致，鉴权与项目详情一致，无权限 404） */
export interface ProjectTaskStats {
  todo: number;
  doing: number;
  done: number;
  onHold: number;
  total: number;
}

/** 项目详情中的负责人项（与后端 ProjectAssigneeVO 对齐） */
export interface ProjectAssigneeVO {
  id: number;
  username?: string;
  nickname?: string;
  email?: string;
  avatar?: string;
}

/** 项目详情中的关联团队简要信息（与后端 ProjectTeamBasicVO 对齐） */
export interface ProjectTeamBasicVO {
  id: number;
  name: string;
  description?: string;
}

/** 项目详情 VO（与后端 ProjectVO 对齐，用于 GET /api/projects/{id} 及编辑回填） */
export interface ProjectVO {
  id: number;
  name: string;
  description?: string;
  color?: string;
  progress?: number;
  taskCount?: number;
  completedCount?: number;
  createdAt: string;
  myPermission?: 'owner' | 'edit' | 'readonly';
  assigneeIds?: number[];
  assignees?: ProjectAssigneeVO[];
  assigneeId?: number;
  assignee?: ProjectAssigneeVO;
  teamIds?: number[];
  teams?: ProjectTeamBasicVO[];
}

/**
 * 标签
 */
export interface Tag {
  id: number;
  name: string;
  color?: string;
}

/**
 * 通知偏好（GET/PATCH /api/notifications/preferences）
 */
export interface NotificationPreferences {
  channelInApp?: boolean;
  channelEmail?: boolean;
  /** 聚合/最小间隔（分钟），以后端为准 */
  frequencyMinutes?: number;
  /** 邮件通道用 SMTP（字段名与发信 DTO 一致；授权码仅 PATCH 时传入，GET 通常不回显） */
  smtpHost?: string;
  smtpPort?: number;
  fromEmail?: string;
  fromPassword?: string;
  ssl?: boolean;
}

/**
 * 通知
 */
export interface Notification {
  id: number;
  type: 'deadline' | 'assign' | 'comment' | 'system' | 'friend_request';
  title: string;
  content: string;
  taskId?: number;
  read: boolean;
  createdAt: string;
  /** 若后端仅返回更新时间，展示时与 createdAt 二选一 */
  updatedAt?: string;
  /** 触发该通知的用户 id；与当前用户一致时表示本人操作，列表中不展示 */
  actorUserId?: number;
  /** 后端显式标记为本人相关操作（自建、自指派等），为 true 时不展示 */
  isSelfAction?: boolean;
  /** 关联业务类型，如 friend_request（好友申请，见后端通知类型 8） */
  relatedType?: string;
  /** 关联实体 id，如好友申请 id */
  relatedId?: number;
}

/**
 * 好友申请（与后端 FriendRequestVO 对齐）
 */
export interface FriendRequestVO {
  id: number;
  requester: User;
  target: User;
  /** 0 待处理 1 已同意 2 已拒绝 3 已撤销；列表接口待处理仅为 0 */
  status: number;
  statusLabel: string;
  createdAt: string;
}

/**
 * 好友列表项（GET /api/friends、PATCH 备注返回）。
 * - `online === true`：约 5 分钟内有心跳视为在线。
 * - 离线时「最后在线」时间同源（user.last_active_at），JSON 可能以驼峰/蛇形多字段重复序列化，值相同；为 null 时 @JsonInclude(NON_NULL) 可整段省略。
 * - 展示层见 `FriendUserCell`：`pickLastOnlineAt` 对下列任一字段兜底即可。
 */
/** 私聊消息类型：0 文本 / 1 图片 / 2 文件 */
export type ChatMsgType = 0 | 1 | 2;

/** GET /api/chat/conversations/{id}/messages 单条消息 */
export interface ChatMessageVO {
  id: number;
  conversationId?: number;
  msgType?: ChatMsgType;
  msg_type?: ChatMsgType;
  content?: string | null;
  fileUrl?: string | null;
  file_url?: string | null;
  fileName?: string | null;
  file_name?: string | null;
  senderUserId?: number;
  sender_user_id?: number;
  createdAt?: string;
  created_at?: string;
  readByPeer?: boolean;
  read_by_peer?: boolean;
}

/** GET /api/chat/conversations 会话项 */
export interface ChatConversationVO {
  id: number;
  peerUserId?: number;
  peer_user_id?: number;
  peer?: User;
  lastMessage?: ChatMessageVO;
  lastMessagePreview?: string;
  lastMessageAt?: string;
  last_message_at?: string;
  unreadCount?: number;
  unread_count?: number;
  peerReadMyLast?: boolean;
  peer_read_my_last?: boolean;
}

/** STOMP /user/queue/chat 推送体 */
export type ChatRealtimeEventType = 'NEW_MESSAGE' | 'READ_RECEIPT';

export interface ChatRealtimeEvent {
  type: ChatRealtimeEventType;
  conversationId: number;
  message?: ChatMessageVO;
  readerUserId?: number;
  readUpToMessageId?: number;
}

export interface FriendUserVO extends User {
  /** 我对该好友的备注（与 friendRemark 同义，后端可能只回其一） */
  remark?: string | null;
  /** 与 remark 同值，便于兼容后端字段 */
  friendRemark?: string | null;
  /** 是否在线 */
  online?: boolean | null;
  /** 最后在线时间 ISO（与 lastOnlineAt、lastSeen 系列同源） */
  lastActiveAt?: string | null;
  /** 与 lastActiveAt 同义 */
  lastOnlineAt?: string | null;
  /** 与 lastActiveAt 同义 */
  lastSeenAt?: string | null;
}

/**
 * 看板数据
 */
export interface BoardData {
  todo: Task[];
  doing: Task[];
  done: Task[];
  stalled?: Task[];
}

/**
 * 统计数据
 */
export interface Statistics {
  todayCompleted: number;
  weekCompleted: number[];
  monthCompleted: number[];
  overdueCount: number;
  totalTasks: number;
  focusMinutes?: number; // 专注时长
  completionRate?: number; // 完成率
}

/**
 * 每日统计
 */
export interface DailyStatistics {
  date: string;
  completedCount: number;
  focusMinutes: number;
  taskCount: number;
}

/**
 * 搜索结果
 */
export interface SearchResult {
  tasks: Task[];
  projects: Project[];
  total: number;
}
