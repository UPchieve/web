export type StudentAssignment = {
  id: string
  dueDate: Date
  submittedAt?: Date
}

export function getIncompleteAssignments(
  assignments: StudentAssignment[]
): StudentAssignment[] {
  //Only get assignments with due dates after the current date and sorted by oldest due date
  const filteredAssignments = assignments.filter(
    (assignment) =>
      !assignment.submittedAt && new Date(assignment.dueDate) >= new Date()
  )

  filteredAssignments.sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  )

  return filteredAssignments
}
