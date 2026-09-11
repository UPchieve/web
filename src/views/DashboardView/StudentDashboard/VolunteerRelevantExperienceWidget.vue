<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS, POSTHOG_FEATURE_FLAGS } from '@/consts'
import LargeButton from '@/components/LargeButton.vue'

const router = useRouter()
const options = [
  { value: 'career', label: 'has the career I want' },
  { value: 'college', label: 'went or is in my target college' },
  { value: 'major', label: 'majored in what I want to major in' },
  { value: 'class', label: "took the class I'm in" },
  { value: 'other', label: 'something else' },
]
const selectedOption = ref('')
const otherResponse = ref('')
const canSubmit = computed(
  () =>
    Boolean(selectedOption.value) &&
    (selectedOption.value !== 'other' || otherResponse.value.trim().length >= 3)
)
const eventProperties = computed(() => ({
  experiment: POSTHOG_FEATURE_FLAGS.VOLUNTEER_RELEVANT_EXPERIENCE_FAKE_DOOR,
  interestType: selectedOption.value,
  ...(selectedOption.value === 'other'
    ? { otherResponse: otherResponse.value.trim() }
    : {}),
}))

onMounted(() =>
  AnalyticsService.captureEvent(
    EVENTS.STUDENT_VOLUNTEER_RELEVANT_EXPERIENCE_WIDGET_SHOWN,
    eventProperties.value
  )
)

function selectOption(value: string) {
  selectedOption.value = value
  AnalyticsService.captureEvent(
    EVENTS.STUDENT_VOLUNTEER_RELEVANT_EXPERIENCE_OPTION_SELECTED,
    eventProperties.value
  )
}

function submitInterest() {
  if (!canSubmit.value) return
  AnalyticsService.captureEvent(
    EVENTS.STUDENT_VOLUNTEER_RELEVANT_EXPERIENCE_SUBMITTED,
    eventProperties.value
  )
  router.push({
    path: '/volunteer-relevant-experience/thanks',
    query: { interestType: selectedOption.value },
  })
}
</script>

<template>
  <section
    class="volunteer-relevant-experience"
    data-testid="volunteer-relevant-experience-widget"
  >
    <h2>I want to talk to someone who...</h2>
    <div
      class="volunteer-relevant-experience__options"
      role="radiogroup"
      aria-label="I want to talk to someone who"
    >
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        class="volunteer-relevant-experience__option"
        :class="{
          'volunteer-relevant-experience__option--selected':
            selectedOption === option.value,
        }"
        role="radio"
        :aria-checked="selectedOption === option.value"
        @click="selectOption(option.value)"
      >
        {{ option.label }}
      </button>
    </div>
    <label
      v-if="selectedOption === 'other'"
      class="volunteer-relevant-experience__other"
    >
      Tell us who you want to talk to
      <input
        v-model="otherResponse"
        type="text"
        minlength="3"
        maxlength="250"
        placeholder="I want to talk to someone who..."
        data-testid="volunteer-relevant-experience-other"
        autocomplete="off"
      />
    </label>
    <large-button
      class="volunteer-relevant-experience__submit"
      variant="primary-blue"
      :show-arrow="true"
      :disabled="!canSubmit"
      data-testid="volunteer-relevant-experience-submit"
      @click="submitInterest"
    >
      Find someone to talk to
    </large-button>
  </section>
</template>

<style lang="scss" scoped>
.volunteer-relevant-experience {
  margin-top: 20px;
  padding: 16px;
  border: 1px solid $c-border-grey;
  border-radius: 8px;
  background: white;
}
h2 {
  margin: 0 0 10px;
  font-size: 20px;
}
.volunteer-relevant-experience__options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.volunteer-relevant-experience__option {
  padding: 7px 12px;
  border: 1px solid $c-border-grey;
  border-radius: 20px;
  background: white;
  color: $c-soft-black;
  cursor: pointer;
  &:hover,
  &--selected {
    border-color: $c-information-blue;
    background: lighten($c-information-blue, 50%);
  }
}
.volunteer-relevant-experience__other {
  display: grid;
  gap: 5px;
  max-width: 560px;
  margin-top: 10px;
  font-size: 14px;
  font-weight: 600;

  input {
    min-height: 38px;
    padding: 7px 10px;
    border: 1px solid $c-border-grey;
    border-radius: 6px;
    font: inherit;
  }
}
.volunteer-relevant-experience__submit {
  margin-top: 12px;
}
</style>
