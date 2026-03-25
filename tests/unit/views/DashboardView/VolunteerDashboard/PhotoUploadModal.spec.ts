import { it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import { storeOptions } from '@/store'
import PhotoUploadModal from '@/views/DashboardView/VolunteerDashboard/PhotoUploadModal.vue'

const DEFAULT_USER_STATE = {
  user: {
    photoIdStatus: null,
    roleContext: {
      roles: ['volunteer'],
    },
  },
}
function getWrapper(overrides = {}) {
  const store = createStore({
    ...storeOptions,
    modules: {
      user: {
        ...storeOptions.modules.user,
        state: {
          ...DEFAULT_USER_STATE,
          ...(overrides?.user?.state ?? {}),
        },
      },
    },
  })
  return mount(PhotoUploadModal, {
    global: {
      plugins: [store],
    },
  })
}

it.each([null, 'empty'])(
  'Renders regular help message',
  async (photoIdStatus) => {
    const wrapper = getWrapper({
      user: {
        state: {
          user: { photoIdStatus },
        },
      },
    })
    const helpText = wrapper.find('[data-testid="help-text"]')
    expect(helpText.isVisible()).toEqual(true)
    expect(helpText.text()).toEqual('Questions? Check out our photo ID FAQs')
  }
)

it('Renders special help message if the last photo ID was rejected', async () => {
  const wrapper = getWrapper({
    user: {
      state: {
        user: { photoIdStatus: 'REJECTED' },
      },
    },
  })
  const helpText = wrapper.find('[data-testid="help-text"]')
  expect(helpText.isVisible()).toEqual(true)
  expect(helpText.text()).toEqual(
    'Your last photo ID was rejected. Check out our photo ID FAQs for tips on choosing an acceptable form of ID.'
  )
})
