import { vi } from 'vitest'
import NetworkService from '@/services/NetworkService'
import AuthService from '@/services/AuthService'

describe('AuthService', () => {
  const testLoginCreds = {
    email: 'testemail@gmail.com',
    password: 'testAbc123!', // pragma: allowlist secret
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
})
