import { EVENTS } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'
import {
  getRow,
  getTextElement,
  getButtonElement,
  continueToAccountPage,
} from '@/services/SignUpService'

export const InputName = {
  SCHOOL_ID: 'schoolId',
  WORKS_WITH_ELIGIBLE_STUDENTS: 'worksWithEligibleStudents',
}

export function getPageDetails(to, from) {
  return getEligibilityPageDetails(to, from)
}

function getEligibilityPageDetails() {
  return {
    backgroundLayout: 'panel-right-50p',
    submitAction: checkEligibility,
    rows: [
      getRow(
        null,
        getTextElement(
          'h1',
          'Check if your students are eligible for UPchieve!'
        )
      ),
      getRow(null, {
        element: 'FormSchoolSearch',
        props: {
          name: InputName.SCHOOL_ID,
          label: 'School Name',
          placeholder: 'School Name',
          startSearchEvent: EVENTS.TEACHER_SEARCHED_SCHOOL,
          cannotFindSchoolEvent: EVENTS.TEACHER_CLICKED_CANT_FIND_SCHOOL,
          selectedEvent: EVENTS.TEACHER_SELECTED_SCHOOL,
        },
      }),
      getRow('justify-start', {
        element: 'FormCheckBox',
        props: {
          label: 'I work with 6th through 12th grade students',
          name: InputName.WORKS_WITH_ELIGIBLE_STUDENTS,
        },
      }),
      getRow(null, { element: 'br' }),
      getRow(null, getButtonElement(checkEligibility, 'Check eligibility')),
    ],
  }
}

function checkEligibility(data) {
  // TODO: Actually check eligibility.
  AnalyticsService.captureEvent(EVENTS.TEACHER_CLICKED_CHECK_ELIGIBILITY)
  return continueToAccountPage(data)
}
