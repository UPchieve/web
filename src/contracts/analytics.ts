import type { AnalyticPersonPropertiesPublic } from '@/types/analytics'

export type FeatureFlagResponse =
  | {
      id: string
      featureFlags: Record<string, string | boolean>
      featureFlagPayloads: Record<string, unknown>
      personProperties: Partial<AnalyticPersonPropertiesPublic>
    }
  | {
      id: string
    }
