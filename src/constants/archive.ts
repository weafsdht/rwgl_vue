/** 自动归档时间选项（预设） */
export const AUTO_ARCHIVE_OPTIONS = [
  { label: '不自动归档', value: 'off' },
  { label: '一天后', value: '24h' },
  { label: '三天后', value: '72h' },
  { label: '一周后', value: '7d' },
] as const;

export type AutoArchivePreset = (typeof AUTO_ARCHIVE_OPTIONS)[number]['value'];

/** 含预设与 `custom:<小时>`（1–8760） */
export type AutoArchiveValue = AutoArchivePreset | string;

export const AUTO_ARCHIVE_STORAGE_KEY = 'autoArchiveAfter';

const CUSTOM_RE = /^custom:(\d+)$/;

/** 解析自定义归档小时数，非法返回 null */
export function parseCustomArchiveHours(v: string): number | null {
  const m = CUSTOM_RE.exec(v.trim());
  if (!m) return null;
  const h = parseInt(m[1], 10);
  if (!Number.isFinite(h) || h < 1 || h > 8760) return null;
  return h;
}

/** 是否为自定义归档值 */
export function isCustomArchiveValue(v: string): boolean {
  return parseCustomArchiveHours(v) != null;
}

/** 获取自动归档设置，默认关闭 */
export function getAutoArchiveAfter(): AutoArchiveValue {
  const v = localStorage.getItem(AUTO_ARCHIVE_STORAGE_KEY);
  if (v == null || v === '') return 'off';
  // 旧版「48 小时后」已改为「三天后」（72h），迁移存盘
  if (v === '48h') {
    localStorage.setItem(AUTO_ARCHIVE_STORAGE_KEY, '72h');
    return '72h';
  }
  if (v === 'off' || v === '24h' || v === '72h' || v === '7d') return v;
  if (parseCustomArchiveHours(v) != null) return v;
  return 'off';
}

/** 设置自动归档 */
export function setAutoArchiveAfter(value: AutoArchiveValue): void {
  localStorage.setItem(AUTO_ARCHIVE_STORAGE_KEY, value);
}

/** 将选项值转为毫秒数，off 返回 0 */
export function autoArchiveMs(value: AutoArchiveValue): number {
  if (value === 'off') return 0;
  if (value === '24h') return 24 * 60 * 60 * 1000;
  if (value === '72h') return 72 * 60 * 60 * 1000;
  /** @deprecated 旧版选项，仍按 48 小时计（仅未迁移的 localStorage） */
  if (value === '48h') return 48 * 60 * 60 * 1000;
  if (value === '7d') return 7 * 24 * 60 * 60 * 1000;
  const h = parseCustomArchiveHours(String(value));
  if (h != null) return h * 60 * 60 * 1000;
  return 0;
}
