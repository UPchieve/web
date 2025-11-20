import { vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createStore } from 'vuex'
import RefreshAppAlert from '@/views/RefreshAppAlert.vue'
import * as VersionService from '@/services/VersionService'
import appModule from '@/store/modules/app/index'

const mockVersionService = vi.mocked(VersionService)
const SERVER_VERSION = '1'
let defaultStore

beforeEach(() => {
  vi.resetAllMocks()
  defaultStore = createStore({
    modules: {
      app: {
        ...appModule,
        state: {
          version: SERVER_VERSION,
        },
      },
    },
  })
  mockVersionService.default.getCurrentServerVersion = vi
    .fn()
    .mockResolvedValue(SERVER_VERSION)
})

const getWrapper = (store = defaultStore) => {
  return mount(RefreshAppAlert, {
    global: {
      plugins: [store],
    },
  })
}

describe('RefreshAppAlert', () => {
  test('Does not show refresh alert', async () => {
    const wrapper = getWrapper(defaultStore)
    expect(
      wrapper.find('[data-testid="refresh-app-ion-alert"]').exists()
    ).toBeFalsy()
  })

  test('Shows refresh alert for new version', async () => {
    const wrapper = getWrapper(defaultStore)
    expect(wrapper.vm.$data.newServerVersionAvailable).toBeFalsy()
    expect(
      wrapper.find('[data-testid="refresh-app-ion-alert"]').exists()
    ).toBeFalsy()

    defaultStore.commit('app/setVersion', '2')
    await flushPromises()

    const alert = wrapper.find('[data-testid="refresh-app-ion-alert"]')
    expect(alert.exists()).toBeTruthy()
    expect(wrapper.vm.getHeader).toEqual('New version of UPchieve available!')
    expect(wrapper.vm.getMessage).toEqual(
      'Upgrade now to get the latest version.'
    )
    expect(wrapper.vm.getButtons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          text: 'Not now',
        }),
        expect.objectContaining({
          text: 'Upgrade',
        }),
      ])
    )
  })
})
