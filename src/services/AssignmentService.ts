import type { AxiosError } from 'axios'
import { EVENTS } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'
import NetworkService from '@/services/NetworkService'

type AssignmentData = {
  description: string
  title: string
  numberOfSessions: number
  minDurationInMinutes: number
  dueDate: Date
  startDate: Date
  isRequired: boolean
  subjectId: number
}

type TeacherClass = any
type Student = any

export async function createAssignment(
  assignmentData: AssignmentData,
  selectedClasses: TeacherClass[],
  selectedStudents: Student[],
  files: File[]
) {
  if (!selectedClasses.length) {
    return {
      error: 'Must select at least one class',
    }
  }

  let newAssignments
  try {
    const classIds = selectedClasses.map((selectedClass) => selectedClass.id)
    const studentIds =
      selectedStudents.length > 0
        ? selectedStudents.map((selectedStudent) => selectedStudent.id)
        : []

    const {
      data: { assignment },
    } = await NetworkService.createAssignment({
      ...assignmentData,
      classIds,
      studentIds,
    })

    newAssignments = assignment
  } catch (err) {
    const moderationInfraction = (
      (err as AxiosError).response?.data as { moderationFailures?: string[] }
    )?.moderationFailures
    if (moderationInfraction) {
      return {
        error: formatModerationInfractionMessage(
          moderationInfraction,
          assignmentData.title
        ),
      }
    }
    return {
      error: 'Unable to create assignment',
    }
  }

  // TODO: Move to backend in previous request.
  if (files.length) {
    const infractions = await uploadFiles(
      newAssignments.map((a: { id: string }) => a.id),
      files
    )
    if (infractions.length) {
      return {
        error: formatModerationInfractionFileMessage(
          (infractions[0] as PromiseRejectedResult).reason.response.data
            .moderationFailures
        ),
      }
    }
  }

  AnalyticsService.captureEvent(EVENTS.ASSIGNMENT_CREATED, assignmentData)

  return { assignments: newAssignments }
}

export async function editAssignment(
  assignmentData: AssignmentData,
  studentsToAdd: string[],
  studentsToRemove: string[],
  files: File[]
) {
  let edittedAssignment
  try {
    const {
      data: { assignment },
    } = await NetworkService.editAssignment({
      ...assignmentData,
      studentsToAdd,
      studentsToRemove,
    })
    edittedAssignment = assignment
  } catch (err) {
    const moderationInfraction = (
      (err as AxiosError).response?.data as { moderationFailures?: string[] }
    )?.moderationFailures
    if (moderationInfraction) {
      return {
        error: formatModerationInfractionMessage(
          moderationInfraction,
          assignmentData.title
        ),
      }
    }
    return {
      error: 'Unable to edit assignment',
    }
  }

  // TODO: Move to backend in previous request.
  if (files.length) {
    const infractions = await uploadFiles([edittedAssignment.id], files)
    if (infractions.length) {
      return {
        error: formatModerationInfractionFileMessage(
          (infractions[0] as PromiseRejectedResult).reason.response.data
            .moderationFailures
        ),
      }
    }
  }
  return { assignment: edittedAssignment }
}

async function uploadFiles(assignmentIds: string[], files: File[]) {
  const responses = await Promise.allSettled(
    assignmentIds.map((assignmentId) =>
      NetworkService.uploadFiles({ assignmentId, files })
    )
  )

  const infractions = responses.filter(
    (r) =>
      r.status === 'rejected' && !!r.reason?.response?.data?.moderationFailures
  )
  return infractions
}

function formatModerationInfractionMessage(
  infractions: string[],
  assignmentTitle: string
) {
  const moderationIssues = infractions.map((issueKey) => {
    return issueKey.replace('_', ' ')
  })

  return `The assignment "${assignmentTitle}" could not be edited due to a safety policy violation in the content. Please review your assignment content for: ${moderationIssues}`
}

function formatModerationInfractionFileMessage(fileNameToFailuresMap: {
  [fileName: string]: string[]
}) {
  const fileName = Object.keys(fileNameToFailuresMap)[0]
  const moderationIssues = fileNameToFailuresMap[fileName].map((issueKey) => {
    return issueKey.replace('_', ' ')
  })

  return `The files could not be attached to the assignment due to a safety policy violation in the content of file "${fileName}" - Please review your file content for: ${moderationIssues}`
}
