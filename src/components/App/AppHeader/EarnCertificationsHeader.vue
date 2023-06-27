<template>
  <a
    class="header"
    href="https://upchieve.org/certifications"
    target="_blank"
    rel="noopener noreferrer"
    @click="handleClick"
  >
    <p>New feature alert: Earn Certifications to share with colleges 🎉</p>
    <arrow-icon class="arrow-icon" />
  </a>
</template>

<script>
import AnalyticsService from '@/services/AnalyticsService'
import ArrowIcon from '@/assets/arrow.svg'
import { EVENTS } from '@/consts'

export default {
  name: 'earn-certifications-header',
  components: { ArrowIcon },
  methods: {
    handleClick() {
      AnalyticsService.captureEvent(
        EVENTS.STUDENT_CLICKED_EARN_CERTIFICATIONS_BANNER
      )
    },
  },
}
</script>

<style lang="scss" scoped>
p {
  margin-bottom: 0;
  width: 97%;
  text-align: center;
}

a {
  color: $upchieve-white;
}

.header {
  @include header-child;
  @include flex-container(row, center, center);
  color: $upchieve-white;
  background-color: $c-information-blue;

  &-message {
    & span {
      font-weight: 500;
    }
  }

  &-button {
    margin-left: auto;
    color: $c-soft-black;
    background-color: $upchieve-white;
    border: none;
    border-radius: 20px;
    padding: 0.4em 1.2em;
    font-weight: 600;
    @include flex-container(row, flex-start, center);

    &:hover {
      background-color: darken($upchieve-white, 5%);
    }
  }
}

.arrow-icon {
  fill: currentColor;
  height: 16px;
  width: 16px;
}
</style>
