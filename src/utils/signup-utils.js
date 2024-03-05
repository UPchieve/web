export function getFormLabelIdentifierPossessive(isParentGuardian) {
  return isParentGuardian ? "the student's" : 'your'
}

export function getFormLabelIdentifier(isParentGuardian) {
  return isParentGuardian ? 'the student' : 'you'
}

export function getFormQuestionIdentifier(isParentGuardian) {
  return isParentGuardian ? 'Is the student' : 'Are you'
}

export function getFormAddressee(isParentGuardian) {
  return isParentGuardian ? 'Parent/Guardian' : 'Student'
}

export function getIneligibleCanAppealText(isParentGuardian) {
  return `We just need ${isParentGuardian ? 'you' : 'your parent/guardian'} to answer some more questions first!`
}
