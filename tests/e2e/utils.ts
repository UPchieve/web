import { faker } from '@faker-js/faker'
import { StudentDashboard } from './page-object-models/student-dashboard'
import { Login } from './page-object-models/login'
import { Pool, type PoolClient } from 'pg'
import type { Browser, Page } from '@playwright/test'
import { post } from './utils/network'
import type { AuthPayload } from '@/contracts/auth'

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
): Promise<StudentUser> => {
  const params = {
    email: faker.internet.email(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    password: createPassword(),
    verified: true,
    ...args,
  }
  const { user } = await post(`/auth/register/student/`, params)
  await dbClient.query(
    `UPDATE users SET verified = true WHERE id = '${user.id}'`
  )
  return { ...params, id: user.id }
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

export type VolunteerOptions = {
  approved?: boolean
  onboarded?: boolean
  completedUpchieveTraining?: boolean
}

export const createVolunteer = async (
  dbClient: DbClient,
  options: VolunteerOptions = {}
): Promise<VolunteerUser> => {
  const params = {
    email: faker.internet.email(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    password: createPassword(),
    phone: `+${faker.string.numeric('###########')}`,
    terms: true,
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

export const loginAs = async (
  page: Page,
  user: AuthPayload,
  landingUrl = '**/dashboard'
) => {
  // The e2e build's Zwibbler demo calls alert() on each whiteboard mount. With no
  // listener, Playwright dismisses it without catching a failed dismiss, which
  // fails the test with "No dialog is showing".
  page.on('dialog', (dialog) => dialog.dismiss().catch(() => {}))
  const login = new Login(page)
  await login.goto()
  await login.loginWith(user)
  await page.waitForURL(landingUrl)
}

export const loginStudent = async (
  browser: Browser,
  studentUser: AuthPayload,
  { permissions }: { permissions?: string[] } = {}
) => {
  const studentContext = await browser.newContext({ permissions })
  const studentPage = await studentContext.newPage()
  const studentDashboard = new StudentDashboard(studentPage)
  await loginAs(studentPage, studentUser)
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
  volunteerUser: AuthPayload
) => {
  const volunteerContext = await browser.newContext()
  const volunteerPage = await volunteerContext.newPage()
  await loginAs(volunteerPage, volunteerUser)

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
