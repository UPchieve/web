<script lang="ts" setup>
import { computed, onBeforeMount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import AnalyticsService from '@/services/AnalyticsService'
import AuthService, { getStatus } from '@/services/AuthService'
import FeatureFlagService from '@/services/FeatureFlagService'
import LoggerService from '@/services/LoggerService'
import NetworkService from '@/services/NetworkService'
import FormEmail from '@/components/FormEmail.vue'
import FormErrors from '@/components/FormErrors.vue'
import FormInput from '@/components/FormInput.vue'
import FormPageTemplate from '@/components/FormPageTemplate.vue'
import Loader from '@/components/Loader.vue'
import useVuelidate from '@vuelidate/core'
import { EVENTS } from '@/consts'

const $store = useStore()
const $route = useRoute()
const $router = useRouter()

const authenticatedUserEmail = ref<string>($store.state.user.user?.email)
const verifyUser = ref<boolean>(!!authenticatedUserEmail.value)

const errorMessage = ref<string>('')
const email = ref<string | undefined>($route.query.email as string)
const referralCode = ref<string | undefined>($route.query.referral as string)
const inviteCode = ref<string | undefined>(
  ($route.params.inviteCode as string)?.toUpperCase()
)
const askForInviteCode = ref<boolean>(!inviteCode.value)
const isLoading = ref(true)
const team = ref<{ name: string; closedAt?: string | null }>({ name: '' })
const isSignedIn = computed(() => !!$store.state.user.user?.id)

const v$ = useVuelidate()
const isDisabled = computed(() => {
  return v$.value.$error || !!v$.value.$silentErrors?.length
})

onBeforeMount(async () => {
  FeatureFlagService.setPersonPropertiesForFlags({
    cohort: 'joining-nths-group',
  })

  // The router checks auth only on protected routes, so opening an invite link
  // directly arrives without the signed-in user.
  if (!$store.state.user.user?.id) {
    try {
      const { authenticated } = await getStatus()
      if (authenticated) {
        await $store.dispatch('user/fetchUser')
        authenticatedUserEmail.value = $store.state.user.user?.email
        verifyUser.value = !!authenticatedUserEmail.value
      }
    } catch (err) {
      LoggerService.noticeError(err)
    }
  }

  // ensure we have a user before making this call,
  // otherwise we get `Not Authorized` and are redirected to /login
  if ($store.state.user.user.id) {
    // Redirect to group page if user is already in a group
    await $store.dispatch('nths/fetchNthsData')
  }
  if ($store.state.nths.NTHSGroups.length) {
    $router.replace('/groups')
  }

  if (inviteCode.value) {
    try {
      const results = await NetworkService.getNTHSGroupByCode(inviteCode.value)
      team.value = results.data.NTHSGroup
    } catch (err) {
      const is4xxError =
        err?.response.status >= 400 && err?.response.status < 500
      if (is4xxError && err.response?.data?.err) {
        errorMessage.value = err.response?.data?.err
      } else {
        errorMessage.value =
          'Something went wrong. Please refresh the page and try again.'
      }
    } finally {
      isLoading.value = false
    }
  }
  if (email.value && inviteCode.value && !team.value.closedAt) {
    await addVolunteerToTeam()
  }
})

function removeTeam() {
  askForInviteCode.value = true
  inviteCode.value = ''
  team.value = { name: '' }
  $router.replace('/join-team')
}

async function removeUser() {
  await AuthService.logout(
    {
      router: $router,
      store: $store,
    },
    `/join-team/${inviteCode.value ?? ''}`
  )
  // Force reload page to avoid invalid CSRF token error.
  $router.go(0)
}

function confirmUser() {
  email.value = authenticatedUserEmail.value
  verifyUser.value = false
}

function loginPath(
  data: Record<string, string>,
  extra: Record<string, string> = {}
) {
  const redirectUriParams = new URLSearchParams({
    redirect: `/join-team/${inviteCode.value}?${new URLSearchParams(data).toString()}`,
    ...extra,
  })
  return '/login?' + redirectUriParams.toString()
}

const closedLoginPath = computed(() =>
  loginPath({
    inviteCode: inviteCode.value as string,
    ...(referralCode.value ? { referral: referralCode.value } : {}),
  })
)

async function addVolunteerToTeam() {
  isLoading.value = true

  AnalyticsService.captureEvent(EVENTS.VOLUNTEER_CLICKED_JOIN_TEAM, {
    inviteCode: inviteCode.value,
  })

  try {
    const response = await NetworkService.joinVolunteerToNTHSGroup({
      email: email.value,
      inviteCode: inviteCode.value,
    })

    if (response.data.groups) {
      AnalyticsService.captureEvent(EVENTS.VOLUNTEER_JOINED_TEAM, {
        inviteCode: inviteCode.value,
      })
      await $store.commit('nths/setNTHSGroups', response.data.groups)
      return $router.push(`/dashboard?inviteCode=${inviteCode.value}`)
    }

    const data = {
      email: email.value as string,
      inviteCode: inviteCode.value as string,
      ...(referralCode.value ? { referral: referralCode.value } : {}),
    }
    if (response.data.isExistingVolunteer) {
      AnalyticsService.captureEvent(
        EVENTS.VOLUNTEER_JOIN_TEAM_REDIRECT_TO_LOGIN,
        {
          inviteCode: inviteCode.value,
        }
      )
      $router.push(
        loginPath(data, {
          email: email.value as string,
          message: 'Sign in to finish joining your team!',
        })
      )
    } else {
      AnalyticsService.captureEvent(
        EVENTS.VOLUNTEER_JOIN_TEAM_REDIRECT_TO_SIGN_UP,
        {
          inviteCode: inviteCode.value,
        }
      )
      $router.push({
        name: 'SignupView',
        params: {
          userType: 'volunteer',
          step: 'account',
        },
        query: data,
      })
    }
  } catch (err) {
    const is4xxError = err.response?.status >= 400 && err.response?.status < 500
    if (is4xxError && err.response?.data?.err) {
      errorMessage.value = err.response?.data.err
    } else {
      errorMessage.value =
        'Something went wrong. Please refresh the page and try again.'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <form-page-template>
    <loader v-if="isLoading" overlay />

    <form-errors v-if="errorMessage" :errors="[errorMessage]" />

    <div v-if="team.closedAt && !isLoading" data-testid="chapter-closed">
      <h1>{{ team.name }} isn't accepting new members</h1>
      <p class="mt-4">
        Thanks so much for your interest in {{ team.name }}. Unfortunately, this
        chapter isn't accepting new members right now.
      </p>
      <template v-if="isSignedIn">
        <p class="mt-4">
          Still interested in tutoring and earning volunteer hours?
        </p>
        <button
          type="button"
          class="uc-form-button"
          data-testid="button-go-to-dashboard"
          v-ph:nths="'join_closed.dashboard'"
          @click="$router.push('/dashboard')"
        >
          Tutoring dashboard
        </button>
      </template>
      <template v-else>
        <p class="mt-4">
          You can still earn volunteer hours by tutoring on UPchieve!
        </p>
        <p class="mt-2">✅ 100% flexible schedule</p>
        <p>✅ No experience required</p>
        <p class="mt-2">
          Choose from 30+ subjects to tutor, including 6th Grade Math, Reading,
          Middle School Science, and more. Earn verified volunteer hours and
          make a real impact in your downtime.
        </p>
        <button
          type="button"
          class="uc-form-button"
          data-testid="button-sign-up"
          v-ph:nths="'join_closed.sign_up'"
          @click="
            $router.push({
              path: '/sign-up/volunteer',
              query: referralCode ? { referral: referralCode } : {},
            })
          "
        >
          Sign up as a coach
        </button>
        <p class="sub mt-3">
          Already have an account?
          <router-link
            class="uc-link"
            data-testid="link-log-in"
            v-ph:nths="'join_closed.log_in'"
            :to="closedLoginPath"
            >Log in</router-link
          >
        </p>
      </template>
      <p class="sub mt-3">
        <a
          class="uc-link"
          data-testid="link-not-your-team"
          v-ph:nths="'join_closed.different_code'"
          @click="removeTeam"
          >Not your team? Enter a different code</a
        >
      </p>
    </div>

    <template v-else>
      <h1>Join {{ team.name }}</h1>

      <div v-if="verifyUser && !isLoading" class="center">
        <p class="mt-4">This device is currently logged in as:</p>
        <p class="bold">{{ authenticatedUserEmail }}</p>
        <p class="mt-3">If this is you, press continue.</p>
        <p class="mt-3">
          <a class="mt-3 uc-link" @click="removeUser"
            >I don't recognize this account.</a
          >
        </p>
        <button type="button" class="uc-form-button" @click="confirmUser">
          Continue
        </button>
      </div>

      <div v-else-if="!isLoading">
        <FormInput
          v-if="askForInviteCode"
          class="mt-3"
          v-model="inviteCode"
          name="inviteCode"
          label="Team Code"
          placeholder="Team Code"
          :blur-event="EVENTS.VOLUNTEER_ENTERED_TEAM_CODE"
          :is-required="askForInviteCode"
          testid="input-class-code"
        />
        <div v-else class="uc-row mt-2">
          <p class="sub" data-testid="text-team-code">
            Team code: <span class="bold">{{ inviteCode }}</span>
          </p>
          <a
            class="uc-link ml-4"
            data-testid="link-not-your-team"
            @click="removeTeam"
            >Not your team?</a
          >
        </div>

        <FormEmail
          v-if="!authenticatedUserEmail"
          class="mt-3"
          v-model="email"
          :blur-event="EVENTS.VOLUNTEER_ENTERED_EMAIL_ON_JOIN_TEAM"
          testid="input-email"
        />

        <button
          class="uc-form-button"
          type="submit"
          @click="addVolunteerToTeam"
          :disabled="isDisabled"
          data-testid="button-submit"
        >
          Continue
        </button>
      </div>
    </template>
  </form-page-template>
</template>

<style lang="scss" scoped>
form-page-template {
  padding: 50px;
}
h1 {
  font-size: 2rem;
  max-width: 750px;
}

p {
  color: #343440;
  margin-bottom: 0;
}

p.sub {
  color: #666f7d;
}

.uc-form-button {
  margin-top: 3rem;
}
</style>
