<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import Modal from '@/components/Modal.vue'
import LargeButton from '@/components/LargeButton.vue'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'

const props = defineProps<{
  closeModal: () => void
}>()

const willShowOnlineStatus = ref<boolean>(true)
const reason = ref('')

onMounted(() => {
  AnalyticsService.captureEvent(EVENTS.VOLUNTEER_SAW_SHOW_ONLINE_STATUS_MODAL)
})

function getReason(): string | undefined {
  const trimmedReason = reason.value.trim()
  return willShowOnlineStatus.value === false && trimmedReason
    ? trimmedReason
    : undefined
}

function submit() {
  if (willShowOnlineStatus.value === true) {
    AnalyticsService.captureEvent(EVENTS.VOLUNTEER_CHOSE_TO_SHOW_ONLINE_STATUS)
  } else {
    AnalyticsService.captureEvent(
      EVENTS.VOLUNTEER_CHOSE_NOT_TO_SHOW_ONLINE_STATUS,
      { reason: getReason() }
    )
  }

  props.closeModal()
}

function handleDismiss() {
  AnalyticsService.captureEvent(
    EVENTS.VOLUNTEER_DISMISSED_ONLINE_STATUS_MODAL,
    {
      willShowOnlineStatus: willShowOnlineStatus.value,
      reason: getReason(),
    }
  )
  props.closeModal()
}
</script>

<template>
  <modal :closeModal="handleDismiss">
    <div class="show-online-status-modal">
      <h1 class="show-online-status-modal__title">
        Share your online status with students?
      </h1>
      <p class="show-online-status-modal__subtitle">
        We're exploring letting students see when their favorite coaches are
        online. Would you be willing to share your online status with students?
      </p>

      <fieldset
        class="show-online-status-modal__fieldset"
        data-testid="fieldset-show-online-status-options"
      >
        <legend class="sr-only">
          Are you willing to share your online status with students?
        </legend>
        <div class="radio-options">
          <div class="radio-option">
            <input
              type="radio"
              id="show-online-status-yes"
              data-testid="show-online-status-yes-radio-option"
              name="show-online-status"
              :value="true"
              v-model="willShowOnlineStatus"
            />
            <label for="show-online-status-yes">Yes</label>
          </div>
          <div class="radio-option">
            <input
              type="radio"
              id="show-online-status-no"
              data-testid="show-online-status-no-radio-option"
              name="show-online-status"
              :value="false"
              v-model="willShowOnlineStatus"
            />
            <label for="show-online-status-no">No</label>
          </div>
        </div>
      </fieldset>

      <div
        v-if="willShowOnlineStatus === false"
        class="show-online-status-modal__reason"
        data-testid="show-online-status-reason-container"
      >
        <label for="show-online-status-reason-input">Why not? (Optional)</label>
        <textarea
          id="show-online-status-reason-input"
          data-testid="show-online-status-reason-input"
          autocomplete="off"
          v-model="reason"
          placeholder="Let us know your concerns"
          rows="3"
        />
      </div>

      <div class="show-online-status-modal__buttons">
        <large-button @click="handleDismiss">Cancel</large-button>
        <large-button
          primary
          @click="submit"
          data-testid="show-online-status-submit-button"
          >Submit</large-button
        >
      </div>
    </div>
  </modal>
</template>

<style lang="scss" scoped>
.show-online-status-modal {
  @include flex-container(column);

  &__title {
    @include font-category('display-small');
    margin-top: 0;
  }

  &__subtitle {
    @include font-category('body');
    color: $c-secondary-grey;
    font-size: 15px;
  }

  &__fieldset {
    border: none;
    padding: 0;
    margin: 16px 0 0;
  }

  &__reason {
    display: flex;
    flex-direction: column;
    margin-top: 16px;

    label {
      align-self: flex-start;
      font-size: 16px;
      font-weight: 500;
      margin-bottom: 5px;
    }

    textarea {
      padding: 10px;
      border: solid 1px $c-border-grey;
      border-radius: 5px;
      resize: none;

      &:focus {
        outline: none;
      }
    }
  }

  &__buttons {
    margin-top: 24px;
    @include flex-container(row, flex-end);
    @include child-spacing(left, 16px);
  }
}

.radio-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.radio-option {
  display: flex;
  flex-direction: row;
  gap: 8px;

  label {
    margin-bottom: unset;
  }
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
