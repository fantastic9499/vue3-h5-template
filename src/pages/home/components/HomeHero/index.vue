<!--
 * @Author: TuXunJia
 * @Date: 2026-05-20 12:38:37
 * @LastEditors: TuXunJia
 * @LastEditTime: 2026-05-20 12:38:39
 * @Description:
-->
<template>
  <section :class="styles.hero">
    <div :class="styles.heroBgDecor" aria-hidden="true" />

    <div :class="styles.heroInner">
      <div :class="styles.user">
        <div :class="styles.avatar" aria-hidden="true">
          <van-icon name="user-o" size="18" color="#2f6fe5" />
        </div>
        <div :class="styles.userInfo">
          <div :class="styles.userName">{{ name }}</div>
        </div>
      </div>

      <div :class="styles.dateCard" aria-label="日期">
        <div :class="styles.dateDay">{{ date.day }}</div>
        <div :class="styles.dateMeta">
          <div :class="styles.dateMonth">{{ date.monthLabel }}</div>
          <div :class="styles.dateWeekday">{{ date.weekdayLabel }}</div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import styles from './index.module.less';

interface IHomeHeroDate {
  day: string;
  monthLabel: string;
  weekdayLabel: string;
}

interface IHomeHeroProps {
  name: string;
  date: IHomeHeroDate;
}

defineProps<IHomeHeroProps>();
</script>
