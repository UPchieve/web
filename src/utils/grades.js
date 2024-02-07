export function gradeLabel(grade) {
  if (grade >= 100) return 'Outstanding'
  if (grade >= 90) return 'Excellent'
  if (grade >= 80) return 'Exceptional'
  if (grade >= 70) return 'Passing Grade'
  if (grade >= 60) return 'Almost there'
  return 'Needs improvement'
}

export function gradeDescription(grade) {
  if (grade >= 100) return 'Absolutely outstanding!'
  if (grade >= 90) return 'Fantastic work! Keep up the excellent effort!'
  if (grade >= 80) return 'Keep up the good work!'
  if (grade >= 70) return `You're almost there. Keep practicing!`
  if (!grade || grade < 70)
    return `Room for improvement, but you've got potential to shine.`
}
