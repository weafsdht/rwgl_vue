/**
 * 状态颜色常量
 */
export const STATUS_COLORS = {
  todo: '#1890FF',      // 待办/活跃蓝
  doing: '#1890FF',     // 进行中
  done: '#52C41A',      // 已完成/成功绿
  stalled: '#BFBFBF',   // 搁置
  overdue: '#FF4D4F',   // 逾期红
} as const;

/**
 * 优先级颜色常量
 */
export const PRIORITY_COLORS = {
  high: '#FF4D4F',
  medium: '#FA8C16',
  low: '#1890FF',
} as const;

/**
 * 任务状态枚举
 */
export enum TaskStatus {
  TODO = 'todo',
  DOING = 'doing',
  DONE = 'done',
  STALLED = 'stalled',
}

/**
 * 优先级枚举
 */
export enum Priority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

/**
 * 获取状态颜色
 */
export function getStatusColor(status: string): string {
  return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.todo;
}

/**
 * 获取优先级颜色
 */
export function getPriorityColor(priority: string): string {
  return PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS] || PRIORITY_COLORS.low;
}
