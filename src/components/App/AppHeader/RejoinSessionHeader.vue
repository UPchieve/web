<template>
  <div :class="isNewHeader.class">
    <template v-if="mobileMode">
      <hyperlink-button primary reverse @click.native="showModal">{{
        message
      }}</hyperlink-button>
    </template>

    <template v-else>
      <div class="RejoinSessionHeader-left" />
      <div class="RejoinSessionHeader-message">{{ message }}</div>
      <div class="RejoinSessionHeader-buttons">
        <hyperlink-button reverse @click.native="end"
          >End chat</hyperlink-button
        >
        <large-button
          primary
          reverse
          @click.native="rejoin"
          :class="isNewHeader.buttonClass"
          >Return to chat</large-button
        >
      </div>
    </template>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import * as sessionUtils from '@/utils/session'
import HyperlinkButton from '@/components/HyperlinkButton'
import LargeButton from '@/components/LargeButton'

export default {
  name: 'rejoin-session-header',
  components: { HyperlinkButton, LargeButton },
  computed: {
    ...mapGetters({
      mobileMode: 'app/mobileMode',
      avatarUrl: 'user/avatarUrl',
      name: 'user/firstName',
      sessionPath: 'user/sessionPath',
      isDashboardRedesignActive: 'featureFlags/isDashboardRedesignActive'
    }),
    message() {
      return `You have a chat in session${this.mobileMode ? '' : '.'}`
    },
    isNewHeader() {
      const status = {
        class: 'RejoinSessionHeader',
        buttonClass: ''
      }

      if (this.isDashboardRedesignActive) {
        status.class += '--redesign'
        status.buttonClass += 'RejoinSessionHeader-buttons--redesign'
      }

      return status
    }
  },
  methods: {
    showModal() {
      this.$store.dispatch('app/modal/show', {
        component: 'RejoinSessionModal',
        data: { backText: 'Dashboard', important: true }
      })
    },
    rejoin() {
      sessionUtils.rejoinSession(this.$router, this.sessionPath)
    },
    end() {
      sessionUtils.endSession(this)
    }
  }
}
</script>

<style lang="scss" scoped>
.RejoinSessionHeader {
  @include flex-container(row, center, center);
  flex: 1;

  @include breakpoint-above('medium') {
    justify-content: space-around;
  }

  @include header-child;
  background-color: $c-warning-orange;

  &--redesign {
    @include flex-container(row, center, center);
    flex: 1;

    @include breakpoint-above('medium') {
      justify-content: space-around;
    }

    @include header-child;
    background-color: $c-accent;
    box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.1);
  }
}

.RejoinSessionHeader-left {
  display: none;

  @include breakpoint-above('large') {
    display: block;
    flex: 1;
  }
}

.RejoinSessionHeader-message {
  @include font-category('display-small');
  color: white;
}

.RejoinSessionHeader-buttons {
  @include flex-container(row, flex-end, center);
  @include child-spacing(left, 20px);
  @include breakpoint-above('large') {
    flex: 1;
  }

  &--redesign {
    color: $c-soft-black;
  }
}
</style>
