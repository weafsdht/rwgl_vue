/**
 * 看板拖拽 / 任务状态与后端对齐（0-based）
 * PATCH /api/tasks/:id body: { status: statusToBackendNumber(目标列状态) }，传 0–3 即可
 */
export const STATUS_TODO = 0;
export const STATUS_DOING = 1;
export const STATUS_DONE = 2;
export const STATUS_ON_HOLD = 3;

export const BOARD_STATUS_NUMBERS = [STATUS_TODO, STATUS_DOING, STATUS_DONE, STATUS_ON_HOLD] as const;
