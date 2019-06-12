<template>
  <div class="submit-question">
    <div class="basic-template">
      <content-header :header-title="headerTitle" />
      <div class="basic-template__content">
        <div class="content-card">
          <div class="content-card__card">
            <slot />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ContentHeader from '../atoms/ContentHeader'

export default {
  components: {
    ContentHeader
  },
  props: {
    headerTitle: {
      type: String,
      default: ''
    }
  },
  data () {
    return {}
  },
  methods: {
    goHome () {
      this.$router.push('/')
    }
  }
}
</script>

<style lang="scss">
.submit-question {
  height: 100vh;
}

.basic-template {
  min-height: 100vh;
  background: $c-backdrop;
}
.basic-template__content {
}

.content-card {
  padding: 80px 0;
  width: 100%;
}
.content-card__card {
  background: #fff;
  width: 80%;
  max-width: 700px;
  padding: 40px;
  box-shadow: -4px 4px $c-shadow;
  margin: auto;
}
</style>
