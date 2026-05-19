<script setup lang="ts">
import { computed, onErrorCaptured, ref } from 'vue';
import { useRoute } from 'vue-router';

const catchError = ref<Error | null>(null);

onErrorCaptured((err) => {
  catchError.value = err;
  return false;
});

const route = useRoute();

const keepAliveList = computed(() =>
  route.matched.filter((r) => r.meta.keepAlive).map((r) => r.name as string),
);
</script>

<template>
  <div v-if="catchError" class="error-wrap">
    <p>页面出了点问题</p>
    <button @click="catchError = null">点击重试</button>
  </div>
  <router-view v-else v-slot="{ Component, route: currentRoute }">
    <transition name="fade" mode="out-in">
      <keep-alive :include="keepAliveList">
        <suspense>
          <template #default>
            <component :is="Component" :key="currentRoute.path" />
          </template>
          <template #fallback>
            <van-skeleton :row="5" />
          </template>
        </suspense>
      </keep-alive>
    </transition>
  </router-view>
</template>
