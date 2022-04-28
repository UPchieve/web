<template>
  <div class="banner-backdrop">
    <div class="banner-template">
      <template v-if="mobileMode">
        <header class="banner-template-header">
          <cross-icon @click="onCancel" class="banner-template-close-button" />
        </header>
        <slot />
      </template>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import CrossIcon from '@/assets/cross.svg'

export default {
  name: 'BannerTemplate',
  components: { CrossIcon },
  computed: {
    ...mapGetters({ mobileMode: 'app/mobileMode' })
  },
  props: {
    onCancel: Function
  }
}
</script>

<style lang="scss" scoped>
.banner-backdrop {
  position: fixed;
  height: 100vh;
  width: 100%;
  background-color: rgba(0, 0, 0, 0.3);
  z-index: get-z('banner');
}

.banner-template {
  position: fixed;
  bottom: 0;
  width: 100%;
  padding: 2em;
  background-color: white;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;

  &-close-button {
    height: 20px;
    fill: $c-secondary-grey;
  }

  &-header {
    @include flex-container(row, flex-end);
    border-bottom: 1px solid $c-border-grey;
    padding-bottom: 1em;
    margin-bottom: 1.6em;
  }
}
</style>
