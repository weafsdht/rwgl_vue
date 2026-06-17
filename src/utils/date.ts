import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

/**
 * 格式化日期
 */
export function formatDate(date: string | Date | null | undefined, format = 'YYYY-MM-DD HH:mm'): string {
  if (!date) return '';
  return dayjs(date).format(format);
}

/**
 * 相对时间（如：2小时前）
 * @param now 传入时用该时间作为“当前”计算相对时间，便于定时刷新显示（实时）
 */
export function fromNow(date: string | Date | null | undefined, now?: dayjs.Dayjs): string {
  if (!date) return '';
  const d = dayjs(date);
  return now ? d.from(now) : d.fromNow();
}

/**
 * 快捷时间选择器选项
 */
export const quickTimeOptions = [
  { label: '今天', value: () => dayjs().endOf('day').valueOf() },
  { label: '明天', value: () => dayjs().add(1, 'day').endOf('day').valueOf() },
  { label: '下周一', value: () => dayjs().day(8).endOf('day').valueOf() },
  { label: '下周', value: () => dayjs().add(1, 'week').endOf('week').valueOf() },
  { label: '下个月', value: () => dayjs().add(1, 'month').endOf('month').valueOf() },
];

/**
 * 判断是否逾期
 */
export function isOverdue(dueTime: string | Date | null | undefined): boolean {
  if (!dueTime) return false;
  return dayjs(dueTime).isBefore(dayjs(), 'minute');
}

/**
 * 截止倒计时文案：不足 24 小时显示「X小时X分」，超过 24 小时显示「X天X小时」，已过期返回「逾期」
 */
export function getCountdownText(
  dueTime: string | Date | null | undefined,
  now: dayjs.Dayjs = dayjs()
): string {
  if (!dueTime) return '';
  const end = dayjs(dueTime);
  if (end.isBefore(now) || end.isSame(now)) return '逾期';
  const totalMinutes = end.diff(now, 'minute', true);
  if (totalMinutes < 24 * 60) {
    const hours = Math.floor(totalMinutes / 60);
    const mins = Math.floor(totalMinutes % 60);
    if (hours > 0) return `${hours}小时${mins}分`;
    return `${mins}分`;
  }
  const totalHours = end.diff(now, 'hour', true);
  const days = Math.floor(totalHours / 24);
  const hours = Math.floor(totalHours % 24);
  if (days > 0) return `${days}天${hours}小时`;
  return `${hours}小时`;
}
