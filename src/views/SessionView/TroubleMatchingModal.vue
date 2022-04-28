<template>
  <modal :closeModal="() => false" :backText="''">
    <div class="trouble-matching-modal">
      <header>
        <h1 class="trouble-matching-modal__title">
          We’re having trouble matching you with a coach 😔
        </h1>
      </header>

      <h2 class="trouble-matching-modal__subtitle">
        We recommend ending your session and trying again later.
      </h2>
      <separator />
      <div class="trouble-matching-modal__footer">
        <div class="trouble-matching-modal__buttons">
          <large-button
            @click.native="closeModal"
            class="trouble-matching-modal__buttons--cancel"
            >Keep Waiting</large-button
          >
          <large-button primary @click.native="end">End Session</large-button>
        </div>
      </div>
    </div>
  </modal>
</template>

<script>
import { mapGetters } from 'vuex'
import NetworkService from '@/services/NetworkService'
import Modal from '@/components/Modal'
import Separator from '@/components/Separator'
import LargeButton from '@/components/LargeButton'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'

export default {
  name: 'TroubleMatchingModal',
  components: { LargeButton, Modal, Separator },
  props: {
    sessionId: { type: String, required: true },
    endSession: { type: Function, required: true },
    closeModal: { type: Function, required: true }
  },
  computed: {
    ...mapGetters({ mobileMode: 'app/mobileMode' })
  },
  mounted() {
    // Session toggle buttons are rendered on a higher stacking context
    // than this modal in mobile. Hide the buttons when mounted
    if (this.mobileMode) this.displaySessionToggleButtons(false)
  },
  beforeDestroy() {
    if (this.mobileMode) this.displaySessionToggleButtons(true)
  },
  methods: {
    displaySessionToggleButtons(show) {
      const toggleElements = Array.from(
        document.querySelectorAll('.toggleButton')
      )
      for (const element of toggleElements) {
        element.style.position = show ? 'fixed' : 'static'
      }
    },
    async end() {
      const data = {
        timeout: 15
      }
      await NetworkService.timedOutSession(this.sessionId, data)
      AnalyticsService.captureEvent(EVENTS.SESSION_TIMED_OUT_15_MINS, {
        event: EVENTS.SESSION_TIMED_OUT_15_MINS
      })
      this.endSession()
    }
  }
}
</script>

<style lang="scss" scoped>
.trouble-matching-modal {
  @include flex-container(column);

  &__title {
    @include font-category('display-small');
  }

  &__subtitle {
    @include font-category('body');
    margin: 0 0 35px;
    color: $c-secondary-grey;
    font-size: 15px;
  }

  &__buttons {
    margin-top: 16px;
    @include flex-container(row, flex-end);
    @include child-spacing(left, 16px);

    @include breakpoint-below('tiny') {
      @include flex-container(column, flex-start);
      @include child-spacing(left, 0);
      @include child-spacing(bottom, 20px);
    }

    &--cancel {
      background-color: $c-disabled-grey;
      color: #fff;

      &:hover {
        border: 1px solid transparent;
        background-color: darken($c-disabled-grey, 5%);
      }
    }
  }
}
</style>
