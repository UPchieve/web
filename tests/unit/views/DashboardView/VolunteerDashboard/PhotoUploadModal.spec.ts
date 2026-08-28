import { it, expect, vi, beforeEach, describe } from 'vitest'
import { mount } from '@vue/test-utils'
import { createStore } from 'vuex'
import { storeOptions } from '@/store'
import PhotoUploadModal from '@/views/DashboardView/VolunteerDashboard/PhotoUploadModal.vue'
import NetworkService from '@/services/NetworkService'
import * as ImagePipeline from '@/utils/image-pipeline'

vi.mock('@/services/NetworkService')
vi.mock('@/utils/image-pipeline')

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

describe('submitPhoto', () => {
  const fakeFile = new File(['fake-image-bytes'], 'photo.png', {
    type: 'image/png',
  })

  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(ImagePipeline.processImage).mockResolvedValue(fakeFile)
  })

  it('shows the server error message when the upload is rejected', async () => {
    vi.mocked(NetworkService.uploadVolunteerPhoto).mockRejectedValueOnce({
      response: {
        data: {
          err: "This image can't be uploaded because it doesn't meet our content guidelines. Please choose a different file.",
        },
      },
    })

    const wrapper = getWrapper()
    wrapper.vm.file = fakeFile
    wrapper.vm.photo = 'blob:fake-preview-url'

    await wrapper.vm.submitPhoto()

    expect(wrapper.vm.error).toEqual(
      "This image can't be uploaded because it doesn't meet our content guidelines. Please choose a different file."
    )
  })

  it('shows a generic error message when the upload fails without a server message', async () => {
    vi.mocked(NetworkService.uploadVolunteerPhoto).mockRejectedValueOnce(
      new Error('Network Error')
    )

    const wrapper = getWrapper()
    wrapper.vm.file = fakeFile
    wrapper.vm.photo = 'blob:fake-preview-url'

    await wrapper.vm.submitPhoto()

    expect(wrapper.vm.error).toEqual(
      'Sorry, we had trouble uploading your photo.'
    )
  })
})
