<script setup lang="ts">
import YourPlan from './YourPlan.vue'
import FormSelect from '@/components/FormInputs/FormSelect.vue'
import FormInput from '@/components/FormInput.vue'
import { computed, ref } from 'vue'

const now = new Date()
const requiredHours = ref<number | null>(null)
const currentHours = ref<number | null>(0)
const targetMonth = ref<number>(now.getMonth() + 1)
const targetYear = ref<number>(now.getFullYear() + 1)

const monthOptions = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
]

const yearOptions = computed(() => {
  const y = new Date().getFullYear()
  return [y, y + 1, y + 2, y + 3, y + 4]
})
</script>

<template>
  <div class="inputs">
    <h2 class="headline">Service Hours Calculator</h2>
    <p class="hook">
      Graduation requirements or college apps that stand out — whatever your
      goal, we'll help you get there. Enter your hours and deadline, and we'll
      put together a volunteer plan built around you.
    </p>

    <div class="fields">
      <div class="input-row">
        <FormInput
          name="required-hours"
          label="Hours required"
          type="number"
          placeholder="e.g. 40"
          :min-value="0"
          :max-value="500"
          :is-required="false"
          :model-value="requiredHours ?? ''"
          @update:model-value="requiredHours = $event ? Number($event) : null"
        />

        <FormInput
          name="current-hours"
          label="Completed hours"
          type="number"
          placeholder="e.g. 12"
          :min-value="0"
          :max-value="500"
          :is-required="false"
          :model-value="currentHours ?? ''"
          @update:model-value="currentHours = $event ? Number($event) : null"
        />
      </div>

      <div class="uc-form-element">
        <label>When are you hours due?</label>
        <div class="input-row">
          <FormSelect
            name="target-month"
            :options="monthOptions"
            option-text-field="label"
            :reduce="(opt: { value: number; label: string }) => opt.value"
            :model-value="targetMonth"
            @update:model-value="targetMonth = $event"
          />
          <FormSelect
            name="target-year"
            :options="yearOptions"
            :model-value="targetYear"
            @update:model-value="targetYear = $event"
          />
        </div>
      </div>
    </div>
  </div>
  <YourPlan
    :required-hours="requiredHours"
    :current-hours="currentHours"
    :month-options="monthOptions"
    :target-month="targetMonth"
    :target-year="targetYear"
  ></YourPlan>
</template>

<style lang="scss" scoped>
.headline {
  font-size: 20px;
  font-weight: 700;
  color: $c-soft-black;
  margin: 0 0 8px;
  line-height: 1.3;
}

.hook {
  font-size: 14px;
  color: $c-soft-black;
  margin: 0 0 20px;
  opacity: 0.75;
}

.fields {
  @include flex-container(column);
  gap: 16px;
}

.input-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
</style>
