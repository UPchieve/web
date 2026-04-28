<template>
  <div class="uc-form-element w-full">
    <div class="uc-row justify-between">
      <label :for="props.name" :class="{ error: hasValidationError() }">
        {{ props.label }}
      </label>
      <div v-if="hasValidationError()" class="error-caption">
        {{ getValidationErrors() }}
      </div>
    </div>
    <div class="uc-form-text-input datetime-wrapper" @click="openCalendar">
      <!-- Ionic datetime button needs to be in the code for the component to open properly, but is hidden to display the custom datetime button for better web UI -->
      <ion-datetime-button
        datetime="date-time-picker"
        class="hidden-datetime-button"
      >
      </ion-datetime-button>
      <ion-button class="custom-datetime-button">{{ displayValue }}</ion-button>
      <Calendar class="calendar-icon" />
    </div>

    <ion-modal
      :keep-contents-mounted="true"
      ref="modal"
      :css-class="'datetime-modal-container'"
    >
      <ion-datetime
        aria-label="Date picker"
        id="date-time-picker"
        :presentation="props.hasTime ? 'date-time' : 'date'"
        v-bind="dateTimeProps"
        @ionChange="updateValue"
        :value="normalizedModelValue"
        :min="props.min?.toISOString() || ''"
        :max="props.max?.toISOString() || ''"
        :show-default-buttons="true"
      >
      </ion-datetime>
    </ion-modal>
  </div>
</template>

<script lang="ts" setup>
import { useInputValidation } from '@/composables/InputValidation'
import { IonDatetime, IonModal, IonButton } from '@ionic/vue'
import { computed, ref } from 'vue'
import Calendar from '@/assets/calendar.svg'

const props = defineProps({
  label: { type: String, required: false },
  name: { type: String, required: true },
  modelValue: { type: String, required: true },
  min: { type: Date, required: false },
  max: { type: Date, required: false },
  hasTime: { type: Boolean, default: false },
  placeholder: { type: String, required: false },
})

const modal = ref()
const emit = defineEmits(['update:modelValue'])
const { hasValidationError, getValidationErrors } = useInputValidation()

const normalizedModelValue = computed(() => {
  if (!props.modelValue) return ''
  if (props.modelValue.includes('T')) return props.modelValue

  const [year, month, day] = props.modelValue.split('-').map(Number)
  return new Date(year, month - 1, day).toISOString().slice(0, 16)
})

const displayValue = computed(() => {
  if (!props.modelValue) {
    return props.placeholder || ''
  }

  const date = new Date(normalizedModelValue.value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  let formattedValue = `${month}/${day}/${year}`

  if (props.hasTime) {
    let hours = date.getHours()
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'

    hours = hours % 12 || 12
    const formattedHours = String(hours).padStart(2, '0')

    formattedValue += ` ${formattedHours}:${minutes} ${ampm}`
  }

  return formattedValue
})

const dateTimeProps = computed(() => ({
  formatOptions: {
    date: {
      month: '2-digit' as const,
      day: '2-digit' as const,
      year: 'numeric' as const,
    },
    ...(props.hasTime && {
      time: {
        hour: '2-digit' as const,
        minute: '2-digit' as const,
      },
    }),
  },
}))

function updateValue(event: CustomEvent) {
  const value = event.detail.value
  emit('update:modelValue', props.hasTime ? value : value.split('T')[0])
  modal.value.$el.dismiss(value, 'confirm')
}

function openCalendar() {
  modal.value.$el.present()
}
</script>

<style lang="scss" scoped>
:global(.datetime-modal-container) {
  --width: auto;
  --height: auto;
  --max-width: 320px;
  --max-height: 420px;
}

ion-button {
  --background: transparent;
  --box-shadow: 0;
  --color: black;
  font-family: $font-family-default;
  font-display: swap;
  font-size: 16px;
  font-weight: normal;
}

.hidden-datetime-button {
  display: none;
}

.datetime-wrapper {
  @include flex-container(row, center, center);
  &:hover {
    cursor: pointer;
  }

  &:focus {
    box-shadow: 0 0 0 2px #4b9eff;
    border-radius: 4px;
  }
}

.calendar-icon {
  width: 16px;
  height: 16px;
  margin-left: 8px;
}
</style>
