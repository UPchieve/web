import type { DAYS, HOURS } from '@/constants/availability'

export type DAYS = (typeof DAYS)[number]
export type HOURS = (typeof HOURS)[number]

export type AvailabilityDay = {
  [hour in HOURS]: boolean
}

export type Availability = {
  [day in DAYS]: AvailabilityDay
}
