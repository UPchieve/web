<template>
  <div class="uc-form-element w-full">
    <div class="uc-row justify-between">
      <label :for="name">{{ props.label }}</label>
    </div>

    <ion-select
      :id="props.name"
      class="select-input"
      label-placement="stacked"
      :placeholder="props.placeholder"
      interface="popover"
      :label="selectOptions.length ? undefined : 'No options available'"
      :multiple="props.multiple"
      :value="props.modelValue"
      @ionChange="updateValue"
      :disabled="props.disabled || !selectOptions.length"
    >
      <template>
        <div v-if="props.groupField">
          <template
            v-for="group in selectOptions"
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
            v-for="option in selectOptions"
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
import { computed, onMounted, ref } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import { helpers, requiredIf } from '@vuelidate/validators'

const props = defineProps({
  label: {
    type: String,
    required: false,
  },
  name: {
    type: String,
    required: true,
  },
  getOptionsAsync: {
    type: Function,
  },
  options: {
    type: Array,
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
  },
})

const emit = defineEmits(['update:modelValue'])
const asyncOptions = ref<any[]>([])

const rules = {
  modelValue: {
    required: helpers.withMessage('Required', requiredIf(props.isRequired)),
  },
}
const v$ = useVuelidate(rules, props)

const selectOptions = computed(() => {
  return asyncOptions.value?.length ? asyncOptions.value : props.options
})

function updateValue(event: CustomEvent) {
  const selectedValue = event.detail.value
  emit('update:modelValue', selectedValue)
  v$.value.modelValue.$touch()
}

onMounted(async () => {
  if (props.getOptionsAsync) {
    asyncOptions.value = await props.getOptionsAsync()
  }
})
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
  background-color: #fff;
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
  z-index: 0;
  --highlight-color-focused: $border-grey;

  &.select-input {
    text-align: left;
    font-size: 16px;
    font-family: $font-family-default;
    font-display: swap;

    &:active {
      color: #000;
    }
  }
}
</style>
