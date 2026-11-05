<script lang="ts" setup>
import Modal from '@/components/Modal.vue'
import ShareInfoFieldsForm from '@/components/ShareInfoFieldsForm.vue'
import { useProductFlagsStore } from '@/stores/product-flags'
import type { ShareableVolunteerData } from '@/utils/build-share-info-message'

const props = withDefaults(
  defineProps<{
    closeModal: () => void
    info: ShareableVolunteerData
    // Opened from the profile page: everything starts off there, and the
    // copy doesn't point back to the profile
    fromProfile?: boolean
  }>(),
  { fromProfile: false }
)

const productFlags = useProductFlagsStore()

// Closing without choosing saves nothing to the profile. Only a close on the
// dashboard stops it asking again; the profile callout stays either way.
function handleDismiss() {
  if (!props.fromProfile) productFlags.markShareInfoModalDismissed()
  props.closeModal()
}
</script>

<template>
  <modal :closeModal="handleDismiss">
    <div class="content">
      <h1>Help your students get to know you better!</h1>
      <p v-if="fromProfile">
        Turn on anything you'd like your students to see during sessions. You
        can change this anytime.
      </p>
      <p v-else>
        Here's what your students will see. Uncheck anything you'd rather keep
        private. You can change this anytime from
        <router-link :to="`/profile`">your profile</router-link>.
      </p>
    </div>
    <ShareInfoFieldsForm
      :info="info"
      :applyOptInDefaults="!fromProfile"
      @saved="props.closeModal"
    />
  </modal>
</template>

<style lang="scss" scoped>
h1 {
  font-size: 1.5rem;
  margin-top: 0;
}

:deep(.upc-modal-form) {
  max-width: 800px;
}
</style>
