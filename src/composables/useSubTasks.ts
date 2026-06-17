import { ref, computed } from 'vue';
import subtaskApi from '@/api/subtask';
import type { SubTask } from '@/types';

/**
 * 子任务相关 Composables
 */
export function useSubTasks(taskId: number) {
  const subtasks = ref<SubTask[]>([]);
  const loading = ref(false);

  /**
   * 获取子任务列表
   */
  const fetchSubtasks = async () => {
    loading.value = true;
    try {
      subtasks.value = await subtaskApi.getSubtasks(taskId);
    } finally {
      loading.value = false;
    }
  };

  /**
   * 创建子任务
   */
  const createSubtask = async (title: string) => {
    const newSubtask = await subtaskApi.createSubtask(taskId, {
      title,
      isDone: false,
      sortOrder: subtasks.value.length,
    });
    subtasks.value.push(newSubtask);
    return newSubtask;
  };

  /**
   * 更新子任务
   */
  const updateSubtask = async (subtaskId: number, data: Partial<SubTask>) => {
    const updated = await subtaskApi.updateSubtask(taskId, subtaskId, data);
    const index = subtasks.value.findIndex(s => s.id === subtaskId);
    if (index !== -1) {
      subtasks.value[index] = updated;
    }
    return updated;
  };

  /**
   * 切换子任务完成状态
   */
  const toggleSubtask = async (subtaskId: number) => {
    const updated = await subtaskApi.toggleSubtask(taskId, subtaskId);
    const index = subtasks.value.findIndex(s => s.id === subtaskId);
    if (index !== -1) {
      subtasks.value[index] = updated;
    }
    return updated;
  };

  /**
   * 删除子任务
   */
  const deleteSubtask = async (subtaskId: number) => {
    await subtaskApi.deleteSubtask(taskId, subtaskId);
    subtasks.value = subtasks.value.filter(s => s.id !== subtaskId);
  };

  /**
   * 计算完成进度
   */
  const completionRate = computed(() => {
    if (subtasks.value.length === 0) return 0;
    const completed = subtasks.value.filter(s => s.isDone).length;
    return Math.round((completed / subtasks.value.length) * 100);
  });

  return {
    subtasks,
    loading,
    completionRate,
    fetchSubtasks,
    createSubtask,
    updateSubtask,
    toggleSubtask,
    deleteSubtask,
  };
}
