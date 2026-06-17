import { computed } from 'vue';
import { useProjectStore } from '@/stores/project';

/**
 * 项目相关 Composables
 */
export function useProjects() {
  const projectStore = useProjectStore();

  /**
   * 获取当前项目
   */
  const currentProject = computed(() => {
    if (!projectStore.currentProjectId) return null;
    return projectStore.projects.find(p => p.id === projectStore.currentProjectId) || null;
  });

  return {
    projects: computed(() => projectStore.projects),
    currentProject,
    currentProjectId: computed(() => projectStore.currentProjectId),
    loading: computed(() => projectStore.loading),
    fetchProjects: projectStore.fetchProjects,
    createProject: projectStore.createProject,
    updateProject: projectStore.updateProject,
    deleteProject: projectStore.deleteProject,
    setCurrentProject: projectStore.setCurrentProject,
  };
}
