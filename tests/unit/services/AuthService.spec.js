import { vi } from 'vitest'
import NetworkService from '@/services/NetworkService'
import AuthService from '@/services/AuthService'
vi.mock('../../../services/NetworkService')
vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    defaults: {
      headers: {
        common: {},
      },
    },
  }
})
describe('AuthService', () => {
  const testLoginCreds = {
    email: 'testemail@gmail.com',
    password: 'testAbc123!', // pragma: allowlist secret
  }

  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('fetchAndSetCsrfHeader', () => {
    it('Should throw an error if a CSRF token is not in the response', async () => {
      NetworkService.getCsrfToken = vi.fn().mockResolvedValue({
        data: {
          err: 'Something went wrong',
        },
      })
      await expect(() =>
        AuthService.fetchAndSetCsrfHeader('testUser123')
      ).rejects.toThrowError(
        'Something went wrong. Please refresh the page and try again.'
      )
    })

    it('Should throw an error if request is rejected', async () => {
      NetworkService.getCsrfToken = vi.fn().mockRejectedValue({
        data: {
          err: 'Rejection',
        },
      })
      await expect(() =>
        AuthService.fetchAndSetCsrfHeader('testUser123')
      ).rejects.toThrowError()
    })
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
      vi.spyOn(AuthService, 'fetchAndSetCsrfHeader')
      await expect(AuthService.login(testLoginCreds)).rejects.toThrow(
        'No user returned from auth service'
      )
      expect(AuthService.fetchAndSetCsrfHeader).not.toHaveBeenCalled()
    })

    it('Should call fetchAndSetCsrfHeader on successful login', async () => {
      NetworkService.getCsrfToken = vi.fn().mockRejectedValue({
        data: {
          err: 'Something went wrong',
        },
      })
      NetworkService.login = vi.fn().mockResolvedValue({
        data: {
          user: {
            id: 'userId',
          },
        },
      })
      vi.spyOn(AuthService, 'fetchAndSetCsrfHeader')
      await AuthService.login(testLoginCreds)
      expect(AuthService.fetchAndSetCsrfHeader).toHaveBeenCalledWith('userId')
    })
  })
})
