<template>
  <n-auto-complete
    v-model:value="keyword"
    :options="searchOptions"
    :loading="loading"
    placeholder="搜索任务、项目..."
    clearable
    @select="handleSelect"
    @update:value="handleSearch"
  >
    <template #prefix>
      <n-icon><Search /></n-icon>
    </template>
  </n-auto-complete>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { NAutoComplete, NIcon } from 'naive-ui';
import { Search } from '@vicons/ionicons5';
import { useSearch } from '@/composables/useSearch';
import { useRouter } from 'vue-router';

const router = useRouter();
const { results, loading, search } = useSearch();
const keyword = ref('');

const searchOptions = computed(() => {
  if (!results.value) return [];
  
  const options: any[] = [];
  
  // 任务结果
  if (results.value.tasks && results.value.tasks.length > 0) {
    options.push({
      type: 'group',
      label: '任务',
      children: results.value.tasks.slice(0, 5).map((task: any) => ({
        label: task.title,
        value: `task:${task.id}`,
        type: 'task',
        task,
      })),
    });
  }
  
  // 项目结果
  if (results.value.projects && results.value.projects.length > 0) {
    options.push({
      type: 'group',
      label: '项目',
      children: results.value.projects.slice(0, 5).map((project: any) => ({
        label: project.name,
        value: `project:${project.id}`,
        type: 'project',
        project,
      })),
    });
  }
  
  return options;
});

let searchTimer: NodeJS.Timeout | null = null;

const handleSearch = (value: string) => {
  keyword.value = value;
  
  // 防抖搜索
  if (searchTimer) {
    clearTimeout(searchTimer);
  }
  
  searchTimer = setTimeout(() => {
    if (value.trim()) {
      search(value);
    }
  }, 300);
};

const handleSelect = (value: string) => {
  const [type, id] = value.split(':');
  if (type === 'task') {
    router.push({ name: 'Tasks', query: { taskId: id } });
  } else if (type === 'project') {
    router.push({ name: 'Projects', query: { projectId: id } });
  }
};
</script>

<style scoped>
@import '../styles/components.css';

.n-auto-complete {
  width: 300px;
  min-width: 200px;
}

:deep(.n-auto-complete .n-input) {
  border-radius: 8px;
  transition: all 0.2s ease;
}

:deep(.n-auto-complete .n-input:focus) {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

:deep(.n-auto-complete-menu) {
  border-radius: 12px;
  box-shadow: var(--shadow-elevated);
  margin-top: 4px;
  padding: 4px;
}

:deep(.n-auto-complete-option) {
  border-radius: 8px;
  padding: 8px 12px;
  transition: all 0.2s ease;
}

:deep(.n-auto-complete-option:hover) {
  background: var(--bg-tertiary);
  color: var(--accent-primary);
}

:deep(.n-auto-complete-group-header) {
  padding: 8px 12px 4px;
  font-size: var(--font-size-small);
  color: var(--text-tertiary);
  font-weight: 600;
}
</style>
