<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import QRCodeStyling from 'qr-code-styling'
import FormInput from '@/components/FormInput.vue'
import FormPageTemplate from '@/components/FormPageTemplate.vue'
import Loader from '@/components/Loader.vue'
import NetworkService, { type NetworkError } from '@/services/NetworkService'

const router = useRouter()
const token = ref('')
const error = ref('')
const isLoading = ref(true)
const qrElement = ref<any>(null)

onMounted(async () => {
  try {
    const {
      data: { qrUrl },
    } = await NetworkService.totpEnroll()

    const qrCode = new QRCodeStyling({
      width: 200,
      height: 200,
      data: qrUrl,
      dotsOptions: {
        color: '#000',
        type: 'rounded',
      },
      backgroundOptions: {
        color: '#fff',
      },
    })
    if (qrElement.value) {
      qrCode.append(qrElement.value)
    } else {
      error.value =
        'Failed to generate QR code. Please refresh the page and try again.'
    }
  } catch (e) {
    error.value = (e as NetworkError).message
  } finally {
    isLoading.value = false
  }
})

async function submit() {
  if (token.value.length !== 6) {
    error.value = 'Please enter a 6-digit code'
    return
  }

  isLoading.value = true
  error.value = ''

  try {
    const res = await NetworkService.totpVerify(token.value)
    if (res.data.verified) {
      router.push('/dashboard')
    } else {
      error.value = 'Invalid code. Please try again.'
      token.value = ''
    }
  } catch {
    error.value = 'Something went wrong. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <form-page-template>
    <div class="uc-form">
      <h1 class="uc-form-header">Set Up Two-Factor Authentication</h1>

      <loader v-if="isLoading" class="loading" overlay />

      <div v-if="error" class="alert alert-danger" role="alert">
        {{ error }}
      </div>

      <div class="instructions">
        <p>
          <strong>Step 1:</strong> Scan this QR code with your authenticator app
          (such as 1Password or Google Authenticator).
        </p>
      </div>

      <div class="qr-container">
        <div ref="qrElement" class="qr-code"></div>
      </div>

      <div class="instructions">
        <p>
          <strong>Step 2:</strong> Enter the 6-digit code from your
          authenticator app to complete setup.
        </p>
      </div>

      <form @submit.prevent="submit" autocomplete="off">
        <form-input
          v-model="token"
          type="text"
          placeholder="Enter 6-digit code"
        />

        <button
          type="submit"
          class="uc-form-button"
          :disabled="isLoading || token.length !== 6"
        >
          Submit
        </button>
      </form>
    </div>
  </form-page-template>
</template>

<style lang="scss" scoped>
.loading {
  align-self: center;
  height: 100%;
}

.instructions {
  margin-bottom: 20px;
  color: $c-secondary-grey;

  p {
    margin: 0;
  }
}

.qr-container {
  display: flex;
  justify-content: center;
  margin: 20px 0 30px;
}

.alert {
  margin-bottom: 20px;
  &.alert-danger {
    color: $c-error-red;
  }
}
</style>
