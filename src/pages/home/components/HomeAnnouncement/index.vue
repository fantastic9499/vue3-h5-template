<template>
  <button type="button" :class="styles.announcement" @click="onClick">
    <van-icon name="volume-o" size="18" color="#ff8a00" />
    <div :class="styles.text" :title="props.text">{{ props.text }}</div>
    <van-icon name="arrow" size="14" color="#c8c8c8" />
  </button>
</template>

<script setup lang="ts">
import styles from './index.module.less';

interface IHomeAnnouncementProps {
  text: string;
}

const props = defineProps<IHomeAnnouncementProps>();

const emit = defineEmits<{
  (e: 'click'): void;
}>();

const onClick = (): void => {
  emit('click');
};
</script>
