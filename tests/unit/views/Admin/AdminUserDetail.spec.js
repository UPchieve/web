import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import { createStore } from 'vuex'
import AdminUserDetail from '@/views/Admin/AdminUserDetail.vue'
import NetworkService from '@/services/NetworkService'

describe('Admin User Detail', () => {
  const DEFAULT_USER = {
    id: '12345',
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
    isAdmin: false,
    userType: 'student',
    pastSessions: [],
  }

  // The volunteer role renders background/reference sections that DEFAULT_USER,
  // written for a student, never populated.
  const VOLUNTEER_RENDER_FIELDS = {
    isApproved: true,
    background: {},
    references: [],
  }

  const getWrapper = async () => {
    const wrapper = mount(AdminUserDetail, {
      global: {
        plugins: [createStore()],
        mocks: {
          $route: {
            query: { page: '1' },
            params: { userId: '12345' },
          },
        },
      },
    })

    await new Promise((resolve) => setTimeout(resolve))

    return wrapper
  }

  it.each([
    [{ banType: 'shadow' }, 'shadowbanned'],
    [{ isAdmin: true }, 'admin'],
    [{ banType: 'complete' }, 'banned'],
    [{ isDeactivated: true }, 'deactivated'],
    [{ isTestUser: true }, 'test'],
    [{ isFakeUser: true }, 'fake'],
  ])('show correct label if property is true', async (arg, label) => {
    NetworkService.adminGetUser = vi.fn().mockResolvedValue({
      data: {
        ...DEFAULT_USER,
        ...arg,
      },
    })

    const wrapper = await getWrapper()

    const result = wrapper.find(`[data-testid="user-detail-label-${label}"]`)

    expect(result.exists()).toBeTruthy()
  })

  it.each([
    [['volunteer'], ['volunteer']],
    [['student'], ['student']],
    [['teacher'], ['teacher']],
    [
      ['student', 'volunteer'],
      ['volunteer', 'student'],
    ],
    [
      ['admin', 'volunteer'],
      ['volunteer', 'admin'],
    ],
  ])('shows a chip for each of the roles %j', async (roles, expectedChips) => {
    NetworkService.adminGetUser = vi.fn().mockResolvedValue({
      data: { ...DEFAULT_USER, ...VOLUNTEER_RENDER_FIELDS, roles },
    })

    const wrapper = await getWrapper()

    for (const role of ['volunteer', 'student', 'teacher', 'admin']) {
      const chip = wrapper.find(`[data-testid="user-detail-role-${role}"]`)
      expect(chip.exists()).toBe(expectedChips.includes(role))
    }
  })

  it('does not describe the volunteer role as experimental', async () => {
    NetworkService.adminGetUser = vi.fn().mockResolvedValue({
      data: {
        ...DEFAULT_USER,
        ...VOLUNTEER_RENDER_FIELDS,
        roles: ['student', 'volunteer'],
      },
    })

    const wrapper = await getWrapper()
    const text = wrapper.text()

    expect(text).not.toContain('experimental')
    expect(text).not.toContain('primary')
    expect(text).not.toContain('part of an experiment')
  })

  it.each([
    [{ banType: null }, 'shadowbanned'],
    [{ isAdmin: false }, 'admin'],
    [{ banType: null }, 'banned'],
    [{ isDeactivated: false }, 'deactivated'],
    [{ isTestUser: false }, 'test'],
    [{ isFakeUser: false }, 'fake'],
  ])('does not show label if property is false', async (arg, label) => {
    NetworkService.adminGetUser = vi.fn().mockResolvedValue({
      data: {
        ...DEFAULT_USER,
        ...arg,
      },
    })

    const wrapper = await getWrapper()

    const result = wrapper.find(`[data-testid="user-detail-label-${label}"]`)

    expect(result.exists()).toBeFalsy()
  })
})
