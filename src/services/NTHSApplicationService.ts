import { dayjs } from '@/utils/time-utils'

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
  state: string
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

const NTHS_COMMITMENTS: NTHSQuestion[] = [
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
    label: 'My chapter will provide 40 hours of free tutoring by June 2027.',
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

export const NTHS_LONG_FORM_VERSION = 2
export const NTHS_SHORT_FORM_VERSION = 3
export type NTHSFormVersion =
  | typeof NTHS_LONG_FORM_VERSION
  | typeof NTHS_SHORT_FORM_VERSION

// Question keys have to match subway's NTHS_APPLICATION_FORMS for the same
// version, which rejects any key it does not list.
export const NTHS_APPLICATION_FORMS: Record<NTHSFormVersion, NTHSQuestion[]> = {
  [NTHS_LONG_FORM_VERSION]: [
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
  ],
  [NTHS_SHORT_FORM_VERSION]: [
    {
      key: 'whyStartChapter',
      type: 'longText',
      label: 'Why are you interested in starting an NTHS chapter?',
      placeholder: '1-2 sentences',
    },
    {
      key: 'leadershipExperience',
      type: 'longText',
      label: 'When have you led a group or taken charge of something?',
      placeholder: 'Club, team, class project, group of friends. All count.',
    },
    ...NTHS_COMMITMENTS,
    HOW_DID_YOU_HEAR,
  ],
}

// Only the 'short' variant gets the short form, so a flag that is off, not yet
// evaluated, or missing in dev shows the long form.
export function nthsFormVersionForVariant(variant: unknown): NTHSFormVersion {
  return variant === 'short' ? NTHS_SHORT_FORM_VERSION : NTHS_LONG_FORM_VERSION
}

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
  formVersion: NTHSFormVersion
  schoolId: string | null
  schoolName: string
  cannotFindSchool: boolean
  unlistedSchool: { name: string; city: string; state: string; website: string }
  gradeLevel: string
  responses: NTHSApplicationResponses
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function isFormVersion(value: unknown): value is NTHSFormVersion {
  return typeof value === 'number' && value in NTHS_APPLICATION_FORMS
}

// A saved draft can come from an older build or be edited by hand, so only
// fields with the shape this build expects are kept.
export function sanitizeNTHSApplicationDraft(
  saved: any,
  fallbackFormVersion: NTHSFormVersion
): NTHSApplicationDraft | null {
  if (!saved || typeof saved !== 'object') return null

  // A draft with no form version, or one the app no longer defines, holds
  // answers to questions the fallback form does not ask, and those are dropped
  // rather than sent.
  const formVersion: NTHSFormVersion = isFormVersion(saved.formVersion)
    ? saved.formVersion
    : fallbackFormVersion
  const responses: NTHSApplicationResponses = {}
  for (const question of NTHS_APPLICATION_FORMS[formVersion]) {
    const answer = saved.responses?.[question.key]
    if (question.type === 'attestation' ? answer === true : asString(answer))
      responses[question.key] = answer
  }

  const unlisted = saved.unlistedSchool ?? {}
  const schoolId = asString(saved.schoolId) || null
  return {
    formVersion,
    schoolId,
    schoolName: schoolId ? asString(saved.schoolName) : '',
    cannotFindSchool: !schoolId && saved.cannotFindSchool === true,
    unlistedSchool: {
      name: asString(unlisted.name),
      city: asString(unlisted.city),
      state: asString(unlisted.state),
      website: asString(unlisted.website),
    },
    gradeLevel: HIGH_SCHOOL_GRADES.includes(saved.gradeLevel)
      ? saved.gradeLevel
      : '',
    responses,
  }
}

// Mirrors subway's NTHSApplyPreview.
export type NTHSApplyRequirementStatus = 'done' | 'outstanding' | 'inReview'

export type NTHSApplyPreview = {
  closesAt: string
  requirements: Record<
    'training' | 'safetyReview' | 'firstSession',
    NTHSApplyRequirementStatus
  >
}

export function daysLeftToApply(closesAt: string): number {
  return Math.max(
    0,
    dayjs(closesAt).startOf('day').diff(dayjs().startOf('day'), 'day')
  )
}
