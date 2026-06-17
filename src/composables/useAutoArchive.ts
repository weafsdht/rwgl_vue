import { getAutoArchiveAfter, autoArchiveMs } from '@/constants/archive';
import type { Task } from '@/types';

/**
 * 检查已完成任务是否超过自动归档阈值，若超过则归档
 * @param doneTasks 完成列任务列表
 * @param archiveTask 归档方法
 * @returns 归档的任务数量
 */
export async function runAutoArchive(
  doneTasks: Task[],
  archiveTask: (id: number) => Promise<void>
): Promise<number> {
  const threshold = autoArchiveMs(getAutoArchiveAfter());
  if (threshold <= 0) return 0;

  const now = Date.now();
  let count = 0;
  for (const task of [...doneTasks]) {
    if (task.archivedAt) continue;
    const completedAt = task.completedAt || task.updatedAt;
    if (!completedAt) continue;
    const elapsed = now - new Date(completedAt).getTime();
    if (elapsed >= threshold) {
      try {
        await archiveTask(task.id);
        count++;
      } catch {
        // 单条失败不影响其他
      }
    }
  }
  return count;
}
