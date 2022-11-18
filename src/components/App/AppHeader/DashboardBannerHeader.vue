<template>
  <div class="header">
    <!-- Edit the text below to display on dashboard banner to volunteers -->
    <div class="header-message">
      <span>We've revamped our English and College Advising training!</span>
    </div>
    <router-link to="/training" tag="button" class="header-button"
      >Get Certified by Dec 31st<arrow-icon class="arrow-icon"
    /></router-link>
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
