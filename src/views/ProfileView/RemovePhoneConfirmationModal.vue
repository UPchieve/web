<template>
  <div data-testid="remove-phone-confirmation-modal">
    <Modal back-text="Cancel" :close-modal="onCancel">
      <div
        v-if="error"
        data-testid="remove-phone-error"
        class="alert alert-danger"
        role="alert"
      >
        {{ error }}
      </div>
      <p class="uc-form-header">
        Are you sure you want to remove your phone number from your account?
      </p>
      <div class="remove-phone-modal-buttons-container">
        <button
          class="uc-form-button"
          data-testid="remove-phone-accept-btn"
          @click="deletePhoneInfo"
        >
          Yes, remove it
        </button>
        <button
          class="uc-form-button-secondary"
          data-testid="remove-phone-cancel-btn"
          @click="onCancel"
        >
          Cancel
        </button>
      </div>
    </Modal>
  </div>
</template>
<script>
import Modal from '@/components/Modal.vue'
import NetworkService from '@/services/NetworkService'
import { mapState } from 'vuex'

export default {
  name: 'RemovePhoneConfirmationModal',
  components: { Modal },
  props: {
    onCancel: {
      type: Function,
      required: true,
    },
    onAccept: {
      type: Function,
      required: true,
    },
  },
  data() {
    return {
      error: '',
    }
  },
  computed: {
    ...mapState({
      user: (state) => state.user.user,
    }),
  },
  methods: {
    async deletePhoneInfo() {
      let res
      try {
        res = await NetworkService.deletePhone(this.user.id)
        if (res.status !== 200) {
          throw new Error()
        }
        await this.$store.dispatch('user/addToUser', {
          phone: null,
          smsConsent: null,
          phoneVerified: false,
        })
        this.onAccept()
      } catch (err) {
        this.error =
          err.response?.data?.err ??
          'Something went wrong. Please try again, or contact us at support@upchieve.org for help.'
      }
    },
  },
}
</script>
<style lang="scss" scoped>
.remove-phone-modal-buttons-container {
  padding-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  .uc-form-button {
    margin-top: 0;
  }

  .uc-form-button-secondary {
    width: 100%;
  }
}
</style>
