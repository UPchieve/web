import { mount } from '@vue/test-utils'
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

    return mount(
      AdminEditUser,
      {
        props: {
          user: localUser,
          toggleEditMode: vi.fn(),
          getUser: vi.fn(),
        },
      }
    )
  }

  it('should show TRUE OR FALSE options for banned for volunteers', async () => {
    NetworkService.adminGetVolunteerPartners = vi
      .fn()
      .mockResolvedValueOnce({ data: { partnerOrgs: [] } })
    const wrapper = getWrapper({ user: { userType: 'volunteer' } })

    const options = wrapper
      .find('[data-testid="admin-edit-user-banned"]')
      .findAll('option')
    const optionTexts = options.map((o) => o.text())

    expect(optionTexts).toContain('False')
    expect(optionTexts).toContain('True')
  })

  it('should show NONE, COMPLETE OR SHADOW options for banned for students', async () => {
    NetworkService.adminGetStudentPartners = vi
      .fn()
      .mockResolvedValueOnce({ data: { partnerOrgs: [] } })
    NetworkService.adminGetActivePartnersForStudent = vi
      .fn()
      .mockResolvedValueOnce({ data: { activePartners: [] } })
    const wrapper = getWrapper({ user: { userType: 'student' } })

    const options = wrapper
      .find('[data-testid="admin-edit-user-banned"]')
      .findAll('option')
    const optionTexts = options.map((o) => o.text())

    expect(optionTexts).toContain('None')
    expect(optionTexts).toContain('Complete Ban')
    expect(optionTexts).toContain('Shadow Ban')
  })
})
