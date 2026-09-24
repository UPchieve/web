import { faker } from '@faker-js/faker'
import {
  createStudent,
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

export const createHighSchoolCoach = async (
  dbClient: DbClient
): Promise<VolunteerUser> => {
  const coach = await createVolunteer(dbClient, {}, {})
  if (!coach) throw new Error('Failed to create the high school coach')

  // A volunteer with no certifications is an autoflow user, who never reaches
  // the dashboard the login helper waits for.
  await withCertifications(dbClient, {
    userId: coach.id,
    certificationNames: ['prealgebra'],
  })
  await dbClient.query(
    `INSERT INTO volunteer_occupations (user_id, occupation) VALUES ($1, $2)`,
    [coach.id, VolunteerOccupations.HIGH_SCHOOL_STUDENT]
  )

  return coach
}

// Eligibility only counts a session with time_tutored above zero.
export const createTutoredSession = async (
  dbClient: DbClient,
  args: { volunteerId: string }
): Promise<void> => {
  const student = await createStudent(dbClient)
  if (!student) throw new Error('Failed to create the student for the session')

  await dbClient.query(
    `INSERT INTO sessions (id, student_id, volunteer_id, subject_id, time_tutored,
                           volunteer_joined_at, ended_at, shadowbanned)
     SELECT gen_random_uuid(), $1, $2, subjects.id, 1200000, NOW(), NOW(), false
       FROM subjects
      LIMIT 1`,
    [student.id, args.volunteerId]
  )
}

export const createNthsPresident = async (
  dbClient: DbClient
): Promise<{ president: VolunteerUser; chapter: NTHSChapter }> => {
  const president = await createHighSchoolCoach(dbClient)

  const chapter = await createNthsChapter(dbClient, {
    presidentId: president.id,
  })

  return { president, chapter }
}

export const denySchoolAffiliation = async (
  dbClient: DbClient,
  groupId: string
): Promise<void> => {
  await dbClient.query(
    `INSERT INTO nths_group_school_affiliation (nths_group_id, nths_school_affiliation_status_id)
     SELECT $1, statuses.id
       FROM nths_school_affiliation_statuses statuses
      WHERE statuses.name = 'DENIED'
     ON CONFLICT (nths_group_id)
       DO UPDATE SET nths_school_affiliation_status_id = EXCLUDED.nths_school_affiliation_status_id`,
    [groupId]
  )
  await dbClient.query(
    `INSERT INTO nths_group_actions (nths_group_id, nths_action_id)
     SELECT $1, actions.id
       FROM nths_actions actions
      WHERE actions.name = 'SCHOOL AFFILIATION DENIED'`,
    [groupId]
  )
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

export type NthsMemberOptions = {
  groupId: string
  roleName?: 'admin' | 'member'
}

// getGroupMembers and the roster both need the role row, so a member without
// one is invisible to the API.
export const addNthsMember = async (
  dbClient: DbClient,
  options: NthsMemberOptions
): Promise<VolunteerUser> => {
  const member = await createVolunteer(
    dbClient,
    {},
    { onboarded: true, approved: true }
  )
  if (!member) throw new Error('Failed to create the NTHS member')

  await withCertifications(dbClient, {
    userId: member.id,
    certificationNames: ['prealgebra'],
  })
  await dbClient.query(
    `INSERT INTO volunteer_occupations (user_id, occupation) VALUES ($1, $2)`,
    [member.id, VolunteerOccupations.HIGH_SCHOOL_STUDENT]
  )
  const joinedAt = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  await dbClient.query(
    `INSERT INTO nths_group_members (nths_group_id, user_id, title, joined_at)
       VALUES ($1, $2, 'Member', $3)`,
    [options.groupId, member.id, joinedAt.toISOString()]
  )
  await dbClient.query(
    `INSERT INTO nths_group_member_roles (user_id, nths_group_id, role_id)
     SELECT $1, $2, roles.id FROM nths_group_roles roles WHERE roles.name = $3`,
    [member.id, options.groupId, options.roleName ?? 'member']
  )

  return member
}
