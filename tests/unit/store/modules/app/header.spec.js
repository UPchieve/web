import headerModule from '@/store/modules/app/header'

const { state, mutations } = headerModule

describe('`app/header` store module', () => {
  it('state', () => {
    expect(state).toEqual({
      isShown: false,
    })
  })

  describe('mutations', () => {
    it('setIsShown', () => {
      expect(typeof mutations.setIsShown).toBe('function')
      const state = { isShown: false }
      mutations.setIsShown(state, true)
      expect(state.isShown).toBe(true)
    })
  })
})
