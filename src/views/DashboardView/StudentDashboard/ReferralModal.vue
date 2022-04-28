<template>
  <div class="ReferralModal">
    <component v-if="!mobileMode" :is="modalData.svg" class="icon" />
    <h1 class="ReferralModal-title">Invite Your Friends</h1>
    <h2 class="ReferralModal-subtitle">
      Sharing is caring! Your friends can create their very own UPchieve account
      using the link below.
    </h2>

    <div>
      <h4>Share link</h4>
      <referral-link />
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import ReferralLink from '@/components/ReferralLink.vue'

export default {
  components: { ReferralLink },
  props: {
    modalData: { type: Object, required: true }
  },
  data() {
    return {
      selectedSubtopic: '',
      copyMessage: 'Copy'
    }
  },
  computed: {
    ...mapGetters({ mobileMode: 'app/mobileMode' })
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

.icon {
  align-self: center;
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
  @include font-category('body');
  color: $c-secondary-grey;
}
</style>
