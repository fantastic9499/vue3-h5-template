<template>
  <section :class="styles.section">
    <div :class="styles.title">{{ props.title }}</div>

    <div v-if="props.state === 'noPermission'" :class="styles.body">
      <div :class="styles.illustration" aria-hidden="true">
        <div :class="styles.illCard">
          <van-icon name="notes-o" size="28" color="#7aa6ff" />
          <div :class="styles.illDots">
            <span />
            <span />
            <span />
          </div>
        </div>
        <div :class="styles.illPerson">
          <div :class="styles.illHead" />
          <div :class="styles.illBody" />
        </div>
      </div>

      <div :class="styles.emptyText">{{ props.emptyText }}</div>
    </div>

    <div v-else :class="styles.body">
      <div :class="styles.emptyText">{{ props.emptyText }}</div>
    </div>
  </section>
</template>

<script setup lang="ts">
import styles from './index.module.less';

type THomeRecentState = 'noPermission' | 'empty';

interface IHomeRecentBrowseProps {
  title: string;
  state: THomeRecentState;
  emptyText: string;
}

const props = defineProps<IHomeRecentBrowseProps>();
</script>
