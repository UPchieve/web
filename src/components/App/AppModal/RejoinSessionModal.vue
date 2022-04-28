<template>
  <div class="RejoinSessionModal">
    <h1 class="RejoinSessionModal-title">Chat in session</h1>
    <h2 class="RejoinSessionModal-subtitle">
      End your current chat to start a new chat. What would you like to do with
      your current chat?
    </h2>

    <div class="RejoinSessionModal-buttons">
      <large-button primary @click.native="rejoin">Return to chat</large-button>
      <large-button secondary @click.native="end">End chat</large-button>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import * as sessionUtils from '@/utils/session'
import LargeButton from '@/components/LargeButton'

export default {
  components: { LargeButton },
  computed: {
    ...mapGetters({
      mobileMode: 'app/mobileMode',
      sessionPath: 'user/sessionPath'
    })
  },
  watch: {
    // Hide modal if mobileMode becomes false
    mobileMode(value) {
      if (!value) this.$store.dispatch('app/modal/hide')
    }
  },
  methods: {
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
h1,
h2,
p {
  margin: 0;
  padding: 0;
}

.RejoinSessionModal {
  @include flex-container(column);
  @include child-spacing(top, 16px);
}

.RejoinSessionModal-title {
  @include font-category('display-small');
}

.RejoinSessionModal-subtitle {
  @include font-category('body');
  color: $c-secondary-grey;
}

.RejoinSessionModal-buttons {
  @include flex-container(column);
  @include child-spacing(top, 16px);
  margin-top: 40px;
}
</style>
