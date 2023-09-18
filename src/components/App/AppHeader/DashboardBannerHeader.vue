<template>
  <div class="header">
    <div class="header-message">
      <span
        >UPchieve's Fall Challenge! You can earn $5 per week for having a
        session</span
      >
    </div>
    <a
      href="http://upchieve.org/upchieve-fall-challenge-2023"
      target="_blank"
      rel="noopener noreferrer"
      class="header-button"
    >
      Learn more 🎉
      <arrow-icon class="arrow-icon" />
    </a>
  </div>
</template>

<script>
import ArrowIcon from '@/assets/arrow.svg'
export default {
  name: 'dashboard-banner-header',
  components: { ArrowIcon },
}
</script>

<style lang="scss" scoped>
.header {
  @include header-child;
  color: $upchieve-white;
  display: flex;
  align-items: center;
  background-color: $c-information-blue;

  &-message {
    margin-left: auto;

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
  margin-left: 0.6em;
}
</style>
