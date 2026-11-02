import { COUNTRIES, US_COUNTRY } from '@/consts'
import { dayjs } from '@/utils/time-utils'
import type { NTHSRenewalCommitmentKey } from '@/services/NTHSGroupService'

export const HIGH_SCHOOL_GRADES = [
  '9th grade',
  '10th grade',
  '11th grade',
  '12th grade',
]

// Name, city, and state are the filters the admin school search takes, so
// together they narrow NCES down to the handful of rows staff pick from.
export type NTHSUnlistedSchool = {
  name: string
  city: string
  country: string
  state?: string
  region?: string
  website?: string
}

export type NTHSQuestionType = 'longText' | 'shortText' | 'attestation'

export type NTHSQuestion = {
  key: string
  type: NTHSQuestionType
  label: string
  placeholder?: string
  isRequired?: boolean
}

export const NTHS_COMMITMENTS: (NTHSQuestion & {
  key: NTHSRenewalCommitmentKey
})[] = [
  {
    key: 'commitWeeklyHours',
    type: 'attestation',
    label: 'I can spend 1-2 hours a week leading my chapter.',
  },
  {
    key: 'commitRecruitThreeTutors',
    type: 'attestation',
    label: 'I can recruit at least 3 tutors.',
  },
  {
    key: 'commitHostFourMeetings',
    type: 'attestation',
    label: 'I will host at least 4 chapter meetings.',
  },
  {
    key: 'commitFortyTutoringHours',
    type: 'attestation',
    label:
      'My chapter will provide 40 hours of free tutoring by the end of the school year.',
  },
  {
    key: 'commitRecruitKnownHighSchoolers',
    type: 'attestation',
    label:
      'I will only recruit current high school students I know in real life.',
  },
]

const HOW_DID_YOU_HEAR: NTHSQuestion = {
  key: 'howDidYouHear',
  type: 'shortText',
  label: 'How did you hear about NTHS? (optional)',
  isRequired: false,
}

// Question keys have to match subway's NTHS_APPLICATION_FIELDS, which rejects
// any key it does not list.
export const NTHS_APPLICATION_QUESTIONS: NTHSQuestion[] = [
  {
    key: 'whyStartChapter',
    type: 'longText',
    label: 'Why are you interested in starting an NTHS chapter?',
    placeholder: '1-2 sentences',
  },
  {
    key: 'leadershipExperience',
    type: 'longText',
    label:
      'Tell us about a time you took initiative or led a group (school, sports, club, or other).',
    placeholder: '2-3 sentences',
  },
  {
    key: 'recruitmentIdea',
    type: 'longText',
    label:
      'What is your top idea for recruiting more volunteers from your community, school, or peer group?',
    placeholder: '1-2 sentences or bullet points',
  },
  {
    key: 'motivatingCoaches',
    type: 'longText',
    label:
      'Your chapter needs 40 hours of tutoring combined across its members during the academic year. What do you think will keep your coaches motivated to volunteer consistently?',
    placeholder: '1-2 sentences',
  },
  ...NTHS_COMMITMENTS,
  {
    key: 'coPresidentEmail',
    type: 'shortText',
    label:
      "Co-President's or Vice President's email, if you are applying with one (optional)",
    isRequired: false,
  },
  HOW_DID_YOU_HEAR,
]

export type NTHSApplicationResponses = Record<string, string | boolean>

export function buildEmptyResponses(
  questions: NTHSQuestion[]
): NTHSApplicationResponses {
  return questions.reduce((responses, question) => {
    responses[question.key] = question.type === 'attestation' ? false : ''
    return responses
  }, {} as NTHSApplicationResponses)
}

// Keys the applicant left blank are dropped rather than stored empty, so an
// absent answer stays distinguishable from one deliberately left empty.
export function collectResponses(
  questions: NTHSQuestion[],
  responses: NTHSApplicationResponses
): NTHSApplicationResponses {
  return questions.reduce((collected, question) => {
    const answer = responses[question.key]
    if (typeof answer === 'string' ? answer.trim() : answer)
      collected[question.key] =
        typeof answer === 'string' ? answer.trim() : answer
    return collected
  }, {} as NTHSApplicationResponses)
}

export type NTHSApplicationDraft = {
  schoolId: string | null
  schoolName: string
  cannotFindSchool: boolean
  unlistedSchool: {
    name: string
    city: string
    country: string
    state: string
    region: string
    website: string
  }
  gradeLevel: string
  responses: NTHSApplicationResponses
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

// A saved draft can come from an older build or be edited by hand, so only
// fields with the shape this build expects are kept.
export function sanitizeNTHSApplicationDraft(
  saved: any
): NTHSApplicationDraft | null {
  if (!saved || typeof saved !== 'object') return null

  const responses: NTHSApplicationResponses = {}
  for (const question of NTHS_APPLICATION_QUESTIONS) {
    const answer = saved.responses?.[question.key]
    if (question.type === 'attestation' ? answer === true : asString(answer))
      responses[question.key] = answer
  }

  const unlisted = saved.unlistedSchool ?? {}
  const schoolId = asString(saved.schoolId) || null
  const savedState = asString(unlisted.state)
  // A draft with a state and no known country predates the country field, when
  // every unlisted school was in the US.
  const country = COUNTRIES.includes(unlisted.country)
    ? unlisted.country
    : savedState
      ? US_COUNTRY
      : ''
  return {
    schoolId,
    schoolName: schoolId ? asString(saved.schoolName) : '',
    cannotFindSchool: !schoolId && saved.cannotFindSchool === true,
    unlistedSchool: {
      name: asString(unlisted.name),
      city: asString(unlisted.city),
      country,
      state: savedState,
      region: asString(unlisted.region),
      website: asString(unlisted.website),
    },
    gradeLevel: HIGH_SCHOOL_GRADES.includes(saved.gradeLevel)
      ? saved.gradeLevel
      : '',
    responses,
  }
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

export function upcomingApplicationDeadline(
  closesAt: unknown
): { closesOn: string } | undefined {
  if (typeof closesAt !== 'string') return
  const close = DATE_ONLY.test(closesAt)
    ? dayjs(closesAt).endOf('day')
    : dayjs(closesAt)
  if (!close.isValid() || !close.isAfter(dayjs())) return
  return { closesOn: close.format('MMM D, YYYY') }
}
