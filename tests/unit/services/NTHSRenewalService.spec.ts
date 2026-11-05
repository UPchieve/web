import { describe, expect, it } from 'vitest'
import {
  renewalAcceptedToast,
  renewalDotLabel,
} from '@/services/NTHSRenewalService'
import type { NTHSRenewalPrompt } from '@/services/NTHSGroupService'

describe('renewalDotLabel', () => {
  it.each<{ prompt: NTHSRenewalPrompt; hasDot: boolean }>([
    { prompt: 'none', hasDot: false },
    { prompt: 'handoff-banner', hasDot: false },
    { prompt: 'confirm-return', hasDot: true },
    { prompt: 'confirm-reminder', hasDot: false },
    { prompt: 'president-not-cleared', hasDot: true },
    { prompt: 'member-not-cleared', hasDot: true },
    { prompt: 'member-countdown', hasDot: true },
    { prompt: 'step-up', hasDot: false },
  ])('dot for $prompt: $hasDot', ({ prompt, hasDot }) => {
    expect(renewalDotLabel(prompt) !== undefined).toBe(hasDot)
  })
})

describe('renewalAcceptedToast', () => {
  it.each<{
    prompt: NTHSRenewalPrompt
    gainedAdmin: boolean
    mentionsAdminAccess: boolean
  }>([
    {
      prompt: 'confirm-return',
      gainedAdmin: false,
      mentionsAdminAccess: false,
    },
    {
      prompt: 'member-countdown',
      gainedAdmin: true,
      mentionsAdminAccess: true,
    },
    {
      prompt: 'member-countdown',
      gainedAdmin: false,
      mentionsAdminAccess: false,
    },
    { prompt: 'step-up', gainedAdmin: true, mentionsAdminAccess: true },
  ])(
    'toast for $prompt, gainedAdmin $gainedAdmin',
    ({ prompt, gainedAdmin, mentionsAdminAccess }) => {
      const toast = renewalAcceptedToast({
        prompt,
        closesOn: '2027-09-30',
        gainedAdmin,
      })
      expect(toast.includes('admin access')).toBe(mentionsAdminAccess)
    }
  )
})
