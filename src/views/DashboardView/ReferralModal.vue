<template>
  <div class="ReferralModal">
    <updog-star class="icon" />
    <h1 class="ReferralModal-title">
      {{ headerText }}
    </h1>
    <p class="ReferralModal-subtitle">
      {{ bodyText }}
    </p>

    <div>
      <h4 class="share-link">Share link</h4>
      <referral-link />
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import ReferralLink from '@/components/ReferralLink.vue'
import UpdogStar from '@/assets/updog-star.svg'

export default {
  components: { ReferralLink, UpdogStar },
  computed: {
    ...mapGetters({
      mobileMode: 'app/mobileMode',
      isStudent: 'user/isStudent',
      isVolunteer: 'user/isVolunteer',
    }),
    headerText() {
      return 'Invite Your Friends'
    },
    bodyText() {
      if (this.isStudent) {
        return 'Sharing is caring! Your friends can create their very own UPchieve account using the link below.'
      }
      if (this.isVolunteer) {
        return 'Do you have a friend who would enjoy tutoring on UPchieve? Send them an invite to sign-up using your special link below!'
      }
      return 'Your friends can create their very own UPchieve account using the link below.'
    },
  },
}
</script>

<style lang="scss" scoped>
h1,
h2,
p {
  margin: 0;
  padding: 0;
}

.icon {
  align-self: center;
  height: fit-content;
  width: 50%;
}

.ReferralModal {
  @include flex-container(column);
  @include child-spacing(top, 24px);
  @include breakpoint-above('medium') {
    @include child-spacing(top, 16px);
  }
}

.ReferralModal-title {
  @include font-category('display-small');
  @include breakpoint-above('medium') {
    margin-top: 24px;
  }
}

.ReferralModal-subtitle {
  @include font-category('heading');
  color: $c-secondary-grey;
}

.share-link {
  font-size: 14px;
  margin-top: 30px;
  margin-bottom: -30px;
}
</style>
