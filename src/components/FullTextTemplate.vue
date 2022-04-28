<template>
  <div class="full-text-template">
    <div v-if="headerTitle" class="full-text-template__header">
      {{ headerTitle }}
    </div>
    <div v-if="ledeText" class="full-text-template__lede">{{ ledeText }}</div>
    <div class="full-text-template__content">
      <slot />
    </div>
  </div>
</template>

<script>
export default {
  props: {
    headerTitle: {
      type: String,
      default: ''
    },
    ledeText: {
      type: String,
      default: ''
    }
  },
  data() {
    return {}
  },
  methods: {}
}
</script>

<style lang="scss" scoped>
.full-text-template {
  color: $c-soft-black;
  border-radius: 8px;
  background: white;
  margin: 10px;
  padding: 20px 15px;

  @include breakpoint-above('medium') {
    margin: 40px;
    padding: 40px;
  }

  &__header {
    font-size: 24px;
    font-weight: 500;
    text-align: left;
  }

  &__lede {
    text-align: left;
    font-size: 16px;
    margin: 10px 0;
  }

  &__content {
    margin: 40px 0 20px;
    text-align: left;
  }

  section {
    &:not(:last-of-type) {
      margin-bottom: 60px;
    }
  }

  h2 {
    font-weight: 500;
    font-size: 18px;
    margin: 0 0 15px;
  }

  p {
    margin-bottom: 20px;
  }

  .highlight {
    background: $c-background-blue;
    padding: 20px;
    border-radius: 4px;
  }
}
</style>
