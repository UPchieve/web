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

// The 40 hours and 3 active tutors below are the thresholds Bailey settled on
// 2026-08-07, replacing the Spring 2026 form's 15 hours per member and 5 active
// tutors. The hours are combined across the chapter for one academic year, not
// per member. Changing either number needs a new form version.
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
  {
    key: 'commitWeeklyHours',
    type: 'attestation',
    label: 'I can commit 1-2 hours per week to leading my chapter.',
  },
  {
    key: 'commitFoundingPresident',
    type: 'attestation',
    label:
      'I understand that as a Founding President I am committing to leading an NTHS chapter with at least 3 active tutors and hosting regular chapter meetings.',
  },
  {
    key: 'commitMonthlyMeetings',
    type: 'attestation',
    label:
      'I agree to attend virtual monthly National President Chapter meetings.',
  },
  {
    key: 'commitRecruitHighSchoolersOnly',
    type: 'attestation',
    label:
      'I agree to only recruit current high school students for my chapter.',
  },
  {
    key: 'coPresidentEmail',
    type: 'shortText',
    label:
      "Co-President's or Vice President's email, if you are applying with one (optional)",
    isRequired: false,
  },
  {
    key: 'howDidYouHear',
    type: 'shortText',
    label: 'How did you hear about NTHS? (optional)',
    isRequired: false,
  },
]

export type NTHSApplicationResponses = Record<string, string | boolean>

export function buildEmptyResponses(): NTHSApplicationResponses {
  return NTHS_APPLICATION_QUESTIONS.reduce((responses, question) => {
    responses[question.key] = question.type === 'attestation' ? false : ''
    return responses
  }, {} as NTHSApplicationResponses)
}

// Keys the applicant left blank are dropped rather than stored empty, so an
// absent answer stays distinguishable from one deliberately left empty.
export function collectResponses(
  responses: NTHSApplicationResponses
): NTHSApplicationResponses {
  return NTHS_APPLICATION_QUESTIONS.reduce((collected, question) => {
    const answer = responses[question.key]
    if (typeof answer === 'string' ? answer.trim() : answer)
      collected[question.key] =
        typeof answer === 'string' ? answer.trim() : answer
    return collected
  }, {} as NTHSApplicationResponses)
}
