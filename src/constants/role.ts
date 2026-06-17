/**
 * 角色常量与权限判断（兼容后端返回 number 或 string，如 role: 0 或 role: "0"）
 */

export const ROLE_OPTIONS = [
  { value: 0, label: '系统管理员' },
  { value: 1, label: '项目经理' },
  { value: 2, label: '普通用户' },
] as const;

/** 是否为系统管理员：支持 number | string | undefined，内部用 Number(role) === 0 判断 */
export function isSystemAdmin(role: number | string | undefined): boolean {
  return Number(role) === 0;
}

/** 是否为项目经理：可创建团队、邀请用户、共享项目、审批编辑权限 */
export function isProjectManager(role: number | string | undefined): boolean {
  return Number(role) === 1;
}

/** 是否为系统管理员或项目经理（role=0 或 1）：可管理项目、使用统计接口、将任务关联到项目 */
export function isProjectManagerOrAdmin(role: number | string | undefined): boolean {
  const n = Number(role);
  return n === 0 || n === 1;
}

/** 按 role 返回展示文案（兼容 number/string） */
export function getRoleLabel(role: number | string | undefined): string {
  const n = Number(role);
  const opt = ROLE_OPTIONS.find((o) => o.value === n);
  return opt ? opt.label : '未知';
}
