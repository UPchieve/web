import {
  beforeEach,
  describe,
  expect,
  type MockInstance,
  test,
  vi,
} from 'vitest'
import JourneysView from '@/views/JourneysView.vue'
import router from '@/router'
import store from '@/store'
import { mount, VueWrapper, flushPromises } from '@vue/test-utils'

function getWrapper() {
  return mount(JourneysView, {
    global: {
      plugins: [store, router],
    },
  })
}

function getElements(wrapper: VueWrapper) {
  return {
    title: wrapper.find('.journey-page__title'),
    subtitle: wrapper.find('.journey-page__subtitle'),
    stepButtons: wrapper.findAll('[data-testid="start-session-btn"]'),
    steps: wrapper.findAll('.steps-step'),
  }
}

describe('JourneysView', () => {
  let commitSpy: MockInstance
  let routerPushSpy: MockInstance

  beforeEach(() => {
    vi.restoreAllMocks()
    commitSpy = vi.spyOn(store, 'commit')
    routerPushSpy = vi.spyOn(router, 'push')
  })
  test('renders the journey page with correct title and subtitle', () => {
    const wrapper = getWrapper()
    const { title, subtitle } = getElements(wrapper)

    expect(title.text()).toBe('UPchieve College Journey')
    expect(subtitle.text()).toContain(
      "We've put together a plan to help you supercharge your path to college!"
    )
  })

  test('Step 1 button starts correct session when clicked', async () => {
    const wrapper = getWrapper()

    await wrapper.vm.$nextTick()
    await flushPromises()

    const { stepButtons } = getElements(wrapper)

    await stepButtons[0].trigger('click')
    await flushPromises()

    expect(commitSpy).toHaveBeenCalledWith('session/setJourneySessionData', {
      dropdownLabel: 'Getting into College',
      key: 'college',
      stepNumber: 1,
      title: 'Step 1: Build Your College List',
      subject: 'collegeList',
    })

    expect(routerPushSpy).toHaveBeenCalledWith('/session/college/collegeList')
  })

  test('Step 2 button starts correct session when clicked', async () => {
    const wrapper = getWrapper()

    await wrapper.vm.$nextTick()
    await flushPromises()

    const { stepButtons } = getElements(wrapper)

    await stepButtons[1].trigger('click')
    await flushPromises()

    expect(commitSpy).toHaveBeenCalledWith('session/setJourneySessionData', {
      dropdownLabel: 'Getting into College',
      key: 'college',
      stepNumber: 2,
      title: 'Step 2: Balance Your College List',
      subject: 'collegeList',
    })

    expect(routerPushSpy).toHaveBeenCalledWith('/session/college/collegeList')
  })

  test('Step 3 button starts correct session when clicked', async () => {
    const wrapper = getWrapper()

    await wrapper.vm.$nextTick()
    await flushPromises()

    const { stepButtons } = getElements(wrapper)

    await stepButtons[2].trigger('click')
    await flushPromises()

    expect(commitSpy).toHaveBeenCalledWith('session/setJourneySessionData', {
      dropdownLabel: 'Getting into College',
      key: 'college',
      stepNumber: 3,
      title: 'Step 3: Organize Your Requirements & Deadlines',
      subject: 'collegeApps',
    })

    expect(routerPushSpy).toHaveBeenCalledWith('/session/college/collegeApps')
  })

  test('Step 4 button starts correct session when clicked', async () => {
    const wrapper = getWrapper()

    await wrapper.vm.$nextTick()
    await flushPromises()

    const { stepButtons } = getElements(wrapper)

    await stepButtons[3].trigger('click')
    await flushPromises()

    expect(commitSpy).toHaveBeenCalledWith('session/setJourneySessionData', {
      dropdownLabel: 'Getting into College',
      key: 'college',
      stepNumber: 4,
      title: 'Step 4: Write your Essay/Personal Statement',
      subject: 'applicationEssays',
    })

    expect(routerPushSpy).toHaveBeenCalledWith(
      '/session/college/applicationEssays'
    )
  })

  test('Step 5 button starts correct session when clicked', async () => {
    const wrapper = getWrapper()

    await wrapper.vm.$nextTick()
    await flushPromises()

    const { stepButtons } = getElements(wrapper)

    await stepButtons[4].trigger('click')
    await flushPromises()

    expect(commitSpy).toHaveBeenCalledWith('session/setJourneySessionData', {
      dropdownLabel: 'Getting into College',
      key: 'college',
      stepNumber: 5,
      title: 'Step 5: Prepare for the SAT/ACT',
      subject: 'collegePrep',
    })

    expect(routerPushSpy).toHaveBeenCalledWith('/session/college/collegePrep')
  })
})
