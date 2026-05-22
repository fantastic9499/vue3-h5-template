<template>
  <div :class="styles.wrap">
    <span :class="styles.title">{{ title }}</span>
  </div>
</template>

<script setup lang="ts">
import styles from './index.module.less';

defineOptions({ name: 'HomePlaceholder' });

defineProps<{
  title: string;
}>();
</script>
