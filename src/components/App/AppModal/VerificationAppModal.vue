<script lang="ts" setup>
import { VERIFICATION_METHOD } from '@/consts'
import { computed } from 'vue'
import { useStore } from 'vuex'
import VerificationModal from '@/views/VerificationModal.vue'

const store = useStore()
const email = computed(() => store.state.user.user.email)
const showVerificationModal = computed(() => {
  return (
    store.state.app.modal.isShown &&
    store.state.app.modal.component === 'VerificationAppModal'
  )
})
function closeModal() {
  store.dispatch('app/modal/hide')
}
</script>

<template>
  <VerificationModal
    v-if="showVerificationModal"
    :close-modal="closeModal"
    :verification-method="VERIFICATION_METHOD.EMAIL"
    :phone-or-email-to-verify="email"
  />
</template>
