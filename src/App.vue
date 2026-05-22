<template>
  <AppLayout />
</template>

<script setup lang="ts">
import { onErrorCaptured, onUnmounted, ref } from 'vue';
import AppLayout from '@/layouts/AppLayout.vue';
import { useAppStore } from '@/stores/app';

const appStore = useAppStore();

// ─── 应用初始化 ───
appStore.detectEnvironment();

// ─── 全局错误监听 ───
const globalError = ref<Error | null>(null);

const onGlobalError = (event: ErrorEvent): void => {
  console.error('[GlobalError]', event.message, event.filename, event.lineno);
};

const onUnhandledRejection = (event: PromiseRejectionEvent): void => {
  console.error('[UnhandledRejection]', event.reason);
};

window.addEventListener('error', onGlobalError);
window.addEventListener('unhandledrejection', onUnhandledRejection);

onUnmounted(() => {
  window.removeEventListener('error', onGlobalError);
  window.removeEventListener('unhandledrejection', onUnhandledRejection);
});

// ─── 捕获子组件渲染错误 ───
onErrorCaptured((err) => {
  console.error('[ErrorCaptured]', err);
  globalError.value = err;
  return false;
});
</script>
