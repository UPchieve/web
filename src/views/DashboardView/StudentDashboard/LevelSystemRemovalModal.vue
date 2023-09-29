<template>
  <div class="level-system-removal">
    <modal :closeModal="closeModal" v-if="showModal">
      <div class="level-system-removal-modal">
        <header>
          <h1 class="level-system-removal-modal__title">
            We removed the levels feature
          </h1>
          <updog-crying class="updog" />
        </header>

        <section class="level-system-removal-modal__section">
          <p class="level-system-removal-modal__message">
            At UPchieve, we're always trying new ways to help you reach your
            goals. We were testing the levels feature and took it down to
            improve it.
          </p>
          <p class="level-system-removal-modal__message">
            We'd love to hear your feedback on this feature. You can schedule a
            30-minute interview and earn $25 for your time
            <a href="https://calendly.com/d/4mx-n3k-mym/student-interview"
              >here</a
            >.
          </p>
        </section>
        <separator />
        <footer class="level-system-removal-modal__footer">
          <div class="level-system-removal-modal__buttons">
            <large-button
              @click.native="closeModal"
              class="level-system-removal-modal__buttons-button"
              >Close</large-button
            >
          </div>
        </footer>
      </div>
    </modal>
  </div>
</template>

<script>
import Modal from '@/components/Modal.vue'
import LargeButton from '@/components/LargeButton.vue'
import Separator from '@/components/Separator.vue'
import UpdogCrying from '@/assets/updog-crying.svg'
import setCookie from '@/utils/set-cookie'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'

export default {
  name: 'LevelSystem',
  components: {
    Modal,
    LargeButton,
    Separator,
    UpdogCrying,
  },
  data() {
    return {
      showModal: true,
    }
  },
  mounted() {
    AnalyticsService.captureEvent(
      EVENTS.STUDENT_SEEN_LEVEL_SYSTEM_REMOVAL_MODAL
    )
    setCookie('hasSeenLevelSystemRemovalModal', true)
  },
  methods: {
    toggleModal() {
      this.showModal = true
    },
    closeModal() {
      this.showModal = false
    },
  },
}
</script>

<style lang="scss" scoped>
.level-system-removal-modal {
  &__progress-bar {
    width: 100%;
    margin: 1em 0;
  }

  &__subtitle {
    @include font-category('display-small');
    color: $c-secondary-grey;
    margin-top: 1em;
  }

  &__buttons {
    &-button {
      margin: 1em auto;
    }
  }
}

.updog {
  width: 100px;
  height: 100px;
}
</style>
