import type {
  NTHSChecklistItemPublic,
  NTHSChecklistPublic,
} from '@upchieve/api-contracts/nths-checklist'

type Section = NTHSChecklistPublic['sections'][number]

export const isProcessed = ({ status }: NTHSChecklistItemPublic) =>
  status === 'complete' || status === 'skipped'

export const checkableCount = (items: NTHSChecklistItemPublic[]) =>
  items.filter((item) => item.checkable).length

export const doneCount = (items: NTHSChecklistItemPublic[]) =>
  items.filter((item) => item.checkable && isProcessed(item)).length

export function doThisNowPick(
  checklist: NTHSChecklistPublic
): NTHSChecklistItemPublic | undefined {
  for (const section of checklist.sections) {
    const item = section.items.find(
      (item) => item.checkable && item.status === 'incomplete'
    )
    if (item) return item
  }
}

export function phaseLabel(sections: Section[], sectionId: number): string {
  let phase = 0
  for (const section of sections) {
    if (checkableCount(section.items) > 0) phase++
    if (section.id === sectionId) {
      return checkableCount(section.items) > 0 ? `Phase ${phase}` : 'All year'
    }
  }
  return 'All year'
}

export function startOpenSectionId(
  checklist: NTHSChecklistPublic
): number | undefined {
  const pick = doThisNowPick(checklist)
  if (!pick) return undefined
  return checklist.sections.find((section) =>
    section.items.some((item) => item.key === pick.key)
  )?.id
}

const startOfLocalDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()

export function showsDueDate(dueDate: string, now = new Date()): boolean {
  return startOfLocalDay(new Date(dueDate)) >= startOfLocalDay(now)
}

export const formatDueDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
