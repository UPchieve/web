import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import { RouterLink } from 'vue-router'
import router from '@/router'
import { storeOptions } from '@/store'
import NTHSApplyPreviewView from '@/views/NTHS/NTHSApplyPreviewView.vue'
import { POSTHOG_FEATURE_FLAGS } from '@/consts'

vi.mock('@/services/AnalyticsService')

const REQUIREMENTS = {
  training: 'done',
  safetyReview: 'inReview',
  firstSession: 'outstanding',
}

function storeWith(closesAt?: string) {
  const { featureFlags } = storeOptions.modules
  return createStore({
    modules: {
      ...storeOptions.modules,
      featureFlags: {
        ...featureFlags,
        state: {
          ...featureFlags.state,
          payloadFlags: {
            ...featureFlags.state.payloadFlags,
            [POSTHOG_FEATURE_FLAGS.NTHS_APPLICATION_PAGE]: { closesAt },
          },
        },
      },
    },
  })
}

function mountWith(requirements: Record<string, string>, store = storeWith()) {
  store.commit('nths/setNTHSApplyPreview', { requirements })
  return mount(NTHSApplyPreviewView, {
    global: { plugins: [store, router] },
  })
}

function markersFor(wrapper: ReturnType<typeof mountWith>, key: string) {
  return {
    done: wrapper.find(`[data-testid="apply-preview-done-${key}"]`).exists(),
    inReview: wrapper
      .find(`[data-testid="apply-preview-in-review-${key}"]`)
      .exists(),
  }
}

describe('NTHSApplyPreviewView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ toFake: ['Date'] }).setSystemTime(
      new Date(2026, 9, 20, 12)
    )
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it.each([
    ['2026-10-31', '11 days left to apply', 'Oct 31, 2026'],
    ['2026-10-21', '1 day left to apply', 'Oct 21, 2026'],
    ['2026-10-20', 'Last day to apply', 'Oct 20, 2026'],
  ])('shows a %s close date as "%s"', (closesAt, countdown, closesOn) => {
    const wrapper = mountWith(REQUIREMENTS, storeWith(closesAt))

    expect(wrapper.find('.countdown').text()).toBe(countdown)
    expect(wrapper.find('.deadline').text()).toContain(closesOn)
  })

  it('drops a close date that passed while the app stayed open', () => {
    const store = storeWith('2026-10-20')
    expect(mountWith(REQUIREMENTS, store).find('.deadline').exists()).toBe(true)

    vi.setSystemTime(new Date(2026, 9, 21, 9))

    expect(mountWith(REQUIREMENTS, store).find('.deadline').exists()).toBe(
      false
    )
  })

  it.each([
    REQUIREMENTS,
    {
      training: 'outstanding',
      safetyReview: 'outstanding',
      firstSession: 'done',
    },
  ])(
    'marks each requirement with the state the server reported: %o',
    (requirements) => {
      const wrapper = mountWith(requirements)

      for (const [key, state] of Object.entries(requirements)) {
        expect(markersFor(wrapper, key)).toEqual({
          done: state === 'done',
          inReview: state === 'inReview',
        })
      }
    }
  )

  it('offers no way to start an application', () => {
    const wrapper = mountWith(REQUIREMENTS)

    expect(
      wrapper.find('[data-testid="apply-preview-cta"]').attributes('disabled')
    ).toBeDefined()

    const targets = [
      ...wrapper.findAll('a').map((a) => a.attributes('href')),
      ...wrapper.findAllComponents(RouterLink).map((l) => l.props('to')),
    ]
    expect(
      targets.filter((target) => String(target).includes('/groups'))
    ).toEqual([])
  })

  it.each([
    [
      'a new coach gets training and safety screening',
      {
        training: 'outstanding',
        safetyReview: 'outstanding',
        firstSession: 'outstanding',
      },
      ['training', 'safetyReview'],
    ],
    [
      'an approved coach who has not trained gets training',
      {
        training: 'outstanding',
        safetyReview: 'done',
        firstSession: 'outstanding',
      },
      ['training'],
    ],
    [
      'a trained coach who has not started safety screening gets safety screening',
      {
        training: 'done',
        safetyReview: 'outstanding',
        firstSession: 'outstanding',
      },
      ['safetyReview'],
    ],
    [
      'a trained coach still in safety review gets nothing',
      {
        training: 'done',
        safetyReview: 'inReview',
        firstSession: 'outstanding',
      },
      [],
    ],
    [
      'a trained, approved coach gets a student',
      { training: 'done', safetyReview: 'done', firstSession: 'outstanding' },
      ['firstSession'],
    ],
  ])('links to the next step: %s', (_, requirements, linked) => {
    const wrapper = mountWith(requirements)

    expect(
      Object.keys(requirements).filter((key) =>
        wrapper.find(`[data-testid="apply-preview-link-${key}"]`).exists()
      )
    ).toEqual(linked)
  })
})
