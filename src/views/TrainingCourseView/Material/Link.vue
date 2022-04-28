<template>
  <div class="link">
    <a :href="linkUrl" target="_blank">{{ label }} <arrow-icon /></a>
  </div>
</template>

<script>
import ArrowIcon from '@/assets/arrow.svg'

export default {
  components: {
    ArrowIcon
  },
  props: {
    linkUrl: String,
    label: String
  }
}
</script>

<style lang="scss" scoped>
.link {
  display: flex;

  a {
    text-decoration: none;
    color: $c-success-green;
    display: flex;
    flex-direction: row;
    align-items: center;
    font-size: 16px;

    &:hover {
      color: darken($color: $c-success-green, $amount: 5%);
      svg {
        fill: darken($color: $c-success-green, $amount: 5%);
      }
    }

    svg {
      fill: $c-success-green;
      width: 24px;
      padding-left: 7px;
    }
  }
}
</style>
