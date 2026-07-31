import type { AxiosError } from 'axios'
import { EVENTS } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'
import NetworkService from '@/services/NetworkService'

type AssignmentData = {
  id?: string
  description: string
  title: string
  numberOfSessions: number
  minDurationInMinutes: number
  dueDate: Date
  startDate: Date
  isRequired: boolean
  subjectId: number
}

type TeacherClass = { id: string }
type StudentId = string

export async function upsertAssignment(
  assignmentData: AssignmentData,
  selectedClasses: TeacherClass[],
  studentsToAdd: StudentId[],
  studentsToRemove: StudentId[],
  files: File[]
) {
  if (!selectedClasses.length) {
    return {
      error: 'Must select at least one class',
    }
  }

  try {
    const classIds = selectedClasses.map((selectedClass) => selectedClass.id)

    const {
      data: { assignment, assignments },
    } = isAssignmentForSingleClass(classIds)
      ? await NetworkService.upsertAssignment(
          buildAssignmentFormDataForRequest(
            {
              ...assignmentData,
              classId: classIds[0],
              studentsToAdd,
              studentsToRemove,
            },
            files
          )
        )
      : await NetworkService.createAssignments(
          buildAssignmentFormDataForRequest(
            {
              ...assignmentData,
              classIds,
            },
            files
          )
        )

    AnalyticsService.captureEvent(EVENTS.ASSIGNMENT_CREATED, assignmentData)

    return { assignments: assignments ?? [assignment] }
  } catch (err) {
    const errData = (err as AxiosError).response?.data as {
      moderationInfractions?: string[]
      imageModerationInfractions?: { [fileName: string]: string[] }
      assignment?: { id: string }
    }

    // If we created the assignment but then something failed (e.g. an
    // attached file was flagged), we have created the assignment, but want
    // to retry upsert for that newly created assignment.
    const savedAssignment = errData?.assignment

    if (errData?.moderationInfractions) {
      return {
        savedAssignment,
        error: formatModerationInfractionMessage(
          errData.moderationInfractions,
          assignmentData.title
        ),
      }
    }

    if (errData.imageModerationInfractions) {
      return {
        savedAssignment,
        error: formatModerationInfractionFileMessage(
          errData.imageModerationInfractions
        ),
      }
    }

    return {
      savedAssignment,
      error: `Unable to create assignment`,
    }
  }
}

function isAssignmentForSingleClass(classes: string[]) {
  return classes.length === 1
}

function buildAssignmentFormDataForRequest(
  assignmentData: unknown,
  files?: File[]
) {
  const formData = new FormData()
  formData.append('assignmentData', JSON.stringify(assignmentData))

  if (files) {
    files.forEach((file) => {
      formData.append('files', file)
    })
  }

  return formData
}

function formatModerationInfractionMessage(
  infractions: string[],
  assignmentTitle: string
) {
  const moderationIssues = infractions
    .map((issueKey) => issueKey.replaceAll('_', ' '))
    .join(', ')

  return `The assignment "${assignmentTitle}" has a safety policy violation in the content. Please review your assignment content for: ${moderationIssues}`
}

function formatModerationInfractionFileMessage(fileNameToInfractionsMap: {
  [fileName: string]: string[]
}) {
  const fileNames = Object.keys(fileNameToInfractionsMap)
  const infractions = Object.values(fileNameToInfractionsMap)
    .flat()
    .map((i) => i.replaceAll('_', ' '))
    .join(', ')

  return `The files could not be attached to the assignment due to a safety policy violation in the content of the following files "${fileNames.join(', ')}". Please review your file content for: ${infractions}`
}
