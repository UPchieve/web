<template>
  <div class="uc-form-element w-full">
    <div class="uc-row justify-between">
      <label :for="name">{{ props.label }}</label>
    </div>

    <ion-select
      :id="props.name"
      class="select-input"
      label-placement="floating"
      :placeholder="placeholder"
      interface="popover"
      :label="props.options.length ? undefined : 'No options available'"
      :multiple="props.multiple"
      :value="props.modelValue"
      @ionChange="updateValue"
      :disabled="props.disabled || !props.options.length"
    >
      <template>
        <div v-if="props.groupField">
          <template
            v-for="group in props.options"
            :key="group[props.groupField]"
          >
            {{ group[props.groupField] }}
            <ion-select-option disabled>
              {{ group[props.groupField] }}
            </ion-select-option>
            <ion-select-option
              v-for="option in group[props.group]"
              :key="
                props.optionTextField ? option[props.optionTextField] : option
              "
              class="select-text"
              :value="props.reduce ? props.reduce(option) : option"
            >
              {{
                props.optionTextField ? option[props.optionTextField] : option
              }}
            </ion-select-option>
          </template>
        </div>
        <div v-else>
          <ion-select-option
            v-for="option in props.options"
            :key="
              props.optionTextField ? option[props.optionTextField] : option
            "
            :value="props.reduce ? props.reduce(option) : option"
            class="select-text"
          >
            {{ props.optionTextField ? option[props.optionTextField] : option }}
          </ion-select-option>
        </div>
      </template>
    </ion-select>
  </div>
</template>

<script lang="ts" setup>
import { IonSelect, IonSelectOption } from '@ionic/vue'
import { type PropType } from 'vue'

const props = defineProps({
  label: {
    type: String,
    required: false,
  },
  name: {
    type: String,
    required: true,
  },
  options: {
    type: Array as PropType<any[]>,
    default: () => [],
  },
  optionTextField: {
    type: String,
    required: false,
  },
  multiple: {
    type: Boolean,
    required: false,
    default: false,
  },
  modelValue: {
    type: [String, Number, Array, Object],
    default: null,
  },
  disabled: {
    type: Boolean,
    required: false,
  },
  placeholder: {
    type: String,
    required: false,
  },
  reduce: {
    type: Function,
    required: false,
  },
  groupField: {
    type: String,
    required: false,
    default: null,
  },
  group: {
    type: String,
    required: false,
    default: null,
  },
  isRequired: {
    type: Boolean,
    default: false,
  }
})

const emit = defineEmits(['update:modelValue'])

function updateValue(event: CustomEvent) {
  emit('update:modelValue', event.detail.value)
}
</script>

<style lang="scss">
.sc-ion-select-popover-md {
  padding: 0;
}

ion-checkbox {
  --border-width: 1px;
  --border-color: #d8dee5;
  --size: 14px;
}
</style>

<style lang="scss" scoped>
ion-select {
  height: auto;
  min-height: 48px;
  margin: 0;
  border: 1px solid $border-grey;
  border-radius: 4px;
  box-shadow: none;
  box-sizing: border-box;
  width: 100%;
  position: relative;
  padding: 0 13px;
  font-size: 14px;
  --highlight-color-focused: $border-grey;

  &.select-input {
    text-align: left;
    font-size: 16px;
    font-family: $font-family-default;

    &:active {
      color: #000;
    }
  }
}
</style>
