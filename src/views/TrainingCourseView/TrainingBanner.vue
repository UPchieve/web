<script lang="ts" setup>
import CampingIcon from '@/assets/Training/camping.svg?url'
import CheeringStudentIcon from '@/assets/Training/cheering_student.svg?url'
import StudyingIcon from '@/assets/Training/desk_studying.svg?url'
import GroupOfPeopleIcon from '@/assets/Training/group_of_people.svg?url'
import SecurityIcon from '@/assets/Training/security.svg?url'
import { computed } from 'vue'

const props = defineProps<{
  moduleName: string
  title: string
  subtitle: string
}>()

const moduleBannerInfo = computed(() => {
  let styleInfo: any
  switch (props.moduleName) {
    case 'Introduction':
      styleInfo = {
        icon: CampingIcon,
        color: '#80C4B4',
      }
      break
    case 'Implementing Effective Coaching Strategies':
      styleInfo = {
        icon: CheeringStudentIcon,
        color: '#BCE6E3',
      }
      break
    case 'Academic Integrity':
      styleInfo = {
        icon: StudyingIcon,
        color: '#FBCDCD',
      }
      break
    case 'Diversity, Equity, and Inclusion':
      styleInfo = {
        icon: GroupOfPeopleIcon,
        color: '#CFF1C0',
      }
      break
    case 'Community Safety':
      styleInfo = {
        icon: SecurityIcon,
        color: '#D4D9F7',
      }
      break
    default:
      styleInfo = {
        icon: CheeringStudentIcon,
        color: '#BCE6E3',
      }
      break
  }
  return styleInfo
})
</script>

<template>
  <div
    class="training-banner"
    :style="{
      'background-color': moduleBannerInfo.color,
    }"
  >
    <div class="titles">
      <h2 class="banner-subtitle">{{ props.subtitle }}</h2>
      <h1 class="banner-title">{{ props.title }}</h1>
    </div>
    <div class="banner-illustration">
      <img :src="moduleBannerInfo.icon" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.training-banner {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
  position: relative;
  border-radius: 8px 0 0 0;
  justify-content: end;

  @include breakpoint-above('medium') {
    height: 158px;
    max-width: 833px;
    padding-right: 8px;
  }
  @include breakpoint-below('medium') {
    max-height: 280px;

    @media only screen and (orientation: landscape) {
      height: 150px;
    }

    @media only screen and (orientation: portrait) {
      height: 280px;
    }
  }
}

.banner-illustration {
  align-self: flex-end;
  overflow: clip;
  height: 100%;
  align-content: end;
}

.titles {
  z-index: 0;
  position: sticky;
  display: flex;
  flex-direction: column;
  left: 5%;
  top: 20%;
  word-break: initial;
  margin: auto;
  width: 70%;
  padding-left: 32px;

  @include breakpoint-below('medium') {
    @include font-category('display-small');
  }

  @include breakpoint-below('small') {
    padding-left: 8px;
  }

  .banner-subtitle {
    @include font-category('subheading');
    color: $c-hover-green;
  }

  .banner-title {
    font-size: clamp(1vw, 2vw, 175%);
    text-wrap: normal;

    @include breakpoint-below('medium') {
      @include font-category('display-small');
    }
  }
}
</style>
