import type { Page } from '@playwright/test'
import { MAX_MOBILE_MODE_WIDTH } from '@/consts'

export const isMobileViewport = (page: Page): boolean =>
  page.viewportSize()!.width <= MAX_MOBILE_MODE_WIDTH
