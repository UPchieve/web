import { vi } from 'vitest'
import NetworkService from '@/services/NetworkService'
import AuthService, { handleLogout } from '@/services/AuthService'
import AnalyticsService from '@/services/AnalyticsService'
import LoggerService from '@/services/LoggerService'
import { socket } from '@/socket'

describe('AuthService', () => {
  const testLoginCreds = {
    email: 'testemail@gmail.com',
    password: 'testAbc123!',
  }

  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('login', () => {
    it.each([
      ['test@test.com', ''],
      ['test@test.com', undefined],
      ['test@test.com', null],
      [undefined, 'Pass'],
      [null, 'Pass'],
    ])(
      'Should reject if email (%s) or password (%s) are missing',
      async (email, password) => {
        await expect(() =>
          AuthService.login({ email, password })
        ).rejects.toEqual('Invalid login form submission')
      }
    )

    it('Should throw an error if it does not get login data back from the server call', async () => {
      NetworkService.login = vi.fn().mockResolvedValue({
        err: 'Something went wrong',
      })
      await expect(AuthService.login(testLoginCreds)).rejects.toThrow(
        'No user returned from auth service'
      )
    })
  })

  describe('logout', () => {
    function logoutContext() {
      return {
        store: { dispatch: vi.fn().mockResolvedValue(undefined) },
        router: { push: vi.fn().mockResolvedValue(undefined) },
      }
    }

    beforeEach(() => {
      vi.spyOn(AnalyticsService, 'reset').mockImplementation(() => {})
      vi.spyOn(LoggerService, 'reset').mockImplementation(() => {})
      vi.spyOn(socket, 'disconnect').mockImplementation(() => socket)
    })

    it('clears local state and uses the default logout route', async () => {
      vi.spyOn(NetworkService, 'logout').mockResolvedValue(undefined)
      const context = logoutContext()
      await AuthService.logout(context)
      expect(NetworkService.logout).toHaveBeenCalledOnce()
      expect(context.store.dispatch).toHaveBeenCalledWith('user/clear')
      expect(AnalyticsService.reset).toHaveBeenCalledOnce()
      expect(LoggerService.reset).toHaveBeenCalledOnce()
      expect(socket.disconnect).toHaveBeenCalledOnce()
      expect(context.router.push).toHaveBeenCalledWith('/logout')
    })

    it('still cleans up and redirects when the logout request fails', async () => {
      const error = new Error('Request failed')
      vi.spyOn(NetworkService, 'logout').mockRejectedValue(error)
      const context = logoutContext()
      await expect(AuthService.logout(context, '/join-class/abc')).rejects.toBe(
        error
      )
      expect(context.store.dispatch).toHaveBeenCalledWith('user/clear')
      expect(socket.disconnect).toHaveBeenCalledOnce()
      expect(context.router.push).toHaveBeenCalledWith('/join-class/abc')
    })

    it('can clean up after account deletion without requesting logout', async () => {
      vi.spyOn(NetworkService, 'logout')
      const context = logoutContext()
      await handleLogout(context, '/logout?deleted=true')
      expect(NetworkService.logout).not.toHaveBeenCalled()
      expect(context.router.push).toHaveBeenCalledWith('/logout?deleted=true')
    })
  })
})
