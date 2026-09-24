import {
  NTHS_ORIENTATION_URL,
  NTHS_RESOURCES_URL,
} from '@/services/NTHSGroupService'
import NTHSResourcesView from '@/views/NTHS/Tabs/NTHSResourcesView.vue'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { createStore } from 'vuex'

function linksFor(roleName: string) {
  const store = createStore({
    state: {
      nths: {
        NTHSGroups: [
          { groupInfo: { id: 'group-123' }, memberInfo: { roleName } },
        ],
      },
    },
    getters: {
      'nths/hasAdminRole': () => roleName === 'admin',
    },
  })
  const wrapper = mount(NTHSResourcesView, { global: { plugins: [store] } })
  return wrapper.findAll('a').map((link) => link.attributes('href'))
}

enableAutoUnmount(afterEach)

describe('NTHSResourcesView', () => {
  it('shows an admin the president orientation and the resource library', () => {
    expect(linksFor('admin')).toEqual([
      NTHS_ORIENTATION_URL,
      NTHS_RESOURCES_URL,
    ])
  })

  it('keeps the president orientation from a member', () => {
    expect(linksFor('member')).toEqual([NTHS_RESOURCES_URL])
  })
})
