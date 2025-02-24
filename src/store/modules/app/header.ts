export type HeaderState = {
  isShown: boolean
}

export default {
  namespaced: true,
  state: {
    isShown: false,
  } as HeaderState,
  mutations: {
    setIsShown: (state: HeaderState, b: boolean) => (state.isShown = !!b),
  },
}
