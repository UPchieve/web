import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import AdminEditUser from '@/views/Admin/AdminEditUser.vue'
import NetworkService from '@/services/NetworkService'

describe('AdminEditUser.vue', () => {
  const DEFAULT_USER = {
    firstName: 'Student',
    lastName: 'Test',
    email: 'student@test.com',
    partnerOrg: {},
    partnerSchool: {},
    partnerSite: '',
    isVerified: false,
    isBanned: false,
    isDeactivated: false,
    isApproved: false,
    inGatesStudy: false,
    isAdmin: false,
    studentPartnerOrg: 'studentPartnerOrg',
    volunteerPartnerOrg: 'volunteerPartnerOrg',
  }

  const getWrapper = (overrides = {}) => {
    const localUser = { ...DEFAULT_USER, ...(overrides.user ?? {}) }

    return mount(AdminEditUser, {
      props: {
        user: localUser,
        toggleEditMode: vi.fn(),
        getUser: vi.fn(),
      },
    })
  }

  it('should show TRUE OR FALSE options for banned for volunteers', async () => {
    NetworkService.adminGetVolunteerPartners = vi
      .fn()
      .mockResolvedValueOnce({ data: { partnerOrgs: [] } })
    const wrapper = getWrapper({
      user: { userType: 'volunteer', roles: ['volunteer'] },
    })

    await flushPromises()

    const options = wrapper
      .findComponent('[data-testid="admin-edit-user-banned"]')
      .props().options

    const optionTexts = options.map((o) => o.text)

    expect(optionTexts).toContain('None')
    expect(optionTexts).toContain('Complete Ban')
    expect(optionTexts).toContain('Live Media Ban')
  })

  it('should show NONE, COMPLETE OR SHADOW options for banned for students', async () => {
    NetworkService.adminGetStudentPartners = vi
      .fn()
      .mockResolvedValueOnce({ data: { partnerOrgs: [] } })
    NetworkService.adminGetActivePartnersForStudent = vi
      .fn()
      .mockResolvedValueOnce({ data: { activePartners: [] } })
    const wrapper = getWrapper({ user: { userType: 'student' } })

    await flushPromises()

    const options = wrapper
      .findComponent('[data-testid="admin-edit-user-banned"]')
      .props().options

    const optionTexts = options.map((o) => o.text)

    expect(optionTexts).toContain('None')
    expect(optionTexts).toContain('Complete Ban')
    expect(optionTexts).toContain('Shadow Ban')
    expect(optionTexts).toContain('Live Media Ban')
  })
})
