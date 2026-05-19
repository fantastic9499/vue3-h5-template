import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useUserStore = defineStore(
  'user',
  () => {
    const token = ref<string | null>(null);
    const userName = ref('');
    const userCode = ref('');

    const isLoggedIn = computed(() => !!token.value);

    function setUserInfo(newToken: string, newUserName: string, newUserCode: string): void {
      token.value = newToken;
      userName.value = newUserName;
      userCode.value = newUserCode;
    }

    function logout(): void {
      token.value = null;
      userName.value = '';
      userCode.value = '';
    }

    return { token, userName, userCode, isLoggedIn, setUserInfo, logout };
  },
  {
    persist: {
      pick: ['token', 'userName', 'userCode'],
    },
  },
);
