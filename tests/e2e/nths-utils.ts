import { faker } from '@faker-js/faker'
import {
  createVolunteer,
  withCertifications,
  type DbClient,
  type VolunteerUser,
} from './utils'
import { VolunteerOccupations } from '../../src/services/VolunteerService'

export type NTHSChapter = {
  groupId: string
  name: string
}

export const createNthsChapter = async (
  dbClient: DbClient,
  args: { presidentId: string }
): Promise<NTHSChapter> => {
  const name = `NTHS Chapter ${faker.string.alphanumeric(10)}`
  const { rows } = await dbClient.query(
    `INSERT INTO nths_groups (id, name, key, invite_code)
       VALUES (generate_ulid(), $1, $2, $3)
     RETURNING id`,
    [name, name.split(' ').join('-').toLowerCase(), faker.string.alpha(6)]
  )
  const groupId = rows[0].id

  await dbClient.query(
    `INSERT INTO nths_group_members (nths_group_id, user_id, title)
       VALUES ($1, $2, 'President')`,
    [groupId, args.presidentId]
  )
  await dbClient.query(
    `INSERT INTO nths_group_member_roles (user_id, nths_group_id, role_id)
     SELECT $1, $2, roles.id FROM nths_group_roles roles WHERE roles.name = 'admin'`,
    [args.presidentId, groupId]
  )

  return { groupId, name }
}

export const createNthsPresident = async (
  dbClient: DbClient
): Promise<{ president: VolunteerUser; chapter: NTHSChapter }> => {
  const president = await createVolunteer(dbClient, {}, {})
  if (!president) throw new Error('Failed to create the NTHS president')

  // A volunteer with no certifications is an autoflow user, who never reaches
  // the dashboard the login helper waits for.
  await withCertifications(dbClient, {
    userId: president.id,
    certificationNames: ['prealgebra'],
  })
  await dbClient.query(
    `INSERT INTO volunteer_occupations (user_id, occupation) VALUES ($1, $2)`,
    [president.id, VolunteerOccupations.HIGH_SCHOOL_STUDENT]
  )

  const chapter = await createNthsChapter(dbClient, {
    presidentId: president.id,
  })

  return { president, chapter }
}

export const schoolAffiliationStatusOf = async (
  dbClient: DbClient,
  groupId: string
): Promise<string | undefined> => {
  const { rows } = await dbClient.query(
    `SELECT statuses.name
       FROM nths_group_school_affiliation aff
       JOIN nths_school_affiliation_statuses statuses
         ON statuses.id = aff.nths_school_affiliation_status_id
      WHERE aff.nths_group_id = $1`,
    [groupId]
  )
  return rows[0]?.name
}
