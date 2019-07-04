<template>
  <div class="main-page">
    <error-feedback>
      <debug-sentry-form />
    </error-feedback>
  </div>
</template>

<script>
import ErrorFeedback from './ErrorFeedback'
import DebugSentryForm from './DebugSentry/Form'

export default {
  components: {
    ErrorFeedback,
    DebugSentryForm
  }
}
</script>

<style lang="scss" scoped>
.main-page {
  width: 100%;
  height: 100%;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
