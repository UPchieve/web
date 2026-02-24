<script lang="ts" setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FormInput from '@/components/FormInput.vue'
import FormPageTemplate from '@/components/FormPageTemplate.vue'
import NetworkService from '@/services/NetworkService'

const router = useRouter()
const route = useRoute()
const token = ref('')
const error = ref('')
const isSubmitting = ref(false)

async function verify() {
  if (token.value.length !== 6) {
    error.value = 'Please enter a 6-digit code'
    return
  }

  isSubmitting.value = true
  error.value = ''

  try {
    const res = await NetworkService.totpVerify(token.value)
    if (res.data.verified) {
      const redirect = route.query.redirect as string
      router.push(redirect ?? '/admin')
    } else {
      error.value = 'Invalid code. Please try again.'
      token.value = ''
    }
  } catch {
    error.value = 'Something went wrong. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <form-page-template>
    <div class="uc-form">
      <h1 class="uc-form-header">Two-Factor Authentication</h1>
      <p class="instructions">
        Enter the 6-digit code from your authenticator app to continue.
      </p>

      <div v-if="error" class="alert alert-danger" role="alert">
        {{ error }}
      </div>

      <form @submit.prevent="verify" autocomplete="off">
        <form-input
          v-model="token"
          type="text"
          placeholder="Enter 6-digit code"
        />

        <button
          type="submit"
          class="uc-form-button"
          :disabled="isSubmitting || token.length !== 6"
        >
          Verify
        </button>
      </form>
    </div>
  </form-page-template>
</template>

<style lang="scss" scoped>
.instructions {
  color: $c-secondary-grey;
  margin-bottom: 20px;
}

.alert {
  margin-bottom: 20px;
  &.alert-danger {
    color: $c-error-red;
  }
}
</style>
