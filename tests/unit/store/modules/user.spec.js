import userModule from '@/store/modules/user'
import productFlagsModule from '@/store/modules/product-flags'
import { it, vi } from 'vitest'
import { createStore } from 'vuex'

describe('User store module', () => {
  const baseUser = {
    id: '123',
    userType: 'volunteer',
    createdAt: new Date(),
    pastSessions: [],
    banType: null,
    isTestUser: false,
    roleContext: {
      roles: ['volunteer', 'student', 'teacher'],
    },
    occupation: ['High school student'],
    isSchoolPartner: true,
    schoolName: 'Test School',
    isOnboarded: false,
    isApproved: false,
    certifications: [],
    gradeLevel: '8th',
    usesClever: false,
    usesGoogle: true,
  }
  const mockFeatureFlagsModule = {
    namespaced: true,
    getters: {
      showDashboardRedesign: vi.fn().mockReturnValue(false),
      eligibleForChooseTutorType: vi.fn().mockReturnValue(false),
    },
    state: {},
    actions: {},
    mutations: {},
  }

  const getStore = (args = {}) => {
    return createStore({
      modules: {
        productFlags: {
          ...productFlagsModule,
          flags: {
            fallIncentiveEnrollmentAt: new Date(),
          },
        },
        featureFlags: {
          ...mockFeatureFlagsModule,
        },
        user: {
          ...userModule,
          state: {
            user: {
              ...baseUser,
              ...(args.user?.state.user ?? {}),
            },
          },
          getters: {
            ...userModule.getters,
            ...(args.user?.getters ?? {}),
          },
        },
      },
    })
  }

  describe('addToUser', () => {
    it('Adds new top level user prop', async () => {
      const store = getStore({
        user: {
          state: {
            user: {
              someProp: 'someValue',
            },
          },
        },
      })
      expect(store.state.user.user).toEqual(
        expect.objectContaining({ someProp: 'someValue' })
      )
      await store.dispatch('user/addToUser', {
        anotherProp: 'anotherValue',
      })
      expect(store.state.user.user).toEqual(
        expect.objectContaining({
          someProp: 'someValue',
          anotherProp: 'anotherValue',
        })
      )
    })

    it('Updates existing top level user prop', async () => {
      const store = getStore({
        user: {
          state: {
            user: {
              someProp: 'someValue',
            },
          },
        },
      })
      expect(store.state.user.user).toEqual(
        expect.objectContaining({ someProp: 'someValue' })
      )
      await store.dispatch('user/addToUser', {
        someProp: 'newValue',
      })
      expect(store.state.user.user).toEqual(
        expect.objectContaining({ someProp: 'newValue' })
      )
    })

    it('Reassigns nested property to the given value', async () => {
      const store = getStore({
        user: {
          state: {
            user: {
              someProp: {
                keyA: 0,
              },
            },
          },
        },
      })
      expect(store.state.user.user).toEqual(
        expect.objectContaining({ someProp: { keyA: 0 } })
      )
      await store.dispatch('user/addToUser', {
        someProp: {
          keyB: 1,
          keyC: 2,
        },
      })
      expect(store.state.user.user).toEqual(
        expect.objectContaining({
          someProp: {
            keyB: 1,
            keyC: 2,
          },
        })
      )
    })
  })

  describe('getUserPropsForAnalytics', () => {
    it.each([
      [
        {
          studentPartnerOrg: 'student-org',
        },
        'student-org',
      ],
      [{ volunteerPartnerOrg: 'vol-org' }, 'vol-org'],
      [
        { volunteerPartnerOrg: null, studentPartnerOrg: 'student-org' },
        'student-org',
      ],
    ])(
      'Correctly sets partner for users who have both the student and volunteer roles',
      (user, expectedOrg) => {
        const store = getStore({
          user: {
            state: {
              user: {
                ...user,
              },
            },
          },
        })
        const actual = store.getters['user/getUserPropsForAnalytics']()
        expect(actual).toEqual(
          expect.objectContaining({
            partner: expectedOrg,
          })
        )
      }
    )

    it('Has no partner', () => {
      const store = getStore({
        user: {
          state: {
            user: {
              volunteerPartnerOrg: null,
              studentPartnerOrg: undefined,
            },
          },
        },
      })
      const actual = store.getters['user/getUserPropsForAnalytics']()
      expect(Object.prototype.hasOwnProperty.call(actual, 'partner')).toEqual(
        false
      )
    })

    it('Includes props from different roles', () => {
      const store = getStore({
        user: {
          state: {
            user: {
              roles: ['student', 'teacher', 'volunteer'],
            },
          },
        },
      })
      const actual = store.getters['user/getUserPropsForAnalytics']()
      expect(actual).toEqual(
        expect.objectContaining({
          // Common fields
          ucId: baseUser.id,
          userType: baseUser.userType,
          createdAt: baseUser.createdAt,
          totalSessions: baseUser.pastSessions.length,
          banType: baseUser.banType,
          isTestUser: baseUser.isTestUser,
          hasStudentRole: true,
          hasVolunteerRole: true,
          hasTeacherRole: true,
          occupation: baseUser.occupation[0],

          // Student-specific fields
          // isSchoolPartner: baseUser.isSchoolPartner,
          schoolPartner: baseUser.schoolName,
          gradeLevel: baseUser.gradeLevel,
          // usesGoogle: baseUser.usesGoogle,

          // Volunteer-specific fields
          onboarded: baseUser.isOnboarded,
          approved: baseUser.isApproved,
          // certificationInfo: baseUser.certifications,
          hasSubjectCertification: false,

          // Teacher-specific fields
          // usesClever: baseUser.usesClever, // note: also a teacher field
        })
      )
    })

    it('Sets certification properties', () => {
      const store = getStore({
        user: {
          state: {
            user: {
              volunteerPartnerOrg: null,
              studentPartnerOrg: undefined,
              certifications: {
                upchieve101: {
                  passed: true,
                },
                prealgebra: {
                  passed: true,
                },
              },
            },
          },
        },
      })
      const actual = store.getters['user/getUserPropsForAnalytics']()
      expect(actual).toEqual(
        expect.objectContaining({
          prealgebra: true,
          upchieve101: true,
        })
      )
    })
  })
})
