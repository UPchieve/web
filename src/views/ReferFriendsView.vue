<template>
  <div class="refer-friends">
    <h1 class="refer-friends__title">
      Help your friends level up with UPchieve!
    </h1>
    <p class="refer-friends__subtitle">
      UPchieve is a nonprofit that believes
      <span class="refer-friends__text--strong">all students</span> should have
      access to free, high-quality tutoring and college counseling. You can help
      us achieve our mission by referring your friends to UPchieve! Here’s how:
    </p>

    <h2 class="refer-friends__instructions">
      Instructions:
    </h2>

    <p class="refer-friends__text--strong">
      Step 1: Copy your unique sign-up link
    </p>

    <referral-link />

    <p class="refer-friends__step">
      <span class="refer-friends__text--strong">Step 2: Send the link</span>
      to any public high school student in the U.S.
    </p>

    <p class="refer-friends__step">
      <span class="refer-friends__text--strong">Step 3: Success!</span> Any
      student who uses your link will be able to create an account right away,
      skipping our eligibility check and our wait list.
    </p>

    <p class="refer-friends__step">
      <span class="refer-friends__text--rewards"
        >Rewards <span class="refer-friends__money-bag">💰</span></span
      ><br />
      If you refer 5 friends to UPchieve, we’ll send you a $25 gift card to any
      online site as a thank-you for helping us spread the word! We email gift
      cards out once a week on Mondays. If you have any questions or concerns,
      email us at
      <a href="mailto:students@upchieve.org">students@upchieve.org</a>.
    </p>

    <div class="refer-friends__progress">
      <span class="refer-friends__progress-title">Your progress</span>
      <div class="refer-friends__progress-bar">
        <div
          class="refer-friends__progress-bar--bg"
          :style="{
            width: Math.floor((referredFriendsBarLength / 5) * 100) + '%'
          }"
        ></div>
      </div>
      <span>{{ referredFriends.length }} out of 5 friends</span>
    </div>

    <p class="refer-friends__note">
      Note: No fakes! We will check if your referrals are real.
    </p>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import ReferralLink from '@/components/ReferralLink.vue'
import NetworkService from '@/services/NetworkService'

export default {
  name: 'ReferFriends',
  components: { ReferralLink },
  data() {
    return {
      selectedSubtopic: '',
      copyMessage: 'Copy',
      referredFriends: []
    }
  },
  async mounted() {
    const {
      data: { referredFriends }
    } = await NetworkService.getReferredFriends()
    this.referredFriends = referredFriends
  },
  computed: {
    ...mapGetters({ mobileMode: 'app/mobileMode' }),
    referredFriendsBarLength() {
      if (this.referredFriends.length > 5) return 5
      else return this.referredFriends.length
    }
  }
}
</script>

<style lang="scss" scoped>
h1,
h2,
p {
  margin: 0;
  padding: 0;
}

p {
  @include font-category('body');
}

.refer-friends {
  border-radius: 8px;
  background-color: #fff;
  padding: 1.8em 3em 3em;
  margin: 1em;
  text-align: left;

  @include breakpoint-above('medium') {
    max-width: 1000px;
    margin: 3em 3em 0 3em;
  }

  &__title {
    @include font-category('display-small');
    @include breakpoint-above('medium') {
      margin-top: 24px;
    }
    color: initial;
  }

  &__instructions {
    @include font-category('heading');
    font-weight: 700;
  }

  &__subtitle {
    @include font-category('body');
    margin-bottom: 2em;
    margin-top: 1em;
  }

  &__text--strong {
    font-weight: 600;
  }

  &__text--rewards {
    font-weight: 700;
  }

  &__survey-link {
    color: $c-success-green;
    text-decoration: underline;
  }

  &__step {
    margin-top: 2.2em;
  }

  &__note {
    font-style: italic;
  }

  &__money-bag {
    @include font-category('display-small');
  }

  &__progress {
    margin: 2em 0;
    @include flex-container(column);

    @include breakpoint-above('medium') {
      @include flex-container(row, flex-start, center);
    }

    &-title {
      @include breakpoint-above('medium') {
        margin-left: 4em;
      }

      font-weight: 600;
    }

    &-bar {
      width: 50%;
      border: none;
      border-radius: 10rem;
      height: 20px;
      grid-column-start: span 3;
      position: relative;
      background-color: $c-background-grey;
      margin: 1em 0;

      @include breakpoint-above('small') {
        width: 30%;
      }

      @include breakpoint-above('medium') {
        width: 20%;
        margin: 0 2em;
      }

      &--bg {
        width: 40%;
        background-color: $c-success-green;
        height: 100%;
        border-radius: 10rem;
      }

      &--number {
        color: white;
      }

      &--number-center {
        position: absolute;
        left: 0;
        right: 0;
        color: $c-soft-black;
      }
    }
  }
}
</style>
