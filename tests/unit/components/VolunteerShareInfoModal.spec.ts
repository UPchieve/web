import VolunteerShareInfoModal from '@/components/VolunteerShareInfoModal.vue'
import Modal from '@/components/Modal.vue'
import UserService from '@/services/UserService'
import NetworkService from '@/services/NetworkService'
import { useProductFlagsStore } from '@/stores/product-flags'
import { it, describe, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createStore } from 'vuex'

function getWrapper(closeModal = vi.fn(), fromProfile = false) {
  const store = createStore({
    modules: {
      user: {
        namespaced: true,
        state: { user: { publicProfileKeys: null } },
      },
    },
  })
  return mount(VolunteerShareInfoModal, {
    props: {
      closeModal,
      fromProfile,
      info: {
        occupations: [],
        numSessionsTutored: 0,
        numStudentsTutored: 0,
        totalHoursTutored: 0,
      },
    },
    global: { plugins: [store], stubs: { 'router-link': true } },
  })
}

describe('VolunteerShareInfoModal', () => {
  beforeEach(() => {
    vi.spyOn(NetworkService, 'setShareInfoModalDismissed').mockResolvedValue({
      shareInfoModalDismissedAt: '2026-11-03T15:00:00.000Z',
    })
    ;(NetworkService.setShareInfoModalDismissed as any).mockClear()
    vi.spyOn(UserService, 'setProfile').mockResolvedValue(undefined as any)
    ;(UserService.setProfile as any).mockClear()
  })

  it('saves nothing to the profile when dismissed, and records the dismissal', async () => {
    const closeModal = vi.fn()
    const wrapper = getWrapper(closeModal)

    const dismiss = wrapper
      .findComponent(Modal)
      .props('closeModal') as () => void
    dismiss()
    await flushPromises()

    expect(UserService.setProfile).not.toHaveBeenCalled()
    expect(closeModal).toHaveBeenCalledTimes(1)
    expect(NetworkService.setShareInfoModalDismissed).toHaveBeenCalledTimes(1)
    expect(useProductFlagsStore().flags.shareInfoModalDismissedAt).toBe(
      '2026-11-03T15:00:00.000Z'
    )
  })

  it('does not record a dismissal when closed from the profile', async () => {
    const closeModal = vi.fn()
    const wrapper = getWrapper(closeModal, true)

    const dismiss = wrapper
      .findComponent(Modal)
      .props('closeModal') as () => void
    dismiss()
    await flushPromises()

    expect(closeModal).toHaveBeenCalledTimes(1)
    expect(NetworkService.setShareInfoModalDismissed).not.toHaveBeenCalled()
    expect(
      useProductFlagsStore().flags.shareInfoModalDismissedAt
    ).toBeUndefined()
  })
})
