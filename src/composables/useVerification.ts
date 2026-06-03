import { ref, computed, reactive } from 'vue'
import { useStore } from 'vuex'
import { parsePhoneNumber } from 'awesome-phonenumber'
import type { AxiosError } from 'axios'
import useVuelidate from '@vuelidate/core'
import {
  required,
  requiredIf,
  email as emailValidator,
  minLength,
  maxLength,
  helpers,
} from '@vuelidate/validators'
import type {
  CountryCode,
  Result as PhoneResults,
} from 'maz-ui/components/MazPhoneNumberInput'
import { EVENTS, VERIFICATION_METHOD, VERIFICATION_TYPE } from '@/consts'
import NetworkService from '@/services/NetworkService'
import AuthService from '@/services/AuthService'
import AnalyticsService from '@/services/AnalyticsService'

type UseVerificationPayload = {
  verificationType?: VERIFICATION_TYPE
  phone?: string
  forSignup?: boolean
}

export function useVerification(data: UseVerificationPayload = {}) {
  const store = useStore()

  const email = ref('')
  const phone = ref(data.phone ?? '')
  const phoneInput = ref<PhoneResults>({ isValid: false })
  const proxyEmail = ref('')
  const verificationCode = ref('')
  const verificationType = ref(data.verificationType ?? '')
  const hasResentCode = ref(false)
  const error = ref('')

  const isEmailVerificationType = computed(
    () =>
      verificationType.value === VERIFICATION_TYPE.EMAIL_FOR_SIGNUP ||
      verificationType.value === VERIFICATION_TYPE.EMAIL_FOR_EMAIL
  )

  const isProxyEmailVerificationType = computed(
    () => verificationType.value === VERIFICATION_TYPE.EMAIL_FOR_PROXY_EMAIL
  )

  const validationRules = {
    email: {
      required: requiredIf(() => isEmailVerificationType.value),
      email: helpers.withMessage('Not a valid email address', emailValidator),
    },
    proxyEmail: {
      required: requiredIf(() => isProxyEmailVerificationType.value),
      email: helpers.withMessage('Not a valid email address', emailValidator),
    },
    phone: {
      required: requiredIf(
        () => verificationType.value === VERIFICATION_TYPE.PHONE_NUMBER
      ),
    },
    verificationCode: {
      required: helpers.withMessage('Verification code is required', required),
      minLength: helpers.withMessage('Code must be 6 digits', minLength(6)),
      maxLength: helpers.withMessage('Code must be 6 digits', maxLength(6)),
      numeric: helpers.withMessage(
        'Code must be all numbers',
        (value: string) => /^\d+$/.test(value)
      ),
    },
  }

  const v$ = useVuelidate(
    validationRules,
    reactive({
      email,
      phone,
      proxyEmail,
      verificationCode,
    })
  )

  const isValidPhone = computed(() => phoneInput.value.isValid)
  const isValidVerificationCode = computed(
    () => !v$.value.verificationCode.$invalid
  )

  const isInternationalCountryCode = computed(
    () => phoneInput.value.countryCode !== 'US'
  )
  const internationalPhoneInfo = computed(() => {
    if (!phone.value) return { number: '', country: 'US' as CountryCode }

    const pn = parsePhoneNumber(phone.value)
    return {
      number: pn.number?.international,
      country: pn.regionCode as CountryCode,
    }
  })

  const mobileMode = computed(() => store.getters['app/mobileMode'])

  const isSendingCodeDisabled = computed(() => {
    switch (verificationType.value) {
      case VERIFICATION_TYPE.PHONE_NUMBER:
        return (
          !isValidPhone.value ||
          isInternationalCountryCode.value ||
          v$.value.phone.$error
        )

      case VERIFICATION_TYPE.EMAIL_FOR_SIGNUP:
      case VERIFICATION_TYPE.EMAIL_FOR_EMAIL:
        return v$.value.email.$invalid

      case VERIFICATION_TYPE.EMAIL_FOR_PROXY_EMAIL:
        return v$.value.proxyEmail.$invalid

      default:
        return true
    }
  })

  const verificationTarget = computed(() => {
    switch (verificationType.value) {
      case VERIFICATION_TYPE.PHONE_NUMBER:
        return {
          sendTo: phone.value,
          verificationMethod: VERIFICATION_METHOD.SMS,
        }
      case VERIFICATION_TYPE.EMAIL_FOR_SIGNUP:
      case VERIFICATION_TYPE.EMAIL_FOR_EMAIL:
        return {
          sendTo: email.value,
          verificationMethod: VERIFICATION_METHOD.EMAIL,
        }
      case VERIFICATION_TYPE.EMAIL_FOR_PROXY_EMAIL:
        return {
          sendTo: proxyEmail.value,
          verificationMethod: VERIFICATION_METHOD.EMAIL,
        }
      default:
        return {
          sendTo: email.value,
          verificationMethod: VERIFICATION_METHOD.EMAIL,
        }
    }
  })

  async function sendCode(isResending: boolean = false) {
    error.value = ''
    AnalyticsService.captureEvent(EVENTS.USER_CLICKED_SEND_VERIFICATION_CODE, {
      verificationMethod: verificationTarget.value.verificationMethod,
    })

    try {
      await NetworkService.sendVerification({
        sendTo: verificationTarget.value.sendTo,
        verificationMethod: verificationTarget.value.verificationMethod,
        verificationType: verificationType.value,
      })
      AnalyticsService.captureEvent(
        isResending
          ? EVENTS.VERIFICATION_CODE_RESENT
          : EVENTS.VERIFICATION_CODE_SENT,
        {
          verificationMethod: verificationTarget.value.verificationMethod,
        }
      )
    } catch (err) {
      error.value =
        ((err as AxiosError).response?.data as { err?: string })?.err ||
        'Unknown error'

      // eslint-disable-next-line preserve-caught-error
      throw new Error(error.value)
    }
  }

  function handleUserVerifiedUpdate() {
    let updates = {}
    if (verificationType.value === VERIFICATION_TYPE.PHONE_NUMBER)
      updates = {
        phone: phone.value,
        phoneVerified: true,
      }

    if (isEmailVerificationType.value || isProxyEmailVerificationType.value)
      updates = {
        email: isEmailVerificationType.value ? email.value : proxyEmail.value,
        emailVerified: true,
      }

    store.dispatch('user/addToUser', updates)
  }

  function onPhoneInputUpdate(data: PhoneResults) {
    phoneInput.value = data
  }

  async function resendCode() {
    await sendCode(true)
    hasResentCode.value = true
  }

  async function handleCodeConfirmation() {
    error.value = ''

    try {
      const {
        data: { success },
      } = await AuthService.confirmVerification({
        sendTo: verificationTarget.value.sendTo,
        verificationMethod: verificationTarget.value.verificationMethod,
        verificationType: verificationType.value,
        verificationCode: verificationCode.value,
        forSignup: data.forSignup ?? false,
      })
      AnalyticsService.captureEvent(EVENTS.VERIFICATION_CODE_CONFIRMED, {
        verificationMethod: verificationTarget.value.verificationMethod,
      })
      if (success) handleUserVerifiedUpdate()
      else
        throw new Error(
          'Please enter the most recent verification code that was sent to you'
        )
    } catch (err) {
      error.value =
        ((err as AxiosError).response?.data as { err?: string })?.err ||
        (err as Error).message ||
        'Unknown error'

      // eslint-disable-next-line preserve-caught-error
      throw new Error(error.value)
    }
  }

  function updateVerificationType(type: VERIFICATION_TYPE) {
    verificationType.value = type
  }

  return {
    email,
    phone,
    phoneInput,
    proxyEmail,
    verificationCode,
    hasResentCode,
    error,
    mobileMode,
    isValidVerificationCode,
    isSendingCodeDisabled,
    internationalPhoneInfo,

    sendCode,
    resendCode,
    handleCodeConfirmation,
    onPhoneInputUpdate,
    updateVerificationType,
  }
}
