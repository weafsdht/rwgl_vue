import { defineStore } from 'pinia';
import { ref } from 'vue';
import teamApi from '@/api/team';
import type { Team } from '@/types';

/** 团队列表与「是否有团队」用于控制侧栏「团队」入口显示（被邀请用户才有） */
export const useTeamStore = defineStore('team', () => {
  const myTeams = ref<Team[]>([]);
  const loaded = ref(false);

  async function fetchMyTeams() {
    try {
      const list = await teamApi.getMyTeams().catch(() => []);
      myTeams.value = list ?? [];
    } catch {
      myTeams.value = [];
    } finally {
      loaded.value = true;
    }
  }

  function clear() {
    myTeams.value = [];
    loaded.value = false;
  }

  return {
    myTeams,
    loaded,
    fetchMyTeams,
    clear,
  };
});
