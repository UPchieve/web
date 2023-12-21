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
            @change="
              $emit('change', {
                ...verificationInputs,
                method: $event.target.value,
              })
            "
          />
          <label for="email-option"
            >By email (<span class="ph-mask"
              ><strong>{{ email }}</strong></span
            >)</label
          >
        </div>
        <div id="sms-radio" class="radio-option">
          <input
            type="radio"
            id="sms-option"
            data-testid="sms-radio-option"
            name="verification-method"
            :value="VERIFICATION_METHOD.SMS"
            v-model="verificationInputs.method"
            @change="
              $emit('change', {
                ...verificationInputs,
                method: $event.target.value,
              })
            "
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
      <vue-phone-number-input
        id="phone-number-input"
        class="ph-mask"
        v-model="phone"
        required
        @update="
          $emit('change', { ...verificationInputs, phoneInputInfo: $event })
        "
        color="#555"
        valid-color="#16ba97"
      />
    </div>
  </div>
</template>

<script>
import { VERIFICATION_METHOD } from '@/consts'
import VuePhoneNumberInput from 'vue-phone-number-input'

export default {
  components: {
    VuePhoneNumberInput,
  },
  props: {
    email: {
      required: true,
    },
  },
  model: {
    event: 'change',
  },
  data() {
    return {
      verificationInputs: {
        method: VERIFICATION_METHOD.EMAIL,
        phoneInputInfo: {},
      },
      phone: '',
    }
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
