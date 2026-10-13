<script lang="ts" setup>
import { useAppModalStore } from '@/stores/app/modal'
import { VERIFICATION_METHOD } from '@/consts'
import { computed } from 'vue'
import { useStore } from 'vuex'
import VerificationModal from '@/views/VerificationModal.vue'

const store = useStore()

const modalStore = useAppModalStore()
const email = computed(() => store.state.user.user.email)
const showVerificationModal = computed(() => {
  return modalStore.isShown && modalStore.component === 'VerificationAppModal'
})
function closeModal() {
  modalStore.hide()
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
