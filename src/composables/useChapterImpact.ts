import { inject, provide, ref, type InjectionKey } from 'vue'
import { getNTHSChapterImpact } from '@/services/NetworkService'
import type { NTHSChapterImpactPublic } from '@upchieve/api-contracts/nths-groups'
import LoggerService from '@/services/LoggerService'

export function useChapterImpact() {
  const impact = ref<NTHSChapterImpactPublic>()
  const loadFailed = ref(false)
  // Overlapping loads can settle out of order, so the newest writes, or any
  // success while no numbers are shown.
  let latestLoadId = 0

  // Numbers already on screen stay through a failed load, with no failure shown.
  async function load(groupId: string) {
    const loadId = ++latestLoadId
    loadFailed.value = false
    try {
      const response = await getNTHSChapterImpact(groupId)
      if (loadId === latestLoadId || !impact.value) {
        impact.value = response.impact
        loadFailed.value = false
      }
    } catch (err) {
      if (loadId === latestLoadId && !impact.value) {
        loadFailed.value = true
      }
      LoggerService.noticeError(err, 'Could not load the NTHS chapter impact')
    }
  }

  return { impact, loadFailed, load }
}

type ChapterImpact = ReturnType<typeof useChapterImpact>

const CHAPTER_IMPACT_KEY: InjectionKey<ChapterImpact> = Symbol('chapterImpact')

export function provideChapterImpact(): ChapterImpact {
  const chapterImpact = useChapterImpact()
  provide(CHAPTER_IMPACT_KEY, chapterImpact)
  return chapterImpact
}

export function injectChapterImpact(): ChapterImpact {
  const chapterImpact = inject(CHAPTER_IMPACT_KEY)
  if (!chapterImpact) {
    throw new Error('injectChapterImpact needs provideChapterImpact above it')
  }
  return chapterImpact
}
