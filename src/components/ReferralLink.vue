<template>
  <div class="referral-link" @click="copyLink">
    <input
      type="text"
      :value="referralLink"
      class="referral-link__link"
      disabled
    />
    <span class="referral-link__copy-message">
      {{ copyMessage }}
    </span>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import config from '@/config'

export default {
  data() {
    return {
      selectedSubtopic: '',
      copyMessage: 'Copy'
    }
  },
  computed: {
    ...mapState({
      user: state => state.user.user
    }),
    referralLink() {
      const { referralCode } = this.user
      if (process.env.NODE_ENV === 'development') {
        return `http://localhost:8080/referral/${referralCode}`
      } else {
        return `${config.serverRoot}/referral/${referralCode}`
      }
    }
  },

  methods: {
    async copyLink() {
      if (!navigator.clipboard) {
        return
      }
      try {
        await navigator.clipboard.writeText(this.referralLink)
        this.copyMessage = 'Copied'
        setTimeout(() => {
          this.copyMessage = 'Copy'
        }, 3000)
      } catch (error) {
        this.copyMessage = 'Copy'
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.referral-link {
  @include flex-container(row, space-between, center);
  border: 1px solid $c-border-grey;
  border-radius: 8px;
  padding: 0.4em 1em;
  align-self: center;
  margin: 2.4em auto;
  width: 90%;

  @include breakpoint-above('medium') {
    width: 80%;
  }

  &__link {
    text-overflow: ellipsis;
    padding-right: 2em;
    cursor: pointer;
    border: 0;
    width: 100%;
    background-color: transparent;
    @include font-category('body');

    @include breakpoint-above('medium') {
      text-overflow: initial;
      padding-right: 1em;
    }
  }

  &__copy-message {
    margin: 0;
    padding: 0;
    cursor: pointer;
    color: $c-success-green;
    @include font-category('body');
  }
}
</style>
