<template>
  <form-page-template>
    <error-feedback>
      <login-form />
    </error-feedback>
  </form-page-template>
</template>

<script>
import FormPageTemplate from '@/components/FormPageTemplate'
import ErrorFeedback from '@/components/ErrorFeedback'

import LoginForm from './LoginForm'

export default {
  name: "login-view",
  components: {
    FormPageTemplate,
	ErrorFeedback,
	LoginForm
  }
}
</script>

<style lang="scss" scoped>
.alert {
  margin-bottom: 0;
}
</style>
