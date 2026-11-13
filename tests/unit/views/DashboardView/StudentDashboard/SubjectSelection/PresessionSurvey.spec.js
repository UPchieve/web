import { enableAutoUnmount, mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import { page, userEvent } from '@vitest/browser/context'
import PresessionSurvey from '@/views/DashboardView/StudentDashboard/SubjectSelection/PresessionSurvey.vue'
import {
  caresChoices,
  caresQuestion,
  goalQuestion,
} from '../../../../fixtures/surveys'

describe('PresessionSurvey', () => {
  enableAutoUnmount(afterEach)

  const mountSurvey = () => {
    const store = createStore({
      modules: {
        app: { namespaced: true, getters: { mobileMode: () => false } },
      },
    })
    mount(PresessionSurvey, {
      attachTo: document.body,
      props: {
        subject: 'algebraOne',
        surveyDefinition: {
          survey: [caresQuestion, goalQuestion],
          surveyId: 1,
          surveyTypeId: 1,
        },
      },
      global: { plugins: [store] },
    })
  }

  it('asks a scale question with five numbered choices', async () => {
    mountSurvey()

    await expect.poll(() => caresChoices().elements()).toHaveLength(5)
  })

  it('lets the student pick a number and go on', async () => {
    mountSurvey()

    await userEvent.click(page.getByText('Somewhat'))

    await expect.element(caresChoices().nth(2)).toBeChecked()
    await expect
      .element(page.getByTestId('presession-next-button'))
      .toBeEnabled()
  })

  it('lets a keyboard user pick a number and go on', async () => {
    mountSurvey()

    await expect.element(caresChoices().first()).toBeInTheDocument()
    caresChoices().first().element().focus()
    await userEvent.keyboard('{ArrowRight}')

    await expect.element(caresChoices().nth(1)).toBeChecked()
    await expect
      .element(page.getByTestId('presession-next-button'))
      .toBeEnabled()
  })
})
