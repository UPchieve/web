import bcrypt from 'bcrypt'
import { getDbUlid } from './db'
import { faker } from '@faker-js/faker'
import { snake } from 'case'

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

export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10)
  return await bcrypt.hash(password, salt)
}
