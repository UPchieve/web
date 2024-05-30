import bcrypt from 'bcrypt'
import { getDbUlid } from './db'
import { faker } from '@faker-js/faker'
import { snake } from 'case'
import { StudentDashboard } from './page-object-models/student-dashboard'
import { Login } from './page-object-models/login'

/**
 * Inserts a row into the users table.
 * @param args - Args correspond to columns in the users table, in camelCase. Defaults used for any omitted columns.
 */
export const createUserRow = async (dbClient, args = {}) => {
  const requiredParams = {
    email: args?.email ?? faker.internet.email(),
    firstName: args?.firstName ?? faker.person.firstName(),
    lastName: args?.lastName ?? faker.person.lastName(),
    id: getDbUlid(),
    referralCode: faker.string.uuid(),
  }
  const params = {
    ...requiredParams,
    password: args?.password ?? createPassword(),
    verified: args?.verified ?? true,
    ...args,
  }
  const columnNames = Object.keys(params)
    .map((key) => snake(key))
    .join(', ')
  const placeholders = Object.values(params)
    .map((val, index) => `$${index + 1}`)
    .join(', ')
  await dbClient.query(
    `INSERT INTO users (${columnNames}) VALUES (${placeholders})`,
    Object.values({
      ...params,
      password: params.password ? await hashPassword(params.password) : null,
    })
  )
  return params
}

export const createPassword = () => {
  return faker.internet.password({
    length: 10,
    prefix: 'Pa1-',
  })
}

export const createStudent = async (dbClient, args = {}) => {
  const params = {
    email: args?.email ?? faker.internet.email(),
    firstName: args?.firstName ?? faker.person.firstName(),
    lastName: args?.lastName ?? faker.person.lastName(),
    password: args?.password ?? createPassword(),
    verified: args?.verified ?? true,
    ...args,
  }
  try {
    const response = await fetch(
      `http://localhost:3000/auth/register/student/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      }
    )
    const { user } = await response.json()
    await dbClient.query(
      `UPDATE users SET verified = true WHERE id = '${user.id}'`
    )
    return { ...params, id: user.id }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.dir(e, { depth: null })
  }
}

export const createVolunteer = async (dbClient, args = {}) => {
  try {
    const params = {
      email: args?.email ?? faker.internet.email(),
      firstName: args?.firstName ?? faker.person.firstName(),
      lastName: args?.lastName ?? faker.person.lastName(),
      password: args?.password ?? createPassword(),
      phone: `+${faker.string.numeric('###########')}`,
      terms: true,
      ...args,
    }

    const response = await fetch(
      `http://localhost:3000/auth/register/volunteer/open`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      }
    )

    const { user } = await response.json()
    await dbClient.query(
      `UPDATE users SET verified = true WHERE id = '${user.id}'`
    )
    const hasOnboarded = args.hasOnboarded ?? true
    await dbClient.query(
      `UPDATE volunteer_profiles SET approved = true, onboarded = ${hasOnboarded} WHERE user_id = '${user.id}'`
    )
    if (hasOnboarded) {
      await passUpchieve101(dbClient, user.id)
    }

    return { ...params, id: user.id }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.dir(e, { depth: null })
  }
}

export const withCertifications = async (
  dbClient,
  { userId, certificationNames }
) => {
  const { rows: certificationIds } = await dbClient.query(
    `SELECT id FROM certifications WHERE name = ANY ($1)`,
    [certificationNames]
  )
  for (const id of certificationIds.map(({ id }) => id)) {
    await dbClient.query(
      `INSERT INTO users_certifications (user_id, certification_id) VALUES ($1, $2)`,
      [userId, id]
    )
  }
}

export const passUpchieve101 = async (dbClient, userId) => {
  const trainingCourseId = 1
  const trainingMaterialsCompleted = [
    '7b6a76',
    'jsn832',
    'ps87f9',
    'jgu55k',
    'fj8tzq',
  ]
  const quizId = 22
  await dbClient.query(
    `INSERT INTO users_training_courses (user_id, training_course_id, complete, completed_materials, progress) VALUES ($1, $2, $3, $4, $5)`,
    [userId, trainingCourseId, true, trainingMaterialsCompleted, 100]
  )
  await dbClient.query(
    `INSERT INTO users_quizzes (user_id, quiz_id, attempts, passed) VALUES ($1, $2, $3, $4)`,
    [userId, quizId, 1, true]
  )
}

export const endSessionsFor = async (dbClient, userId) => {
  await dbClient.query(
    `UPDATE sessions SET ended_at = now() WHERE student_id = '${userId}'`
  )
}

export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10)
  return await bcrypt.hash(password, salt)
}

export const loginStudent = async (browser, studentUser) => {
  const studentContext = await browser.newContext()
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

export const requestSession = async (studentDashboard, sessionArgs) => {
  const { sessionId } = await studentDashboard.createSessionFor(sessionArgs)

  return {
    sessionId,
  }
}

export const loginVolunteer = async (browser, volunteerUser) => {
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

export const setFeatureFlags = async (page, featureFlags) => {
  await page.route('*/**/feature-flags', async (route) => {
    const json = {
      featureFlags,
    }
    await route.fulfill({ json })
  })
}
