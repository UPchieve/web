const orbital = window.orbital

export default {
  trigger(discoveryId) {
    orbital('trigger', discoveryId)
  },

  reset() {
    orbital('reset')
  },
}
