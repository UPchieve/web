<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { EVENTS } from '@/consts'
import CrossIcon from '@/assets/cross.svg'
import UpdogStarIcon from '@/assets/updog-star.svg'
import LargeButton from '@/components/LargeButton.vue'
import Modal from '@/components/Modal.vue'
import AnalyticsService from '@/services/AnalyticsService'

const props = defineProps({
  closeModal: {
    type: Function,
    required: true,
  },
})
const store = useStore()
const $router = useRouter()
const mobileMode = computed(() => store.getters['app/mobileMode'])

function handleClose() {
  AnalyticsService.captureEvent(EVENTS.GUIDED_JOURNEY_MODAL_CLOSED)
  props.closeModal()
}

function handleLater() {
  AnalyticsService.captureEvent(EVENTS.GUIDED_JOURNEY_MODAL_CLICKED_MAYBE_LATER)
  handleClose()
}

function goToJourneysPage() {
  AnalyticsService.captureEvent(EVENTS.GUIDED_JOURNEY_MODAL_CLICKED_SEE_PLAN)
  $router.push(`/journeys`)
}

onMounted(async () => {
  AnalyticsService.captureEvent(EVENTS.GUIDED_JOURNEY_MODAL_OPENED)
  localStorage.setItem('seenJourneyModal', 'true')
})
</script>

<template>
  <modal :backText="''" :closeModal="handleClose">
    <header class="cross-icon-container" @click="handleClose">
      <cross-icon class="cross-icon" />
    </header>

    <section class="journey-modal__info">
      <updog-star-icon class="updog" />
      <h1 class="journey-modal__title">Your Step-by-Step College Guide</h1>
      <p class="journey-modal__description">
        We've built a simple plan to help you get into your dream school! Want
        to see what's next?
      </p>
    </section>

    <div v-if="!mobileMode" class="journey-modal__separator" />

    <footer class="journey-modal__buttons">
      <large-button
        data-testid="journey-modal-maybe-later-button"
        @click="handleLater"
        >Maybe later</large-button
      >
      <large-button
        @click="goToJourneysPage"
        variant="primary-blue"
        :showArrow="false"
      >
        See my plan
      </large-button>
    </footer>
  </modal>
</template>

<style lang="scss" scoped>
.journey-modal {
  &__title {
    @include font-category('display-small');
    font-weight: 500;
    margin: 0.5em 0;
    color: $c-soft-black;
  }

  &__description {
    @include font-category('heading');
    color: $c-secondary-grey;
  }

  &__separator {
    border: 1px solid $c-border-grey;
    width: 100%;
    height: 1px;
    margin-top: 1em;
  }

  &__buttons {
    @include flex-container(row, flex-end, center);
    width: 100%;
    margin: 1.5em 0;

    button:first-child {
      margin-right: 1em;
    }
  }

  &__info {
    @include flex-container(column, initial, initial);
  }
}

.cross-icon {
  fill: $icon-grey;
  width: 15px;
  height: 15px;

  &-container {
    @include flex-container(row, flex-end);
    cursor: pointer;
    align-self: flex-end;
  }
}

.updog {
  height: 100px;
  width: 100px;
  align-self: center;
}
</style>
