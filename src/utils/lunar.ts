import { Solar } from 'lunar-javascript';

/**
 * 根据公历日期键（YYYY-MM-DD）返回简短农历显示，如「四月廿一」
 */
export function getLunarLabel(dateKey: string): string {
  if (!dateKey) return '';
  const [y, m, d] = dateKey.split('-').map(Number);
  if (!y || !m || !d) return '';
  try {
    const solar = Solar.fromYmd(y, m, d);
    const lunar = solar.getLunar();
    const month = lunar.getMonthInChinese();
    const day = lunar.getDayInChinese();
    return month + '月' + day;
  } catch {
    return '';
  }
}
