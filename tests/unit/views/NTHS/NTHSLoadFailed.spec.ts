import NTHSLoadFailed from '@/views/NTHS/NTHSLoadFailed.vue'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { RouterView, createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { loadFailedRoute, loadNTHSData } from '@/views/NTHS/nths-route-helpers'
import { useNthsStore } from '@/stores/nths'

vi.mock('@/services/LoggerService', () => ({
  default: { noticeError: vi.fn() },
}))

const fetchNthsData = vi.fn()

async function getWrapper() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/groups/home',
        component: { render: () => h('div', { 'data-testid': 'routed-home' }) },
        beforeEnter: async (to) =>
          (await loadNTHSData()) ? undefined : loadFailedRoute(to),
      },
      {
        path: '/groups/:attempted(.*)*',
        name: 'NTHSLoadFailed',
        component: NTHSLoadFailed,
      },
    ],
  })
  router.push({
    name: 'NTHSLoadFailed',
    params: { attempted: ['home'] },
    query: { tab: 'x' },
    hash: '#top',
  })
  await router.isReady()

  const wrapper = mount(
    { render: () => h(RouterView) },
    { global: { plugins: [router] } }
  )
  await flushPromises()
  return { wrapper, router }
}

enableAutoUnmount(afterEach)

describe('NTHSLoadFailed', () => {
  beforeEach(() => {
    const nths = useNthsStore()
    nths.NTHSGroups = []
    fetchNthsData.mockReset()
    vi.spyOn(nths, 'fetchNthsData').mockImplementation(fetchNthsData)
  })

  it('takes the coach to the page they asked for once the load succeeds', async () => {
    fetchNthsData.mockResolvedValue([])
    const { wrapper, router } = await getWrapper()

    await wrapper.find('[data-testid="nths-load-retry"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.fullPath).toBe('/groups/home?tab=x#top')
    expect(wrapper.find('[data-testid="routed-home"]').exists()).toBe(true)
  })

  it('keeps the message up when the load fails again', async () => {
    fetchNthsData.mockRejectedValue(new Error('down'))
    const { wrapper, router } = await getWrapper()

    await wrapper.find('[data-testid="nths-load-retry"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('NTHSLoadFailed')
    expect(wrapper.find('[role="status"]').text()).toBe(
      "We still couldn't load NTHS."
    )
    expect(wrapper.find('[data-testid="nths-load-retry"]').text()).toBe(
      'Try again'
    )
  })

  it('starts over with the first message on another failed page', async () => {
    fetchNthsData.mockRejectedValue(new Error('down'))
    const { wrapper, router } = await getWrapper()
    await wrapper.find('[data-testid="nths-load-retry"]').trigger('click')
    await flushPromises()

    await router.push({
      name: 'NTHSLoadFailed',
      params: { attempted: ['resources'] },
    })
    await flushPromises()

    expect(wrapper.find('[role="status"]').text()).toBe(
      "We couldn't load NTHS right now."
    )
  })

  it('says the load failed before any retry', async () => {
    const { wrapper } = await getWrapper()

    expect(wrapper.find('[role="status"]').text()).toBe(
      "We couldn't load NTHS right now."
    )
  })

  it('ignores a second click while the retry is running', async () => {
    fetchNthsData.mockReturnValue(new Promise(() => {}))
    const { wrapper } = await getWrapper()
    const retry = wrapper.find('[data-testid="nths-load-retry"]')

    await retry.trigger('click')
    await retry.trigger('click')
    await flushPromises()

    expect(fetchNthsData).toHaveBeenCalledTimes(1)
    expect(retry.attributes('aria-disabled')).toBe('true')
    expect(wrapper.find('[role="status"]').text()).toBe('')
  })
})
