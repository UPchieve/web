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
      <p class="uc-form-header">Are you sure?</p>
      <p data-testid="confirmation-message">
        {{
          isVolunteer
            ? 'Without a phone number you will no longer receive text notifications during your availability time.'
            : 'Your phone number will be removed from your account.'
        }}
      </p>
      <div class="remove-phone-modal-buttons-container">
        <button
          class="uc-form-button-secondary"
          data-testid="remove-phone-cancel-btn"
          @click="onCancel"
        >
          Cancel
        </button>
        <button
          class="uc-form-button"
          data-testid="remove-phone-accept-btn"
          @click="deletePhoneInfo"
        >
          Delete
        </button>
      </div>
    </Modal>
  </div>
</template>
<script>
import Modal from '@/components/Modal.vue'
import NetworkService from '@/services/NetworkService'
import { mapState, mapGetters } from 'vuex'

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
    ...mapGetters({
      isVolunteer: 'user/isVolunteer',
    }),
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
  flex-direction: row;
  gap: 16px;

  .uc-form-button {
    margin-top: 0;
    background-color: $c-error-red;
  }

  .uc-form-button-secondary {
    width: 100%;
  }
}
</style>
