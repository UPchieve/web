import { enableAutoUnmount, mount } from '@vue/test-utils'
import { page } from '@vitest/browser/context'
import SurveyQuestion from '@/components/Surveys/SurveyQuestion.vue'
import SurveyRadio from '@/components/Surveys/SurveyRadio.vue'
import {
  caresChoices,
  caresQuestion,
  goalQuestion,
} from '../../fixtures/surveys'

function mountQuestion(props = {}) {
  return mount(SurveyQuestion, {
    attachTo: document.body,
    props: {
      question: caresQuestion,
      userResponse: { responseId: undefined, openResponse: '' },
      updateUserResponse: () => {},
      ...props,
    },
  })
}

describe('SurveyQuestion', () => {
  enableAutoUnmount(afterEach)

  it('draws a multiple-choice question without images as radio buttons', () => {
    const wrapper = mountQuestion({ question: goalQuestion })

    expect(wrapper.findComponent(SurveyRadio).exists()).toBe(true)
  })

  it('names the scale by its question', async () => {
    mountQuestion()

    await expect
      .element(page.getByRole('radiogroup'))
      .toHaveAccessibleName(caresQuestion.questionText)
  })

  it('names each choice by its number and any label under it', async () => {
    mountQuestion()

    await expect
      .element(caresChoices().first())
      .toHaveAccessibleName('1 Not at all')
    await expect.element(caresChoices().nth(1)).toHaveAccessibleName('2')
    await expect.element(caresChoices().last()).toHaveAccessibleName('5 A lot')
  })

  it('lets nobody pick on a read-only scale', () => {
    mountQuestion({ readOnly: true })

    expect(page.getByRole('radio', { disabled: true }).elements()).toHaveLength(
      caresQuestion.responses.length
    )
  })
})
