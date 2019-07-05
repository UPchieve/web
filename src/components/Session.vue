<template>
  <error-feedback>
    <session-page />
  </error-feedback>
</template>

<script>
import SessionPage from './SessionPage'
import ErrorFeedback from './ErrorFeedback'

export default {
  components: {
    ErrorFeedback,
    SessionPage
  }
}
</script>
