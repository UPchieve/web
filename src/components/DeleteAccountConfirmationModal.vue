<script lang="ts" setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import FormInput from '@/components/FormInput.vue'
import Loader from '@/components/Loader.vue'
import { handleLogout } from '@/services/AuthService'
import NetworkService from '@/services/NetworkService'

const deleteInput = ref('')
const isLoading = ref(false)
const error = ref('')

const $router = useRouter()
const $store = useStore()

const emit = defineEmits(['enable-accept'])

$store.dispatch('app/modal/update', { showTemplateButtons: false })

watch(deleteInput, (newValue) => {
  const isDeleteConfirmed = newValue.toLowerCase() === 'delete'
  emit('enable-accept', isDeleteConfirmed)
})

async function onAccept() {
  isLoading.value = true

  try {
    await NetworkService.deleteAccount()
  } catch {
    error.value =
      'Something went wrong. Please reach out to support to finish deleting your account.'
  }

  await handleLogout({ $router, $store }, '/logout?deleted=true')
}

defineExpose({
  onAccept,
})
</script>

<template>
  <div v-if="error">
    {{ error }}
  </div>

  <loader v-else-if="isLoading" overlay />

  <div v-else>
    <h1>Are you sure you would like to delete your account?</h1>

    <h2>⚠️ Warning: This action is immediate and <b>NOT REVERSIBLE</b> ⚠️</h2>

    <p>
      If you would just like to stop receiving texts and emails from us,
      consider deactivating your account instead.
    </p>

    <p>
      If you would like to continue with deleting your account, type "delete"
      into the input below to confirm deletion:
    </p>

    <form-input v-model="deleteInput" placeholder="Type 'delete' to continue" />
  </div>
</template>

<style lang="scss" scoped>
h1 {
  font-size: 24px;
  font-weight: normal;
}

h2 {
  font-size: 20px;
}
</style>
