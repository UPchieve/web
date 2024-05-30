<template>
  <div id="verification-method-selector__container">
    <fieldset>
      <legend>How would you like to receive your verification code?</legend>
      <div class="radio-options">
        <div id="email-radio" class="radio-option">
          <input
            type="radio"
            id="email-option"
            data-testid="email-radio-option"
            name="verification-method"
            :value="VERIFICATION_METHOD.EMAIL"
            v-model="verificationInputs.method"
          />
          <label for="email-option">
            By email (<span class="ph-mask"
              ><strong>{{ email }}</strong></span
            >)
          </label>
        </div>
        <div id="sms-radio" class="radio-option">
          <input
            type="radio"
            id="sms-option"
            data-testid="sms-radio-option"
            name="verification-method"
            :value="VERIFICATION_METHOD.SMS"
            v-model="verificationInputs.method"
          />
          <label for="sms-option">By text message</label>
        </div>
      </div>
    </fieldset>
    <div
      id="phone-number-input-container"
      data-testid="phone-number-input-container"
      v-if="verificationInputs.method === VERIFICATION_METHOD.SMS"
    >
      <label for="phone-number-input">Enter your phone number</label>
      <maz-phone-number-input
        id="phone-number-input"
        class="ph-mask"
        required="true"
        v-model="phone"
        show-code-on-list
        @update="handlePhoneUpdate"
      />
    </div>
  </div>
</template>

<script>
import { VERIFICATION_METHOD } from '@/consts'
import MazPhoneNumberInput from 'maz-ui/components/MazPhoneNumberInput'

export default {
  components: {
    MazPhoneNumberInput,
  },
  props: {
    email: {
      type: String,
      required: true,
    },
    modelValue: {
      type: Object,
      required: true,
    },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      verificationInputs: {
        ...this.modelValue,
      },
      phone: '',
    }
  },
  methods: {
    handlePhoneUpdate($event) {
      this.verificationInputs = {
        ...this.verificationInputs,
        phoneInputInfo: $event,
      }
    },
  },
  watch: {
    verificationInputs: {
      handler(newVal) {
        this.$emit('update:modelValue', newVal)
      },
      deep: true,
    },
  },
  computed: {
    VERIFICATION_METHOD() {
      return VERIFICATION_METHOD
    },
  },
}
</script>

<style lang="scss" scoped>
#verification-method-selector__container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

#phone-number-input-container {
  margin-left: 16px;
}

.radio-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 16px;
}

.radio-option {
  display: flex;
  flex-direction: row;
  gap: 8px;

  label {
    margin-bottom: unset;
  }
}
</style>
