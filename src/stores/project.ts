import { defineStore } from 'pinia';
import { ref } from 'vue';
import projectApi from '@/api/project';
import type { Project } from '@/types';

export const useProjectStore = defineStore('project', () => {
  const projects = ref<Project[]>([]);
  const loading = ref(false);
  const currentProjectId = ref<number | null>(null);

  /**
   * 获取项目列表
   */
  async function fetchProjects() {
    loading.value = true;
    try {
      projects.value = await projectApi.getProjects();
    } finally {
      loading.value = false;
    }
  }

  /**
   * 创建项目
   */
  async function createProject(data: Partial<Project>) {
    const newProject = await projectApi.createProject(data);
    projects.value.push(newProject);
    return newProject;
  }

  /**
   * 更新项目
   * 后端可能返回 cover 而非 color，统一为 color 供卡片展示
   */
  async function updateProject(id: number, data: Partial<Project>) {
    const raw = await projectApi.updateProject(id, data);
    const updatedProject: Project = {
      ...raw,
      color: raw.color ?? (raw as unknown as { cover?: string }).cover ?? data.color,
    };
    const index = projects.value.findIndex(p => p.id === id);
    if (index !== -1) {
      projects.value[index] = updatedProject;
    }
    return updatedProject;
  }

  /**
   * 删除项目
   */
  async function deleteProject(id: number) {
    await projectApi.deleteProject(id);
    projects.value = projects.value.filter(p => p.id !== id);
    if (currentProjectId.value === id) {
      currentProjectId.value = null;
    }
  }

  /**
   * 设置当前项目
   */
  function setCurrentProject(id: number | null) {
    currentProjectId.value = id;
  }

  return {
    projects,
    loading,
    currentProjectId,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    setCurrentProject,
  };
});
