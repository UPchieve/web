import { storeOptions } from '@/store'
import { createStore } from 'vuex'
import { mount } from '@vue/test-utils'
import SessionListItem from '@/views/DashboardView/VolunteerDashboard/ListSessions/SessionListItem.vue'
import type { SessionListItemProps } from '@/views/DashboardView/VolunteerDashboard/ListSessions/SessionListItem.vue'
import { describe, it } from 'vitest'
import { merge } from 'lodash-es'

type Overrides = {
  props?: Partial<SessionListItemProps>
}

const getDefaultProps = (): SessionListItemProps => ({
  session: {
    id: 'session-1',
    studentFirstName: 'Student1',
    student: {
      firstname: 'Student1',
      isShadowBanned: false,
    },
    subject: 'algebraOne',
    subjectDisplayName: 'Algebra 1',
    waitTime: '5 min',
    isLongWait: false,
    topic: 'math',
    isLocked: false,
    isExclusive: false,
    isClaimed: false,
  },
})

const getWrapper = (overrides: Overrides = {}) => {
  const store = createStore(storeOptions)
  return mount(SessionListItem, {
    global: {
      plugins: [store],
    },
    props: merge(getDefaultProps(), overrides.props ?? {}),
  })
}

describe('SessionListItem', () => {
  it('Shows grade level for a student with grade', () => {
    const wrapper = getWrapper({
      props: {
        session: {
          studentFirstName: 'Louise',
          currentGradeName: '9th grade',
        },
      },
    })
    const text = wrapper.get('[data-testid="student-name-and-grade"]').text()
    expect(text).toEqual('Louise · 9th grade')
  })
  it('Does not show grade level if student has no grade', () => {
    const wrapper = getWrapper({
      props: {
        session: {
          studentFirstName: 'Louise',
          currentGradeName: undefined,
        },
      },
    })
    const text = wrapper.get('[data-testid="student-name-and-grade"]').text()
    expect(text).toEqual('Louise')
  })
})
