import { ref } from 'vue';
import searchApi from '@/api/search';
import type { SearchResult } from '@/types';

/**
 * 搜索相关 Composables
 */
export function useSearch() {
  const results = ref<SearchResult | null>(null);
  const loading = ref(false);
  const keyword = ref('');

  /**
   * 执行搜索
   */
  const search = async (query: string, options?: { type?: 'task' | 'project' | 'all'; limit?: number }) => {
    if (!query.trim()) {
      results.value = null;
      return;
    }

    keyword.value = query;
    loading.value = true;
    try {
      results.value = await searchApi.search(query, options);
    } finally {
      loading.value = false;
    }
  };

  /**
   * 清空搜索结果
   */
  const clearResults = () => {
    results.value = null;
    keyword.value = '';
  };

  return {
    results,
    loading,
    keyword,
    search,
    clearResults,
  };
}
