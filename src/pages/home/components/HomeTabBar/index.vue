<template>
  <div :class="styles.wrap">
    <van-tabbar v-model="activeTab" placeholder safe-area-inset-bottom>
      <van-tabbar-item icon="home-o">首页</van-tabbar-item>
      <van-tabbar-item icon="apps-o">目录</van-tabbar-item>
      <van-tabbar-item icon="user-o">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup lang="ts">
import styles from './index.module.less';

defineOptions({ name: 'HomeTabBar' });

const activeTab = defineModel<number>({ required: true });
</script>
