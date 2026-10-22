import { it, vi } from 'vitest'
import { createStore } from 'vuex'
import { storeOptions } from '@/store'

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
    schoolId: 'school-123',
    isOnboarded: false,
    isApproved: false,
    certifications: [],
    gradeLevel: '8th',
    usesClever: false,
    usesGoogle: true,
  }

  const getStore = (args = {}) => {
    return createStore({
      modules: {
        ...storeOptions.modules,
        featureFlags: {
          ...storeOptions.modules.featureFlags,
          getters: {
            showDashboardRedesign: vi.fn().mockReturnValue(false),
          },
        },
        user: {
          ...storeOptions.modules.user,
          state: {
            user: {
              ...baseUser,
              ...(args.user?.state.user ?? {}),
            },
          },
          getters: {
            ...storeOptions.modules.user.getters,
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

    it('Omits school partner props when the school is not a partner', () => {
      const store = getStore({
        user: {
          state: {
            user: {
              isSchoolPartner: false,
            },
          },
        },
      })
      const actual = store.getters['user/getUserPropsForAnalytics']()
      expect(actual).not.toHaveProperty('schoolPartner')
      expect(actual).not.toHaveProperty('partnerSchoolId')
      expect(actual).not.toHaveProperty('partnerSchoolName')
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
          partnerSchoolId: baseUser.schoolId,
          partnerSchoolName: baseUser.schoolName,
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

    it('Sets sessionsAsTutor for coaches only', () => {
      const propsFor = (roles, sessionsAsTutor) =>
        getStore({
          user: {
            state: { user: { roleContext: { roles }, sessionsAsTutor } },
          },
        }).getters['user/getUserPropsForAnalytics']()
      expect(propsFor(['volunteer'], 4).sessionsAsTutor).toBe(4)
      expect(propsFor(['student'], 4)).not.toHaveProperty('sessionsAsTutor')
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
          certifications: ['upchieve101', 'prealgebra'],
        })
      )
    })
  })

  describe('addCertification', () => {
    it('Overrides an existing certification or adds a new one', async () => {
      const store = getStore({
        user: {
          state: {
            user: {
              certifications: {
                algebraOne: {
                  passed: false,
                  tries: 1,
                },
              },
            },
          },
        },
      })

      await store.dispatch('user/addCertification', {
        certificationName: 'algebraOne',
        certificationInfo: {
          passed: true,
          tries: 2,
        },
      })
      const updated = store.state.user.user.certifications
      expect(updated).toEqual({
        algebraOne: {
          passed: true,
          tries: 2,
        },
      })
    })

    it('Adds a new certification', async () => {
      const store = getStore({
        user: {
          state: {
            user: {
              certifications: {
                algebraOne: {
                  passed: false,
                  tries: 1,
                },
              },
            },
          },
        },
      })

      await store.dispatch('user/addCertification', {
        certificationName: 'dei',
        certificationInfo: {
          passed: true,
          tries: 2,
        },
      })
      const updated = store.state.user.user.certifications
      expect(updated).toEqual({
        algebraOne: {
          passed: false,
          tries: 1,
        },
        dei: {
          passed: true,
          tries: 2,
        },
      })
    })
  })

  describe('hasCertification', () => {
    it('Returns whether the user has the given certification (and it is passed)', () => {
      const store = getStore({
        user: {
          state: {
            user: {
              certifications: {
                algebraOne: { passed: true },
                dei: { passed: false },
              },
            },
          },
        },
      })
      expect(store.getters['user/hasCertification']('algebraOne')).toEqual(true)
      expect(store.getters['user/hasCertification']('dei')).toEqual(false)
    })
  })

  describe('hasASubjectCertification', () => {
    it('Does not return true if all certs are non-subject certs', () => {
      const store = getStore({
        user: {
          state: {
            user: {
              certifications: {
                coachingStrategies: { passed: true },
                academicIntegrity: { passed: true },
                dei: { passed: true },
                communitySafety: { passed: true },
                upchieve101: { passed: true },
              },
            },
          },
        },
      })
      expect(store.getters['user/hasASubjectCertification']).toEqual(false)
    })

    it('Returns true if there is at least one passed subject certification', () => {
      const store = getStore({
        user: {
          state: {
            user: {
              certifications: {
                coachingStrategies: { passed: true },
                academicIntegrity: { passed: true },
                dei: { passed: true },
                communitySafety: { passed: true },
                upchieve101: { passed: true },
                algebraOne: { passed: true },
              },
            },
          },
        },
      })
      expect(store.getters['user/hasASubjectCertification']).toEqual(true)
    })

    it('Returns false if there is a subject cert but it has not been passed', () => {
      const store = getStore({
        user: {
          state: {
            user: {
              certifications: {
                coachingStrategies: { passed: true },
                academicIntegrity: { passed: true },
                dei: { passed: true },
                communitySafety: { passed: true },
                upchieve101: { passed: true },
                algebraOne: { passed: false },
              },
            },
          },
        },
      })
      expect(store.getters['user/hasASubjectCertification']).toEqual(false)
    })
  })

  describe('hasExistingStudentSchool', () => {
    it('Returns true when a user with the student role has a student school', () => {
      const store = getStore({
        user: { state: { user: { studentSchoolId: 'school-abc' } } },
      })
      expect(store.getters['user/hasExistingStudentSchool']).toEqual(true)
    })

    it('Returns false when the user has the student role but no student school', () => {
      const store = getStore()
      expect(store.getters['user/hasExistingStudentSchool']).toEqual(false)
    })

    it('Returns false when the user does not have the student role', () => {
      const store = getStore({
        user: {
          state: {
            user: {
              roleContext: { roles: ['volunteer'] },
              studentSchoolId: 'school-abc',
            },
          },
        },
      })
      expect(store.getters['user/hasExistingStudentSchool']).toEqual(false)
    })
  })

  describe('setChatSessionId', () => {
    const seedChat = async (store, sessionId) => {
      await store.dispatch('user/setChatSessionId', sessionId)
      store.commit('user/markChatMessageUnread', 3)
    }

    it('Clears unread indices when the session id changes', async () => {
      const store = getStore()
      await seedChat(store, 'session-1')
      await store.dispatch('user/setChatSessionId', 'session-2')
      expect(store.state.user.unreadChatMessageIndices).toEqual([])
    })

    it('Keeps unread indices when the session id is unchanged', async () => {
      const store = getStore()
      await seedChat(store, 'session-1')
      await store.dispatch('user/setChatSessionId', 'session-1')
      expect(store.state.user.unreadChatMessageIndices).toEqual([3])
    })
  })

  describe('sessionStatus', () => {
    const student = { userType: 'student' }
    const volunteer = (extra = {}) => ({
      userType: 'volunteer',
      isOnboarded: true,
      isApproved: true,
      ...extra,
    })
    const liveSession = { id: 'session-1', createdAt: new Date() }

    // `setUser` replaces the whole user, so `baseUser` does not leak in.
    const getStatusStore = (user = {}, session) => {
      const store = getStore()
      store.commit('user/setUser', user)
      if (session) store.commit('user/setSession', session)
      return store
    }

    it.each([
      [
        'a student who is not in a session',
        student,
        { text: 'Ready to chat', class: '' },
      ],
      [
        'an onboarded, approved volunteer',
        volunteer(),
        { text: 'Ready to help', class: '' },
      ],
      [
        'a completely banned user',
        { ...student, banType: 'complete' },
        { text: 'Paused', class: 'indicator--banned' },
      ],
      [
        'a shadow-banned user (not treated as banned)',
        { ...student, banType: 'shadow' },
        { text: 'Ready to chat', class: '' },
      ],
      [
        'a volunteer who has not finished onboarding',
        volunteer({ isOnboarded: false }),
        { text: 'Onboarding', class: 'indicator--onboarding' },
      ],
      [
        'an onboarded volunteer who is not yet approved',
        volunteer({ isApproved: false }),
        { text: 'Pending approval', class: 'indicator--onboarding' },
      ],
    ])('Reports %s', (_label, user, expected) => {
      const store = getStatusStore(user)
      expect(store.getters['user/sessionStatus']).toEqual(expected)
    })

    it('Reports "Chat in session" while a session is alive', () => {
      const store = getStatusStore(student, liveSession)
      expect(store.getters['user/sessionStatus']).toEqual({
        text: 'Chat in session',
        class: 'indicator--session',
      })
    })

    it('Does not report a session once it has ended', () => {
      const store = getStatusStore(student, {
        ...liveSession,
        endedAt: new Date(),
      })
      expect(store.getters['user/sessionStatus']).toEqual({
        text: 'Ready to chat',
        class: '',
      })
    })

    it('Lets "Chat in session" win the text over "Paused"', () => {
      const store = getStatusStore(
        { ...student, banType: 'complete' },
        liveSession
      )
      expect(store.getters['user/sessionStatus'].text).toBe('Chat in session')
    })

    it('Lets "Onboarding" win the text over "Chat in session"', () => {
      const store = getStatusStore(
        volunteer({ isOnboarded: false }),
        liveSession
      )
      expect(store.getters['user/sessionStatus'].text).toBe('Onboarding')
    })

    it('Appends overlapping classes without a separator (current behaviour)', () => {
      const store = getStatusStore(
        { ...student, banType: 'complete' },
        liveSession
      )
      expect(store.getters['user/sessionStatus'].class).toBe(
        'indicator--bannedindicator--session'
      )
    })

    it('Tolerates a user with no fields', () => {
      const store = getStatusStore({})
      expect(store.getters['user/sessionStatus']).toEqual({
        text: 'Ready to chat',
        class: '',
      })
    })

    it('Recomputes when the user or session changes', () => {
      const store = getStatusStore(student)
      expect(store.getters['user/sessionStatus'].text).toBe('Ready to chat')

      store.commit('user/setSession', liveSession)
      expect(store.getters['user/sessionStatus'].text).toBe('Chat in session')

      store.commit('user/setUser', { ...student, banType: 'complete' })
      expect(store.getters['user/sessionStatus'].class).toBe(
        'indicator--bannedindicator--session'
      )
    })
  })
})
