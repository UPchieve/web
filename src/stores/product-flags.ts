import { ref } from 'vue'
import { defineStore } from 'pinia'
import NetworkService from '@/services/NetworkService'
import LoggerService from '@/services/LoggerService'
import type { ImpactStudyCampaign } from '@/types'
import type { ISODateString } from '@/types/shared'

export type ProductFlags = {
  impactStudyEnrollmentAt?: ISODateString | null
  impactStudyCampaigns?: Record<string, ImpactStudyCampaign>
  shareInfoModalDismissedAt?: ISODateString | null
}

export const useProductFlagsStore = defineStore('product-flags', () => {
  const flags = ref<ProductFlags>({})
  // Lets prompts wait for flags instead of flashing before they arrive
  const isLoaded = ref(false)

  async function getUserProductFlags() {
    // Don't let the previous user's flags stand in while this user's load
    isLoaded.value = false
    flags.value = {}
    const response = await NetworkService.getUserProductFlags()
    const loaded: ProductFlags = response.data.flags ?? {}
    flags.value = {
      ...loaded,
      // Keep a dismissal made while the flags were loading
      shareInfoModalDismissedAt:
        loaded.shareInfoModalDismissedAt ??
        flags.value.shareInfoModalDismissedAt,
    }
    isLoaded.value = true
  }

  // Closing the share-info modal without choosing isn't an opt-in or an
  // opt-out. We record it so the dashboard doesn't ask again on any device.
  async function markShareInfoModalDismissed() {
    if (flags.value.shareInfoModalDismissedAt) return
    flags.value = {
      ...flags.value,
      shareInfoModalDismissedAt: new Date().toISOString(),
    }
    try {
      const response = await NetworkService.setShareInfoModalDismissed()
      flags.value.shareInfoModalDismissedAt = response.shareInfoModalDismissedAt
    } catch (err) {
      // The modal stays closed for this visit and shows again next time
      LoggerService.noticeError(err)
    }
  }

  function addToProductFlags(data: ProductFlags) {
    flags.value = { ...flags.value, ...data }
  }

  function setImpactStudyCampaigns(
    campaigns: Record<string, ImpactStudyCampaign>
  ) {
    flags.value.impactStudyCampaigns = campaigns
  }

  return {
    flags,
    isLoaded,
    getUserProductFlags,
    markShareInfoModalDismissed,
    addToProductFlags,
    setImpactStudyCampaigns,
  }
})
