<template>
  <error-feedback>
    <session-page />
  </error-feedback>
</template>

<script>
import SessionPage from './SessionPage'
import ErrorFeedback from '@/components/ErrorFeedback'

export default {
  name: "session-view",
  components: {
    ErrorFeedback,
    SessionPage
  }
}
</script>