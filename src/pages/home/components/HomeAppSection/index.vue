<template>
  <section :class="styles.section">
    <div :class="styles.title">{{ props.title }}</div>

    <div :class="styles.grid" role="list">
      <button
        v-for="item in props.items"
        :key="item.key"
        type="button"
        :class="styles.gridItem"
        role="listitem"
        @click="onItemClick(item)"
      >
        <div :class="styles.iconWrap" aria-hidden="true">
          <van-icon :name="item.icon" size="26" />
        </div>
        <div :class="styles.itemTitle">{{ item.title }}</div>
        <div v-if="item.subtitle" :class="styles.itemSubtitle">{{ item.subtitle }}</div>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import styles from './index.module.less';

export interface IHomeAppItem {
  key: string;
  title: string;
  icon: string;
  subtitle?: string;
}

interface IHomeAppSectionProps {
  title: string;
  items: IHomeAppItem[];
}

const props = defineProps<IHomeAppSectionProps>();

const emit = defineEmits<{
  (e: 'itemClick', item: IHomeAppItem): void;
}>();

const onItemClick = (item: IHomeAppItem): void => {
  emit('itemClick', item);
};
</script>
