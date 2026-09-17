import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { RouterLink } from 'vue-router'
import router from '@/router'
import store from '@/store'
import NTHSApplyPreviewView from '@/views/NTHS/NTHSApplyPreviewView.vue'

vi.mock('@/services/AnalyticsService')

const REQUIREMENTS = {
  training: 'done',
  safetyReview: 'inReview',
  firstSession: 'outstanding',
}

function mountWith(requirements: Record<string, string>) {
  store.commit('nths/setNTHSApplyPreview', {
    closesAt: '2026-10-01T03:59:00.000Z',
    requirements,
  })
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
