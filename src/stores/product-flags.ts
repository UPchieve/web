import { ref } from 'vue'
import { defineStore } from 'pinia'
import NetworkService from '@/services/NetworkService'
import type { ImpactStudyCampaign } from '@/types'
import type { ISODateString } from '@/types/shared'

export type ProductFlags = {
  fallIncentiveEnrollmentAt?: ISODateString | null
  impactStudyEnrollmentAt?: ISODateString | null
  impactStudyCampaigns?: Record<string, ImpactStudyCampaign>
}

export const useProductFlagsStore = defineStore('product-flags', () => {
  const flags = ref<ProductFlags>({})

  async function getUserProductFlags() {
    const response = await NetworkService.getUserProductFlags()
    flags.value = response.data.flags ?? {}
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
    getUserProductFlags,
    addToProductFlags,
    setImpactStudyCampaigns,
  }
})
