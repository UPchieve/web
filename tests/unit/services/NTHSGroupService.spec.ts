import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CheckboxStatus,
  toggleCheckbox,
  type ChecklistItem,
} from '@/services/NTHSGroupService'

const dispatch = vi.fn()
vi.mock('@/store', () => ({
  default: { dispatch: (...args: unknown[]) => dispatch(...args) },
}))

const createActionForNTHSGroup = vi.fn()
const deleteActionForNTHSGroup = vi.fn()
vi.mock('@/services/NetworkService', () => ({
  default: {
    createActionForNTHSGroup: (...args: unknown[]) =>
      createActionForNTHSGroup(...args),
    deleteActionForNTHSGroup: (...args: unknown[]) =>
      deleteActionForNTHSGroup(...args),
  },
}))

const LOCKED_ITEM: ChecklistItem = {
  text: 'Choose your chapter type',
  status: CheckboxStatus.NotDone,
  actionName: 'MARKED SCHOOL AFFILIATION IN PROGRESS',
  locked: true,
}

beforeEach(() => {
  dispatch.mockReset()
  createActionForNTHSGroup.mockReset()
  deleteActionForNTHSGroup.mockReset()
})

describe('toggleCheckbox', () => {
  it('refuses a locked item, with no network call and no store dispatch', async () => {
    const result = await toggleCheckbox({
      item: LOCKED_ITEM,
      groupId: 'group-123',
    })

    expect(result).toBe(false)
    expect(createActionForNTHSGroup).not.toHaveBeenCalled()
    expect(deleteActionForNTHSGroup).not.toHaveBeenCalled()
    expect(dispatch).not.toHaveBeenCalled()
  })
})
