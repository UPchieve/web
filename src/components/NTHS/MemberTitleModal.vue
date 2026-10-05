<script lang="ts" setup>
import { ref } from 'vue'
import { useStore } from 'vuex'
import LargeButton from '@/components/LargeButton.vue'
import type { NTHSTitle } from '@/services/NTHSGroupService'
import type { TitleChoice } from '@/services/NTHSRosterService'

export type MemberTitleModalProps = {
  heading: string
  choices: TitleChoice[]
  current: NTHSTitle
  acceptText: string
  // Called with undefined on cancel.
  resolveTitle: (title: NTHSTitle | undefined) => void
}

const props = defineProps<MemberTitleModalProps>()
const store = useStore()

const selected = ref<NTHSTitle>(
  props.choices.some((choice) => choice.title === props.current)
    ? props.current
    : 'Member'
)

function choose() {
  store.dispatch('app/modal/hide')
  props.resolveTitle(selected.value)
}

function onCancel() {
  store.dispatch('app/modal/hide')
  props.resolveTitle(undefined)
}

defineExpose({ onCancel })
</script>

<template>
  <div class="main-container">
    <fieldset class="choices">
      <legend class="title">{{ heading }}</legend>
      <label
        v-for="choice in choices"
        :key="choice.title"
        class="choice"
        :data-testid="`title-choice-${choice.title}`"
      >
        <input
          v-model="selected"
          type="radio"
          name="nths-member-title"
          :value="choice.title"
        />
        {{ choice.label }}
      </label>
    </fieldset>
    <div class="actions">
      <LargeButton
        :showArrow="false"
        variant="secondary"
        data-testid="title-choice-cancel"
        @click="onCancel"
        >Cancel</LargeButton
      >
      <LargeButton
        :showArrow="false"
        variant="primary-blue"
        data-testid="title-choice-save"
        @click="choose"
        >{{ acceptText }}</LargeButton
      >
    </div>
  </div>
</template>

<style lang="scss" scoped>
.main-container {
  text-align: left;
}
.choices {
  border: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.title {
  font-size: 20px;
  font-weight: 500;
  line-height: 1.3;
  margin-bottom: 8px;
}
.choice {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  cursor: pointer;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 24px;
}
</style>
