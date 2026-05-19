<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import FormInput from '@/components/FormInput.vue'
import Loader from '@/components/Loader.vue'
import { handleLogout } from '@/services/AuthService'
import NetworkService from '@/services/NetworkService'
import LargeButton from '@/components/LargeButton.vue'

const deleteInput = ref('')
const isLoading = ref(false)
const error = ref('')
const isDeleteConfirmed = ref(false)

const $router = useRouter()
const $store = useStore()
const mobileMode = computed(() => $store.getters['app/mobileMode'])

const emit = defineEmits(['enable-accept'])

watch(deleteInput, (newValue) => {
  isDeleteConfirmed.value = newValue.toLowerCase() === 'delete'
  emit('enable-accept', isDeleteConfirmed.value)
})

async function onAccept() {
  isLoading.value = true

  try {
    await NetworkService.deleteAccount()
  } catch {
    $store.dispatch('app/modal/update', {
      modalTemplateProps: { showTemplateButtons: false },
    })
    error.value =
      'Something went wrong. Please reach out to support to finish deleting your account.'
    return
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
    <div v-if="mobileMode" class="separator" />
    <div v-if="mobileMode" class="buttons-container">
      <large-button
        :variant="'danger'"
        :showArrow="false"
        @click="onAccept"
        :disabled="!isDeleteConfirmed"
      >
        {{ 'Delete Account' }}
      </large-button>
    </div>
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

.separator {
  border: 1px solid $c-border-grey;
  width: 100%;
  height: 1px;
  margin-top: 16px;
}

.buttons-container {
  @include flex-container(row, flex-end);
  @include child-spacing(left, 16px);
  margin-top: 8px;
}
</style>
