<template>
  <div class="w-full" v-bind="wrapperAttrs()">
    <TextField v-bind="inputAttrs()" :type="isVisible ? 'text' : 'password'">
      <template #append>
        <button
          type="button"
          class="password-toggle"
          :aria-label="isVisible ? 'Hide password' : 'Show password'"
          @click="isVisible = !isVisible"
        >
          <v-icon :icon="isVisible ? mdiEye : mdiEyeOff" size="20" />
        </button>
      </template>
    </TextField>

    <div v-if="requirements" class="password-requirements">
      <div
        v-for="requirement in requirements"
        :key="requirement.label"
        class="requirement"
        :class="{
          valid: requirement.hasBeenMet,
          invalid: !requirement.hasBeenMet,
        }"
      >
        <span class="requirement-icon">{{
          requirement.hasBeenMet ? '✓' : '○'
        }}</span>
        {{ requirement.label }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { mdiEye, mdiEyeOff } from '@mdi/js'
import TextField from '@/components/PresentationComponents/TextField.vue'
import { useInputAttrs } from '@/composables/useInputAttrs'

defineOptions({ inheritAttrs: false })

defineProps<{
  requirements?: { label: string; hasBeenMet: boolean }[]
}>()

const { wrapperAttrs, inputAttrs } = useInputAttrs(['type'])
const isVisible = ref(false)
</script>

<style lang="scss" scoped>
.password-requirements {
  margin-top: 8px;
  font-size: 0.875rem;
}

.requirement {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  transition: color 0.2s ease;
}

.requirement.valid {
  color: $c-success-green;
}

.requirement.invalid {
  color: $c-error-red;
}

.requirement-icon {
  font-weight: bold;
  font-size: 1rem;
}

.password-toggle {
  height: 28px;
  display: flex;
  align-items: center;
  padding: 0 4px;
  color: $c-secondary-grey;

  &:hover {
    color: $c-default-grey;
  }
}
</style>
