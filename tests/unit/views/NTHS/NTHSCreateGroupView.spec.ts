import NTHSCreateGroupView from '@/views/NTHS/NTHSCreateGroupView.vue'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createStore } from 'vuex'

vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-router')>()),
  useRouter: () => ({ replace: vi.fn() }),
}))

function textFor(approvalExpiresAt: string | null) {
  const store = createStore({
    state: { nths: { NTHSGroups: [], approvalExpiresAt } },
  })
  return mount(NTHSCreateGroupView, { global: { plugins: [store] } }).text()
}

enableAutoUnmount(afterEach)

describe('NTHSCreateGroupView', () => {
  it('tells the coach when their approval runs out', () => {
    const iso = '2026-11-20T12:45:00.000Z'
    const d = new Date(iso)
    const h = d.getHours()
    const expected = `You have until November ${d.getDate()} at ${h % 12 || 12} ${h < 12 ? 'AM' : 'PM'} to start your chapter.`
    expect(textFor(iso)).toContain(expected)
  })

  it('leaves the date line out when no expiry is known', () => {
    expect(textFor(null)).not.toContain('You have until')
  })
})
