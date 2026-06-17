import { computed } from 'vue';
import { useTaskStore } from '@/stores/task';
import type { Task } from '@/types';

/**
 * 任务相关 Composables
 */
export function useTasks() {
  const taskStore = useTaskStore();

  /**
   * 获取指定状态的任务
   */
  const getTasksByStatus = (status: string) => {
    return computed(() => {
      const statusKey = status as keyof typeof taskStore.tasks;
      return taskStore.tasks[statusKey] || [];
    });
  };

  /**
   * 获取逾期任务
   */
  const getOverdueTasks = () => {
    return computed(() => {
      const tasks = taskStore.allTasks;
      return tasks.filter((task: Task) => {
        if (!task.dueTime) return false;
        return new Date(task.dueTime) < new Date() && task.status !== 'done';
      });
    });
  };

  /**
   * 获取今日任务
   */
  const getTodayTasks = () => {
    return computed(() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const tasks = taskStore.allTasks;
      return tasks.filter((task: Task) => {
        if (!task.dueTime) return false;
        const dueDate = new Date(task.dueTime);
        return dueDate >= today && dueDate < tomorrow;
      });
    });
  };

  /**
   * 创建任务
   */
  const createTask = async (data: Partial<Task>) => {
    return await taskStore.createTask(data);
  };

  /**
   * 更新任务
   */
  const updateTask = async (taskId: number, payload: Partial<Task>) => {
    return await taskStore.updateTask(taskId, payload);
  };

  /**
   * 删除任务
   */
  const deleteTask = async (taskId: number) => {
    return await taskStore.deleteTask(taskId);
  };

  /**
   * 归档任务（设置 archivedAt，从看板移除）
   */
  const archiveTask = async (taskId: number) => {
    return await taskStore.archiveTask(taskId);
  };

  /**
   * 移动任务（先更新本地，再 PATCH 持久化）
   */
  const moveTask = async (taskId: number, newStatus: string, newIndex?: number) => {
    return await taskStore.moveTask(taskId, newStatus, newIndex);
  };

  return {
    tasks: computed(() => taskStore.tasks),
    allTasks: computed(() => taskStore.allTasks),
    loading: computed(() => taskStore.loading),
    getTasksByStatus,
    getOverdueTasks,
    getTodayTasks,
    createTask,
    updateTask,
    deleteTask,
    archiveTask,
    moveTask,
    fetchBoard: taskStore.fetchBoard,
    fetchTasks: taskStore.fetchTasks,
    fetchTasksInRange: taskStore.fetchTasksInRange,
  };
}
