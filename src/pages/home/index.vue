<script setup lang="ts">
defineOptions({ name: 'HomePage' });
</script>

<template>
  <div class="home-page">
    <h2>首页</h2>
    <p>Vue 3 H5 脚手架已正常运行</p>
    <router-link to="/user/profile">个人中心</router-link>
  </div>
</template>
