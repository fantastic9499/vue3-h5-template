import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAppStore = defineStore('app', () => {
  const theme = ref<'light' | 'dark'>('light');
  const platform = ref<'wechat' | 'alipay' | 'browser'>('browser');
  const loading = ref(false);

  function detectEnvironment(): void {
    const ua = navigator.userAgent.toLowerCase();
    if (/micromessenger/i.test(ua)) {
      platform.value = 'wechat';
    } else if (/alipayclient/i.test(ua)) {
      platform.value = 'alipay';
    } else {
      platform.value = 'browser';
    }
  }

  function toggleTheme(): void {
    theme.value = theme.value === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme.value);
  }

  function setLoading(val: boolean): void {
    loading.value = val;
  }

  return { theme, platform, loading, detectEnvironment, toggleTheme, setLoading };
});
