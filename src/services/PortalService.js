import PortalGun from 'portal-gun'

export default {
  portal: new PortalGun(),

  listen() {
    this.portal.listen()

    // fallbacks for any requests up that fail (ie will fail if not native app or service worker req)
    // eg
    // portal.on('push.register', pushRegisterFn);
  },

  call(method, data) {
    return (
      this.portal
        .call(method, data)
        // eslint-disable-next-line no-console
        .catch(() => console.log('Portal Gun is unavailable.'))
    )
  }
}
