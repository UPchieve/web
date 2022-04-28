<template>
  <div class="OnboardingModal">
    <div class="OnboardingModal-title-container">
      <h1 class="OnboardingModal-title">Woohoo! Your account is verified.</h1>
      <p class="OnboardingModal-subtitle">
        There are just two steps left to complete before you can begin helping
        students:
      </p>
    </div>
    <div class="OnboardingModal-message"></div>
    <div class="OnboardingModal-steps-container">
      <div>
        <img
          src="@/assets/onboarding_icons/calendar-icon.png"
          class="OnboardingModal-icon"
        />
        <h4>Select availability</h4>
        <p>
          Select at least one hour of availability so that we know when we can
          text you.
        </p>
      </div>
      <div>
        <img
          src="@/assets/onboarding_icons/quiz-icon.png"
          class="OnboardingModal-icon"
        />
        <h4>Get a certification</h4>
        <p>
          Pass at least one quiz so that we know what subjects you can help
          students with.
        </p>
      </div>
    </div>
    <large-button v-if="mobileMode" primary @click.native="onAccept">
      {{ modalData.acceptText }}
    </large-button>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import LargeButton from '@/components/LargeButton'

export default {
  components: { LargeButton },
  props: {
    modalData: { type: Object, required: true }
  },
  computed: {
    ...mapGetters({
      mobileMode: 'app/mobileMode'
    })
  },
  methods: {
    onAccept() {
      this.$store.dispatch('user/firstDashboardVisit', false)
      this.$router.push('/calendar')
    }
  }
}
</script>

<style lang="scss" scoped>
.OnboardingModal {
  @include flex-container(column);
  @include child-spacing(top, 24px);
  @include breakpoint-above('medium') {
    @include child-spacing(top, 16px);
  }
}

.OnboardingModal-title {
  @include font-category('display-small');
  @include breakpoint-above('medium') {
    margin-top: 24px;
  }
}

.OnboardingModal-message {
  @include font-category('body');
}

.OnboardingModal-title-container {
  margin: 0 auto;
  width: 80%;
}

.OnboardingModal-subtitle {
  font-size: 16px;
  color: $c-secondary-grey;
}

.OnboardingModal-icon {
  width: 100px;
  margin-bottom: 0.6em;
}

.OnboardingModal-steps-container {
  display: flex;
  justify-content: space-around;
}
</style>
