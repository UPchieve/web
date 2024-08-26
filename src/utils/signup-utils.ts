import store from '@/store'

export function getLabelPrefix(isParentGuardian) {
  return isParentGuardian ? "Child's " : ''
}
export function getFormLabelIdentifierPossessive(isParentGuardian) {
  if (isParentGuardian && useNewSignUpFlow()) {
    return "your child's"
  }
  if (isParentGuardian) {
    return "the student's"
  }
  return 'your'
}

export function getFormLabelIdentifier(isParentGuardian) {
  if (isParentGuardian && useNewSignUpFlow()) {
    return 'your child'
  }
  if (isParentGuardian) {
    return 'the student'
  }
  return 'you'
}

export function getFormQuestionIdentifier(isParentGuardian) {
  if (isParentGuardian && useNewSignUpFlow()) {
    return 'Is your child'
  }
  if (isParentGuardian) {
    return 'Is the student'
  }
  return 'Are you'
}

export function getFormAddressee(isParentGuardian) {
  return isParentGuardian ? 'Parent/Guardian' : 'Student'
}

export function getIneligibleCanAppealText(isParentGuardian) {
  return `We just need ${isParentGuardian ? 'you' : 'your parent/guardian'} to answer some more questions first!`
}

function useNewSignUpFlow() {
  return store.getters['featureFlags/useNewSignUpFlow']
}
