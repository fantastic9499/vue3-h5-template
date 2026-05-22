<template>
  <picture>
    <source :srcset="optimizedSrc" type="image/webp" />
    <source :srcset="src" type="image/jpeg" />
    <img :src="optimizedSrc" :loading="lazy ? 'lazy' : 'eager'" @error="onImgError" alt="" />
  </picture>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface IOptImageProps {
  src: string;
  width?: number;
  height?: number;
  quality?: number;
  fallback?: string;
  lazy?: boolean;
}

const props = withDefaults(defineProps<IOptImageProps>(), {
  quality: 80,
  lazy: true,
});

const optimizedSrc = computed(() => {
  if (!props.width) return props.src;
  return `${props.src}?imageView2/2/w/${props.width}/q/${props.quality}/format/webp`;
});

const onImgError = (e: Event): void => {
  const img = e.target as HTMLImageElement;
  if (props.fallback) {
    img.src = props.fallback;
  }
};
</script>
