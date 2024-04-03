import AnalyticsService from '@/services/AnalyticsService'
import LoggerService from '@/services/LoggerService'
import NetworkService from '@/services/NetworkService'
import { EVENTS, GRADES } from '@/consts'

const RoutePath = {
  account: '/sign-up/student/account',
  eligibility: '/sign-up/student/eligibility',
  ineligible: '/sign-up/student/ineligible',
  international: '/sign-up/student/international',
}
/*
type PageDetail = {
  backgroundLayout: 'card' | 'panel-right-50p' etc.,
  submitAction: (fd: FormData) => string[],
  classes: string,
  rows: [
    classes: string,
    elements: {
      element: string,
      classes: string,
      content: string,
      submitAction: (fd: FormData) => string[],
      props: Object
    }[],
}
*/
export function getPageDetails(to, from) {
  if (isIneligibleRoute(to, from)) {
    return getIneligiblePageDetails()
  }

  return {
    backgroundLayout: 'panel-right-50p',
    submitAction: checkEligibility,
    rows: [
      getRow(
        null,
        getTextElement('h1', 'Check if you are eligible for UPchieve')
      ),
      getRow(
        'uc-row justify-start',
        getTextElement('p', 'Already have an account?'),
        {
          element: 'router-link',
          classes: 'uc-link ml-1',
          content: 'Log In',
          props: {
            to: '/login',
          },
        }
      ),
      getRow(null, getGradeSelectionElement(), getZipCodeElement()),
      getRow(null, { element: 'FormSchoolSearch' }),
      getRow(null, getSignUpSourceElement()),
      getRow(null, { element: 'br' }),
      getRow(null, getButtonElement(checkEligibility, 'Check eligibility')),
    ],
  }
}

function checkEligibility(formData) {
  console.info('check eligibility with ', formData)
  return [RoutePath.ineligible, 'This would be error.']
}

function ineligibleContinue() {
  AnalyticsService.captureEvent(EVENTS.STUDENT_CLICKED_STUDENT_ACCESS_PAGE)
  window.location = 'https://upchieve.org/request-access'
}

function getRow(classes = '', ...elements) {
  return {
    classes,
    elements,
  }
}

function getTextElement(element, content) {
  return {
    element,
    content,
  }
}

function getButtonElement(submitAction, content, classes) {
  return {
    element: 'button',
    classes: 'uc-form-button ' + classes,
    content,
    submitAction,
  }
}

function getZipCodeElement() {
  return {
    element: 'FormInput',
    props: {
      name: 'zipCode',
      label: 'Zip Code',
      placeholder: 'Zip Code',
      minLength: 5,
      maxLength: 5,
      blurEvent: EVENTS.STUDENT_ENTERED_ZIP_CODE,
    },
  }
}

function getGradeSelectionElement() {
  return {
    element: 'FormSelect',
    props: {
      blurEvent: EVENTS.STUDENT_SELECTED_GRADE,
      getSelectOptions: () => GRADES,
      name: 'currentGrade',
      label: 'Grade in 2023-2024',
      placeholder: 'Grade in 2023-2024',
      reduce: (option) => option.split(' ')[0],
    },
  }
}

function getSignUpSourceElement() {
  return {
    element: 'FormSelect',
    props: {
      blurEvent: EVENTS.STUDENT_SELECTED_HOW_DID_YOU_HEAR_ABOUT_US,
      getSelectOptions: async function() {
        try {
          const {
            data: { signupSources },
          } = await NetworkService.getStudentSignupSources()
          return signupSources
        } catch (err) {
          LoggerService.noticeError(err)
          return []
        }
      },
      name: 'signUpSource',
      label: 'How did you hear about us?',
      optionTextField: 'name',
      placeholder: 'How did you hear about us?',
      reduce: (option) => option.id,
    },
  }
}

function isIneligibleRoute(to) {
  return to.path === RoutePath.ineligible
}

function getIneligiblePageDetails() {
  return {
    backgroundLayout: 'full',
    submitAction: ineligibleContinue,
    classes: 'text-center screen-narrow',
    rows: [
      getRow('uc-row justify-center', {
        element: 'updog-crying',
        classes: 'updog-crying',
      }),
      getRow(
        'uc-row justify-center',
        getTextElement('h1', "Oops... looks like you're not eligible")
      ),
      getRow(
        null,
        getTextElement(
          'p',
          "While we weren't able to verify your eligibility based on the info provided, don't worry: you may still be eligible! We just need your parent/guardian to answer some more questions first!"
        )
      ),
      getRow(
        null,
        getButtonElement(ineligibleContinue, 'Continue', 'button-narrow')
      ),
    ],
  }
}
