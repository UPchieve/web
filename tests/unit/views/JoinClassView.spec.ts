import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it, MockInstance, test, vi } from 'vitest'
import { flushPromises, mount, VueWrapper } from '@vue/test-utils'
import router from '@/router'
import store from '@/store'
import NetworkService from '@/services/NetworkService'
import JoinClassView from '@/views/JoinClassView.vue'

function getWrapper() {
  return mount(JoinClassView, {
    global: {
      plugins: [store, router],
    },
  })
}

function getElements(wrapper: VueWrapper) {
  return {
    inputClassCode: wrapper.find('[data-testid="input-class-code"]'),
    inputEmail: wrapper.find('[data-testid="input-email"]'),
    buttonSubmit: wrapper.find('[data-testid="button-submit"]'),
    textClassCode: wrapper.find('[data-testid="text-class-code"]'),
    linkNotYourClass: wrapper.find('[data-testid="link-not-your-class"]'),
    formErrors: wrapper.find('[data-testid="form-errors"]')
  }
}

describe('JoinClassView', () => {
  let routerPushSpy: MockInstance

  beforeEach(async () => {
    vi.restoreAllMocks()
    routerPushSpy = vi.spyOn(router, 'push')
    NetworkService.user = vi.fn().mockResolvedValue({
      data: {
        user: {}
      }
    })
  })

  test('student can join a class when signed in', async () => {
    NetworkService.addStudentToClass = vi.fn().mockResolvedValue({
      data: {
        teacherClass: {}
      }
    })

    const wrapper = getWrapper()
    const {
      inputClassCode,
      inputEmail,
      buttonSubmit
    } = getElements(wrapper)

    expect(inputClassCode.exists()).toBeTruthy()
    expect(inputEmail.exists()).toBeTruthy()

    const classCode = faker.string.alphanumeric(6)
    const email = faker.internet.email()
    const gradeLevel = '6th'
    await inputClassCode.setValue(classCode)
    await inputEmail.setValue(email)
      ; (wrapper.vm as any).gradeLevel = gradeLevel

    await buttonSubmit.trigger('click')

    expect(NetworkService.addStudentToClass).toHaveBeenCalledOnce()
    expect(NetworkService.addStudentToClass).toHaveBeenCalledWith({
      email,
      classCode,
      gradeLevel,
    })

    expect(routerPushSpy).toHaveBeenCalledOnce()
    expect(routerPushSpy).toHaveBeenCalledWith(`/dashboard?classCode=${classCode}`)

    routerPushSpy.mockRestore()
  })

  test('redirect student to login with query params when there is an account', async () => {
    NetworkService.addStudentToClass = vi.fn().mockResolvedValue({
      data: {
        isExistingStudent: true
      }
    })

    const wrapper = getWrapper()
    const {
      inputClassCode,
      inputEmail,
      buttonSubmit
    } = getElements(wrapper)

    const classCode = faker.string.alphanumeric(6)
    const email = faker.internet.email()
    const gradeLevel = '10th'
    inputClassCode.setValue(classCode)
    inputEmail.setValue(email)
      ; (wrapper.vm as any).gradeLevel = gradeLevel

    await wrapper.vm.$nextTick()
    await buttonSubmit.trigger('click')

    expect(NetworkService.addStudentToClass).toHaveBeenCalledOnce()
    expect(NetworkService.addStudentToClass).toHaveBeenCalledWith({
      email,
      classCode,
      gradeLevel,
    })

    expect(routerPushSpy).toHaveBeenCalledOnce()

    const firstCallArg = routerPushSpy.mock.calls[0][0]
    const url = new URL(firstCallArg, 'http://localhost:8080')
    expect(url.pathname).toBe('/login')
    expect(url.searchParams.get('redirect')).toContain(`/join-class/${classCode}`)
    expect(url.searchParams.get('message')).toBeDefined()
    const redirectParams = new URLSearchParams(url.searchParams.get('redirect').split('?')[1])
    expect(redirectParams.get('email')).toBe(email)
    expect(redirectParams.get('classCode')).toBe(classCode)
    expect(redirectParams.get('gradeLevel')).toBe(gradeLevel)
  })

  test('redirect student to finish creating account if no account', async () => {
    NetworkService.addStudentToClass = vi.fn().mockResolvedValue({
      data: {
        isExistingStudent: false
      }
    })

    const wrapper = getWrapper()
    const {
      inputClassCode,
      inputEmail,
      buttonSubmit
    } = getElements(wrapper)

    const classCode = faker.string.alphanumeric(6)
    const email = faker.internet.email()
    const gradeLevel = '10th'
    inputClassCode.setValue(classCode)
    inputEmail.setValue(email)
      ; (wrapper.vm as any).gradeLevel = gradeLevel

    await wrapper.vm.$nextTick()
    await buttonSubmit.trigger('click')

    expect(NetworkService.addStudentToClass).toHaveBeenCalledOnce()
    expect(NetworkService.addStudentToClass).toHaveBeenCalledWith({
      email,
      classCode,
      gradeLevel,
    })

    expect(routerPushSpy).toHaveBeenCalledOnce()

    const firstCallArg = routerPushSpy.mock.calls[0][0]
    expect(firstCallArg.name).toBe('SignupView')
    expect(firstCallArg.params).toEqual({ userType: 'student', step: 'account' })
    expect(firstCallArg.query).toEqual({ email, classCode, gradeLevel })
  })

  test('show error if the student cannot join the class', async () => {
    const errorMessage = 'Something super bad happened.'
    NetworkService.addStudentToClass = vi.fn().mockRejectedValue({
      response: {
        data: {
          err: errorMessage
        }
      }
    })
    const wrapper = getWrapper()
    const {
      inputClassCode,
      inputEmail,
      buttonSubmit
    } = getElements(wrapper)

    const classCode = faker.string.alphanumeric(6)
    const email = faker.internet.email()
    const gradeLevel = '12th'
    inputClassCode.setValue(classCode)
    inputEmail.setValue(email)
      ; (wrapper.vm as any).gradeLevel = gradeLevel

    await wrapper.vm.$nextTick()
    await buttonSubmit.trigger('click')
    await wrapper.vm.$nextTick()

    const {
      formErrors
    } = getElements(wrapper)

    expect((wrapper.vm as any).errorMessage).toBe(errorMessage)
    expect(formErrors.exists()).toBe(true)
    const firstItemInFormErrors = formErrors.findAll('li')[0]
    expect(firstItemInFormErrors.text()).toBe(errorMessage)
  })

  test('the form does not include class code input if the class code is in the URL', async () => {
    await flushPromises()
    const classCode = 'abc123'
    await router.push(`/join-class/${classCode}`)
    await router.isReady()

    const wrapper = getWrapper()
    const {
      textClassCode,
      inputClassCode,
    } = getElements(wrapper)

    expect(inputClassCode.exists()).toBe(false)
    expect(textClassCode.text()).toBe(`Class code: ${classCode.toUpperCase()}`)
  })

  test('the form resets if the student selects the class code is not correct', async () => {
    await flushPromises()
    const classCode = '987ZYX'
    await router.push(`/join-class/${classCode}`)
    await router.isReady()

    const wrapper = getWrapper()
    const {
      linkNotYourClass
    } = getElements(wrapper)

    expect(wrapper.vm.$route.params.classCode).toBe(classCode)
    expect(linkNotYourClass.text()).toBe('Not your class?')
    expect((wrapper.vm as any).classCode).toBe(classCode)
    expect((wrapper.vm as any).askForClassCode).toBe(false)

    await linkNotYourClass.trigger('click')
    await router.isReady()
    await flushPromises()

    expect(wrapper.vm.$route.params.classCode).toBe('')
    expect((wrapper.vm as any).classCode).toBe('')
    expect((wrapper.vm as any).askForClassCode).toBe(true)
  })
})
