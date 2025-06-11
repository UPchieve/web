<script setup lang="ts">
import { computed, defineProps, toRefs } from 'vue'
import { QUESTION_TYPES } from '@/consts'
import FormInput from '@/components/FormInput.vue'
import SurveyRadio from '@/components/Surveys/SurveyRadio.vue'
import SurveyImage from '@/components/Surveys/SurveyImage.vue'
import SurveyCheckbox from '@/components/Surveys/SurveyCheckbox.vue'
import type {
  SurveyQuestionDefinition,
  SurveyResponseDefinition,
  SurveyUserQuestionResponse,
} from '@/services/SurveyService'

const props = withDefaults(
  defineProps<{
    question: SurveyQuestionDefinition
    userResponse: SurveyUserQuestionResponse
    updateUserResponse: (
      questionId: number,
      responseId: number | undefined,
      response?: string
    ) => void
    updateUserResponseMultiselect: (
      questionId: number,
      responseId: number | undefined
    ) => void
    readOnly?: boolean
  }>(),
  {
    readOnly: false,
  }
)

const { question, userResponse, updateUserResponse, readOnly } = toRefs(props)

const isRowOfImages = computed(() => {
  const responses = question.value.responses
  return responses.length > 0 && responses.every((a) => a.responseDisplayImage)
})

function isSelected(response: SurveyResponseDefinition) {
  if (Array.isArray(userResponse.value.responseId))
    return userResponse.value.responseId.find((r) => r === response.responseId)
  else
    return (
      userResponse.value.responseId === response.responseId ||
      userResponse.value.openResponse === response.responseText
    )
}
</script>

<template>
  <div>
    <div class="question__title">
      {{ question.questionText }}
    </div>
    <div
      class="question__responses"
      :class="isRowOfImages ? 'question__responses-images' : ''"
    >
      <template
        v-for="response in question.responses"
        :key="response.responseId"
      >
        <SurveyImage
          v-if="response.responseDisplayImage"
          :data-testid="`survey-question-${response.responseText}`"
          class="question__response question__response-image"
          :src="response.responseDisplayImage"
          :label="response.responseText"
          :questionId="question.questionId"
          :responseId="response.responseId"
          :isSelected="isSelected(response)"
          @survey-image-click="updateUserResponse"
          :readOnly="readOnly"
        />

        <SurveyRadio
          v-else-if="question.questionType === QUESTION_TYPES.multipleChoice"
          class="question__response"
          :data-testid="`survey-question-${response.responseText}`"
          :id="`${question.questionId}_${response.responseId}`"
          :radioValue="response.responseId"
          :name="question.questionId"
          :checked="isSelected(response)"
          :questionId="question.questionId"
          :responseId="response.responseId"
          :label="response.responseText"
          :isOpenResponseDisabled="!isSelected(response)"
          :openResponseValue="userResponse.openResponse"
          @survey-radio-input="updateUserResponse"
          :readOnly="readOnly"
        />
        <SurveyCheckbox
          v-else-if="question.questionType === QUESTION_TYPES.checkBox"
          class="question__response question__response-checkbox"
          :class="{
            'question__response-checkbox-selected': isSelected(response),
          }"
          :data-testid="`survey-question-${response.responseText}`"
          :key="`${response.responseId}-checkbox`"
          :id="`${question.questionId}_${response.responseId}`"
          :checkboxValue="response.responseId"
          :name="question.questionId"
          :checked="isSelected(response)"
          :questionId="question.questionId"
          :responseId="response.responseId"
          :label="response.responseText"
          @survey-checkbox-input="updateUserResponseMultiselect"
        />
      </template>

      <FormInput
        v-if="question.questionType === QUESTION_TYPES.number"
        :modelValue="userResponse.openResponse"
        @update:modelValue="
          (response) =>
            updateUserResponse(question.questionId, undefined, response)
        "
        type="number"
        :name="'response-' + question.questionId"
        :testid="'response-' + question.questionId"
        :isRequired="true"
        :blurEvent="'blur-event-' + question.questionId"
        :readOnly="readOnly"
      />
      <FormInput
        v-else-if="question.questionType === QUESTION_TYPES.freeResponse"
        :modelValue="userResponse.openResponse"
        @update:modelValue="
          (response) =>
            updateUserResponse(question.questionId, undefined, response)
        "
        type="text"
        :name="'response-' + question.questionId"
        :testid="'response-' + question.questionId"
        :isRequired="true"
        :blurEvent="'blur-event-' + question.questionId"
        :readOnly="readOnly"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.question {
  &__title {
    @include font-category('heading');
    margin-bottom: 0.3em;
    text-align: left;
    color: $c-soft-black;
  }

  &__responses {
    text-align: left;
    margin-bottom: 1.5em;

    &-images {
      @include flex-container(row, center);
      flex-wrap: wrap;
      margin-top: 2em;
    }
  }

  &__response {
    margin: 0.75em 0;

    &-image {
      flex-basis: 30%;

      @include breakpoint-above('medium') {
        flex-basis: 20%;
      }
    }

    &__response-checkbox {
      border: solid 1px $c-border-grey;
      border-radius: 5px;
      margin: 1em;
      padding: 1em;

      &-selected {
        background-color: $selected-green;
        border-color: $c-accent;
      }
    }
  }
}
</style>
