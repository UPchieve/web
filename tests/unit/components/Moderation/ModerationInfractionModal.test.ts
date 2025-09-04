import { beforeEach, expect, it, vi, describe } from 'vitest'
import { mount } from '@vue/test-utils'
import ModerationInfractionModal from '../../../../src/components/Moderation/ModerationInfractionModal.vue'
import { createStore } from 'vuex'
import { storeOptions } from '@/store'
import { merge } from 'lodash-es'

describe('ModerationInfractionModal', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  const DEFAULT_MODERATION_INFRACTION = {
    isBanned: false,
    stopStreamImmediatelyReasons: [],
    infraction: ['profanity'],
    source: 'screenshare',
  }

  const getWrapper = (props: { moderationInfraction: any }) => {
    const store = createStore(
      merge({}, storeOptions, {
        modules: {
          liveMedia: {
            getters: {
              moderationInfractionSource: vi.fn(),
            },
          },
        },
      })
    )
    return mount(ModerationInfractionModal, {
      global: { plugins: [store] },
      propsData: {
        ...props,
      },
    })
  }

  it.each([
    [
      { ...DEFAULT_MODERATION_INFRACTION, infraction: ['profanity'] },
      'Potential policy violations: profanity',
    ],
    [
      {
        ...DEFAULT_MODERATION_INFRACTION,
        infraction: ['profanity', 'email', 'profanity'],
      },
      'Potential policy violations: profanity, email',
    ],
  ])(
    'Displays the reasons correctly',
    async (infraction: any, expected: string) => {
      const wrapper = getWrapper({
        moderationInfraction: infraction,
      })
      const reasons = wrapper.find(
        '[data-testid="potential-policy-violations"]'
      )
      expect(reasons.text()).toEqual(expected)
    }
  )

  it('Shows messaging about re-sharing your screen when applicable', async () => {
    const wrapper = getWrapper({
      moderationInfraction: {
        ...DEFAULT_MODERATION_INFRACTION,
        source: 'screenshare',
        stopStreamImmediatelyReasons: ['email'],
      },
    })
    const detailedMessage = wrapper.find('[data-testid="infraction-detail"]')
    expect(
      detailedMessage
        .text()
        .includes(
          `Please check the content of your screen for any potentially problematic content, and remove it before sharing your screen again.`
        )
    ).toBeTruthy()

    const wrapperForVoiceInfraction = getWrapper({
      moderationInfraction: {
        ...DEFAULT_MODERATION_INFRACTION,
        source: 'audio-transcription',
        stopStreamImmediatelyReasons: ['email'],
      },
    })
    const detailedMessageForVoice = wrapperForVoiceInfraction.find(
      '[data-testid="infraction-detail"]'
    )
    expect(
      detailedMessageForVoice
        .text()
        .includes('Please check the content of your screen')
    ).toBeFalsy()
  })
})
