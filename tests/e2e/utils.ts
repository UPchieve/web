import { faker } from '@faker-js/faker'
import { StudentDashboard } from './page-object-models/student-dashboard'
import { Login } from './page-object-models/login'
import { Pool, type PoolClient } from 'pg'
import type { Browser, Page } from '@playwright/test'
import { post } from './utils/network'

// TODO: This is an overloaded utils file. Break out into
// separate files.

export type DbClient = Pool | PoolClient

export const createPassword = (): string => {
  return faker.internet.password({
    length: 10,
    prefix: 'Pa1-',
  })
}

export type StudentUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  password: string
  verified: boolean
}
export const createStudent = async (
  dbClient: DbClient,
  args = {}
): Promise<StudentUser | undefined> => {
  const params = {
    email: faker.internet.email(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    password: createPassword(),
    verified: true,
    ...args,
  }
  try {
    const { user } = await post(`/auth/register/student/`, params)
    await dbClient.query(
      `UPDATE users SET verified = true WHERE id = '${user.id}'`
    )
    return { ...params, id: user.id }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.dir(e, { depth: null })
    // TODO: We might actually want to throw errors here etc.
  }
}

export type VolunteerUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  password: string
  phone: string
  terms: boolean
}

export const createVolunteer = async (
  dbClient: DbClient,
  userArgs = {},
  options: any
): Promise<VolunteerUser | undefined> => {
  try {
    const params = {
      email: faker.internet.email(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      password: createPassword(),
      phone: `+${faker.string.numeric('###########')}`,
      terms: true,
      ...userArgs,
    }

    const opts = {
      approved: true,
      onboarded: true,
      completedUpchieveTraining: true,
      ...options,
    }

    const { user } = await post(`/auth/register/volunteer/open`, params)

    await dbClient.query(
      `UPDATE users SET verified = true WHERE id = '${user.id}'`
    )
    await dbClient.query(
      `UPDATE volunteer_profiles SET approved = $1, onboarded = $2 WHERE user_id = '${user.id}'`,
      [opts.approved, opts.onboarded]
    )
    if (opts.completedUpchieveTraining)
      await completeUpchieveTraining(dbClient, user.id)

    return { ...params, id: user.id }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.dir(e, { depth: null })
  }
}

export const withCertifications = async (
  dbClient: DbClient,
  args: { userId: string; certificationNames: string[] }
) => {
  const { rows: certificationIds } = await dbClient.query(
    `SELECT id FROM certifications WHERE name = ANY ($1)`,
    [args.certificationNames]
  )
  for (const id of certificationIds.map((r: { id: string }) => r.id)) {
    await dbClient.query(
      `INSERT INTO users_certifications (user_id, certification_id) VALUES ($1, $2)`,
      [args.userId, id]
    )
  }
}

export const completeUpchieveTraining = async (
  dbClient: DbClient,
  userId: string
) => {
  const trainingNames = [
    'coachingStrategies',
    'academicIntegrity',
    'dei',
    'communitySafety',
  ]
  const completedMaterials = [
    'UPCHIEVE_TRAINING-INTRODUCTION',
    'UPCHIEVE_TRAINING-IMPLEMENTING_EFFECTIVE_COACHING_STRATEGIES',
    'UPCHIEVE_TRAINING-ACADEMIC_INTEGRITY',
    'UPCHIEVE_TRAINING-DEI',
    'UPCHIEVE_TRAINING-COMMUNITY_SAFETY',
  ]
  const course = await dbClient.query(
    `INSERT INTO users_training_courses (user_id, training_course_id, complete, completed_materials, progress)
     SELECT $1, id, true, $2, 100 FROM training_courses WHERE name = 'upchieveTraining'`,
    [userId, completedMaterials]
  )
  const quizzes = await dbClient.query(
    `INSERT INTO users_quizzes (user_id, quiz_id, attempts, passed)
     SELECT $1, id, 1, true FROM quizzes WHERE name = ANY ($2)`,
    [userId, trainingNames]
  )
  if (course.rowCount !== 1 || quizzes.rowCount !== trainingNames.length)
    throw new Error('Intro to UPchieve course or quizzes missing from the seed')
  await withCertifications(dbClient, {
    userId,
    certificationNames: trainingNames,
  })
}

export const endSessionsFor = async (dbClient: Pool, userId: string) => {
  await dbClient.query(
    `UPDATE sessions SET ended_at = now() WHERE student_id = '${userId}'`
  )
}

export const loginStudent = async (
  browser: Browser,
  studentUser: { email: string; password: string },
  { permissions }: { permissions?: string[] } = {}
) => {
  const studentContext = await browser.newContext({ permissions })
  const studentPage = await studentContext.newPage()
  const studentDashboard = new StudentDashboard(studentPage)
  const studentLogin = new Login(studentPage)
  await studentLogin.goto()
  await studentLogin.loginWith(studentUser)
  await studentPage.waitForURL('**/dashboard')
  if (studentDashboard.isMobile) {
    await studentPage.getByTestId('download-app-close-button').click()
  }

  return {
    studentContext,
    studentPage,
    studentDashboard,
  }
}

export const requestSession = async (
  studentDashboard: StudentDashboard,
  sessionArgs: { subject: string; topic: string }
) => {
  const { sessionId } = await studentDashboard.createSessionFor(sessionArgs)

  return {
    sessionId,
  }
}

export const loginVolunteer = async (
  browser: Browser,
  volunteerUser: { email: string; password: string }
) => {
  const volunteerContext = await browser.newContext()
  const volunteerPage = await volunteerContext.newPage()
  const volunteerLogin = new Login(volunteerPage)
  await volunteerLogin.goto()
  await volunteerLogin.loginWith(volunteerUser)
  await volunteerPage.waitForURL('**/dashboard')

  return {
    volunteerContext,
    volunteerPage,
  }
}

export const setFeatureFlags = async (page: Page, featureFlags: any) => {
  await page.route('*/**/feature-flags', async (route) => {
    const json = {
      featureFlags,
    }
    await route.fulfill({ json })
  })
}
