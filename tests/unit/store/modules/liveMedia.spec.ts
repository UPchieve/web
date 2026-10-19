import { afterEach, describe, expect, it } from 'vitest'
import liveMedia from '@/store/modules/liveMedia'

const screenshareAllowed = (blockScreenshare: boolean) =>
  (liveMedia.getters as any).screenshareAllowed(
    {},
    {},
    {},
    {
      'featureFlags/blockScreenshare': blockScreenshare,
    }
  )

describe('liveMedia/screenshareAllowed', () => {
  afterEach(() => {
    delete (navigator.mediaDevices as any).getDisplayMedia
  })

  it.each`
    blockScreenshare | canCapture | allowed
    ${false}         | ${true}    | ${true}
    ${true}          | ${true}    | ${false}
    ${false}         | ${false}   | ${false}
    ${true}          | ${false}   | ${false}
  `(
    'is $allowed when the flag blocks: $blockScreenshare, the browser can capture: $canCapture',
    ({ blockScreenshare, canCapture, allowed }) => {
      if (!canCapture) {
        Object.defineProperty(navigator.mediaDevices, 'getDisplayMedia', {
          value: undefined,
          configurable: true,
        })
      }
      expect(screenshareAllowed(blockScreenshare)).toBe(allowed)
    }
  )
})
