<!--
 * @Author: TuXunJia
 * @Date: 2026-05-21 11:06:47
 * @LastEditors: TuXunJia
 * @LastEditTime: 2026-05-25 15:32:52
-->
<template>
  <div :class="styles.page">
    <template v-if="activeTab === 0">
      <HomeHero :name="user?.name ?? ''" :date="mockData.date" />

      <main :class="styles.content">
        <HomeAppSection title="我的应用" :items="mockData.apps" @item-click="onAppItemClick" />
        <div :class="styles.gap" />
        <HomeAnnouncement :text="mockData.announcementText" @click="onAnnouncementClick" />
        <div :class="styles.gap" />
        <HomeRecentBrowse title="最近浏览" state="noPermission" empty-text="暂无权限" />
      </main>
    </template>

    <HomePlaceholder v-else-if="activeTab === 1" title="目录" />
    <HomePlaceholder v-else-if="activeTab === 2" title="我的" />

    <HomeTabBar v-model="activeTab" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import HomeAnnouncement from './components/HomeAnnouncement/index.vue';
import HomeAppSection, { type IHomeAppItem } from './components/HomeAppSection/index.vue';
import HomeHero from './components/HomeHero/index.vue';
import HomePlaceholder from './components/HomePlaceholder/index.vue';
import HomeRecentBrowse from './components/HomeRecentBrowse/index.vue';
import HomeTabBar from './components/HomeTabBar/index.vue';
import styles from './index.module.less';
import { useLogin } from './useLogin';

defineOptions({ name: 'HomePage' });

interface IHomeDateInfo {
  day: string;
  monthLabel: string;
  weekdayLabel: string;
}

interface IHomePageMockData {
  name: string;
  date: IHomeDateInfo;
  apps: IHomeAppItem[];
  announcementText: string;
}

const mockData: IHomePageMockData = {
  name: '吴雅兰',
  date: { day: '01', monthLabel: '4月', weekdayLabel: '星期二' },
  apps: [
    { key: 'report', title: '报表目录', icon: 'notes-o' },
    { key: 'warning', title: '指标预警', icon: 'warning-o' },
    { key: 'reporting', title: '益通报', icon: 'bar-chart-o' },
  ],
  announcementText: '各位益主的家人们，数字化中心将于今天…',
};

const onAppItemClick = (_item: IHomeAppItem): void => {};

const onAnnouncementClick = (): void => {};

const activeTab = ref(0);

const { user } = useLogin();
</script>
