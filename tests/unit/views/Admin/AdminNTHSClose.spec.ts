import AdminNTHSClose from '@/views/Admin/AdminNTHSClose.vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const A = '11111111-1111-4111-8111-111111111111'
const B = '22222222-2222-4222-8222-222222222222'

vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-router')>()),
  useRoute: () => ({
    query: { ids: `${A}, ${B}` },
  }),
}))

const adminNTHSGetChapters = vi.fn()
const adminNTHSCloseChapters = vi.fn()
vi.mock('@/services/NetworkService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/NetworkService')>()),
  adminNTHSGetChapters: (...args: unknown[]) => adminNTHSGetChapters(...args),
  adminNTHSCloseChapters: (...args: unknown[]) =>
    adminNTHSCloseChapters(...args),
}))

const showConfirm = vi.fn()
vi.mock('@/services/ModalService', () => ({
  default: { showConfirm: (...args: unknown[]) => showConfirm(...args) },
}))

function chapter(id: string, name: string) {
  return {
    id,
    name,
    createdAt: '2025-09-01T00:00:00.000Z',
    closedAt: null,
    schoolName: null,
    currentMemberCount: 3,
    presidents: [],
  }
}

async function mountPage() {
  const wrapper = mount(AdminNTHSClose)
  await flushPromises()
  return wrapper
}

describe('AdminNTHSClose', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    adminNTHSGetChapters.mockResolvedValue({
      chapters: [chapter(A, 'Alpha'), chapter(B, 'Beta')],
    })
  })

  it('requests the chapters in the link', async () => {
    await mountPage()
    expect(adminNTHSGetChapters).toHaveBeenCalledWith([A, B])
  })

  it('sends only ticked chapters', async () => {
    showConfirm.mockResolvedValue(true)
    adminNTHSCloseChapters.mockResolvedValue({
      results: [{ chapterId: A, status: 'closed' }],
    })
    const wrapper = await mountPage()
    await wrapper.findAll('input[type="checkbox"]')[1].setValue(false)
    await wrapper.find('button').trigger('click')
    await flushPromises()
    expect(adminNTHSCloseChapters).toHaveBeenCalledWith([A])
  })

  it('leaves an already closed chapter out of the close', async () => {
    showConfirm.mockResolvedValue(true)
    adminNTHSGetChapters.mockResolvedValue({
      chapters: [
        chapter(A, 'Alpha'),
        { ...chapter(B, 'Beta'), closedAt: '2026-10-01T00:00:00.000Z' },
      ],
    })
    adminNTHSCloseChapters.mockResolvedValue({
      results: [{ chapterId: A, status: 'closed' }],
    })
    const wrapper = await mountPage()
    expect(wrapper.findAll('input[type="checkbox"]')).toHaveLength(1)
    await wrapper.find('button').trigger('click')
    await flushPromises()
    expect(adminNTHSCloseChapters).toHaveBeenCalledWith([A])
  })

  it('sends nothing when the confirm is declined', async () => {
    showConfirm.mockResolvedValue(false)
    const wrapper = await mountPage()
    await wrapper.find('button').trigger('click')
    await flushPromises()
    expect(adminNTHSCloseChapters).not.toHaveBeenCalled()
  })

  it('shows staff a chapter that failed to close', async () => {
    showConfirm.mockResolvedValue(true)
    adminNTHSCloseChapters.mockResolvedValue({
      results: [
        { chapterId: A, status: 'closed' },
        { chapterId: B, status: 'failed' },
      ],
    })
    const wrapper = await mountPage()
    await wrapper.find('button').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('did not close')
    expect(wrapper.text()).toContain('Beta (Failed)')
  })

  it('reloads the chapters when the close request fails, keeping unticked ones unticked', async () => {
    showConfirm.mockResolvedValue(true)
    adminNTHSCloseChapters.mockRejectedValue(new Error('timeout'))
    const wrapper = await mountPage()
    await wrapper.findAll('input[type="checkbox"]')[1].setValue(false)
    await wrapper.find('button').trigger('click')
    await flushPromises()
    expect(adminNTHSGetChapters).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('Could not close chapters: timeout')
    const boxes = wrapper.findAll<HTMLInputElement>('input[type="checkbox"]')
    expect(boxes.map((box) => box.element.checked)).toEqual([true, false])
  })
})
