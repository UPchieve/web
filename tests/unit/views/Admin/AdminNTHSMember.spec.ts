import AdminNTHSMember from '@/views/Admin/AdminNTHSMember.vue'
import { RouterLinkStub, flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const CHAPTER = '11111111-1111-4111-8111-111111111111'
const USER = '22222222-2222-4222-8222-222222222222'

vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-router')>()),
  useRoute: () => ({ query: { chapterId: CHAPTER, userId: USER } }),
}))

const adminNTHSGetMember = vi.fn()
const adminNTHSUpdateMember = vi.fn()
vi.mock('@/services/NetworkService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/NetworkService')>()),
  adminNTHSGetMember: (...args: unknown[]) => adminNTHSGetMember(...args),
  adminNTHSUpdateMember: (...args: unknown[]) => adminNTHSUpdateMember(...args),
}))

const showConfirm = vi.fn()
vi.mock('@/services/ModalService', () => ({
  default: { showConfirm: (...args: unknown[]) => showConfirm(...args) },
}))

function payload(
  member: Record<string, unknown> = {},
  chapter: Record<string, unknown> = {}
) {
  return {
    member: {
      userId: USER,
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      title: 'Member',
      roleName: 'member',
      joinedAt: '2026-01-01T00:00:00.000Z',
      deactivatedAt: null,
      deleted: false,
      isLastAdmin: false,
      ...member,
    },
    chapter: { id: CHAPTER, name: 'Alpha', closedAt: null, ...chapter },
    otherAdmins: [],
  }
}

async function mountPage(member = {}, chapter = {}) {
  adminNTHSGetMember.mockResolvedValue(payload(member, chapter))
  const wrapper = mount(AdminNTHSMember, {
    global: { stubs: { 'router-link': true } },
  })
  await flushPromises()
  return wrapper
}

function removeButton(wrapper: Awaited<ReturnType<typeof mountPage>>) {
  return wrapper.findAll('button').find((b) => b.text().includes('Remove'))
}

describe('AdminNTHSMember', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    adminNTHSUpdateMember.mockResolvedValue(undefined)
  })

  it('removes only after the confirm is accepted', async () => {
    showConfirm.mockResolvedValue(false)
    const wrapper = await mountPage()
    await removeButton(wrapper)!.trigger('click')
    await flushPromises()
    expect(adminNTHSUpdateMember).not.toHaveBeenCalled()

    showConfirm.mockResolvedValue(true)
    await removeButton(wrapper)!.trigger('click')
    await flushPromises()
    expect(adminNTHSUpdateMember).toHaveBeenCalledWith(CHAPTER, USER, {
      isActive: false,
    })
  })

  it.each([false, true])(
    'confirm names member and chapter (isLastAdmin: %s)',
    async (isLastAdmin) => {
      showConfirm.mockResolvedValue(false)
      const wrapper = await mountPage({ isLastAdmin, roleName: 'admin' })
      await removeButton(wrapper)!.trigger('click')
      await flushPromises()
      const [title, message] = showConfirm.mock.calls[0]
      expect(title).toContain('Ada Lovelace')
      expect(message).toContain('Alpha')
      expect(message.includes('last admin')).toBe(isLastAdmin)
    }
  )

  it('is view-only for a departed member', async () => {
    const wrapper = await mountPage({
      deactivatedAt: '2026-03-01T00:00:00.000Z',
    })
    expect(wrapper.text()).toContain('Departed since')
    expect(wrapper.find('button').exists()).toBe(false)
    expect(wrapper.find('select').exists()).toBe(false)
  })

  it('gives a deleted member no title or admin grant, only removal', async () => {
    const wrapper = await mountPage({ deleted: true })
    expect(wrapper.find('select').exists()).toBe(false)
    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(false)
    expect(wrapper.findAll('button').map((b) => b.text())).toEqual([
      'Remove from chapter',
    ])
  })

  it('offers take admin away for a deleted admin', async () => {
    const wrapper = await mountPage({ deleted: true, roleName: 'admin' })
    const button = wrapper
      .findAll('button')
      .find((b) => b.text() === 'Take admin away')!
    await button.trigger('click')
    await flushPromises()
    expect(adminNTHSUpdateMember).toHaveBeenCalledWith(CHAPTER, USER, {
      role: 'member',
    })
  })

  it('saves role and title together', async () => {
    const wrapper = await mountPage()
    await wrapper.find('input[type="checkbox"]').setValue(true)
    await wrapper.find('select').setValue('President')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(adminNTHSUpdateMember).toHaveBeenCalledWith(CHAPTER, USER, {
      role: 'admin',
      title: 'President',
    })
  })

  it('keeps a President title when Admin is unticked and ticked again', async () => {
    const wrapper = await mountPage({ roleName: 'admin', title: 'President' })
    const admin = wrapper.find('input[type="checkbox"]')
    await admin.setValue(false)
    await admin.setValue(true)
    expect(
      (wrapper.find('button[type="submit"]').element as HTMLButtonElement)
        .disabled
    ).toBe(true)
  })

  it('drops a President pick when Admin is unticked before saving', async () => {
    const wrapper = await mountPage()
    const admin = wrapper.find('input[type="checkbox"]')
    await admin.setValue(true)
    await wrapper.find('select').setValue('President')
    await admin.setValue(false)
    expect((wrapper.find('select').element as HTMLSelectElement).value).toBe(
      'Member'
    )
    expect(
      (wrapper.find('button[type="submit"]').element as HTMLButtonElement)
        .disabled
    ).toBe(true)
  })

  it('lists another admin with a name initial and "No title" for a stored Member title', async () => {
    adminNTHSGetMember.mockResolvedValue({
      ...payload({ roleName: 'admin', title: 'President' }),
      otherAdmins: [
        {
          userId: 'other',
          firstName: 'Ada',
          lastInitial: 'L',
          title: 'Member',
          deleted: false,
        },
      ],
    })
    const wrapper = mount(AdminNTHSMember, {
      global: { stubs: { 'router-link': RouterLinkStub } },
    })
    await flushPromises()
    const item = wrapper.find('ul li')
    expect(item.text()).toContain('Ada L.')
    expect(item.text()).toContain('No title')
  })
})
