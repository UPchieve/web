<template>
  <div>
    <div class="switch-role-button" type="button" @click="switchRole">
      <span>{{ message }}</span>
    </div>
    <Modal class="error-switching-modal" v-if="error">
      {{ error }}
      <LargeButton @click="closeErrorModal"> OK </LargeButton>
    </Modal>
  </div>
</template>

<script lang="ts" setup>
import NetworkService from '@/services/NetworkService'
import { useRouter } from 'vue-router'
import { computed, ref } from 'vue'
import LoggerService from '@/services/LoggerService'
import Modal from '@/components/Modal.vue'
import LargeButton from '@/components/LargeButton.vue'
import { useStore } from 'vuex'

const props = defineProps<{
  userType: 'student' | 'volunteer'
  userId: string
  message?: string
}>()

const router = useRouter()
const store = useStore()
const error = ref<string>('')
const alternateRole = computed(() =>
  props.userType === 'student' ? 'Volunteer' : 'Student'
)

const message = computed(() => {
  return props.message ?? `Switch to ${alternateRole.value} View`
})

const switchRole = async () => {
  try {
    const response = await NetworkService.switchActiveRole(
      props.userType === 'volunteer' ? 'student' : 'volunteer'
    )
    const { user } = response.data
    store.commit('user/updateUser', user)

    if (router.currentRoute.value.path === '/dashboard') router.go(0)
    else await router.replace('/dashboard')
  } catch (err) {
    LoggerService.noticeError(
      err?.response?.data?.err ?? 'Error while switching account modes',
      { userId: props.userId }
    )
    error.value =
      'Something went wrong while switching account modes. Please refresh the page and try again, or reach out to support@upchieve.org for help.'
  }
}

const closeErrorModal = () => {
  error.value = ''
}
</script>

<style lang="scss">
.error-switching-modal {
  .upc-modal-form {
    gap: 18px;
  }
}

.switch-role-button {
  span {
    color: $c-information-blue;
  }
}
</style>
