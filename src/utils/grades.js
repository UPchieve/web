export function gradeLabel(grade) {
  if (grade >= 100) return 'Superb'
  if (grade >= 90) return 'Awesome'
  if (grade >= 80) return 'Satisfactory'
  if (grade >= 70) return 'Passing Grade'
  return 'Almost There'
}

export function gradeDescription(grade) {
  if (grade >= 100) return 'Absolutely outstanding!'
  if (grade >= 90) return 'Great job! You are really getting this'
  if (grade >= 80) return 'Keep up the good work!'
  if (grade >= 70) return `You're almost there. Keep practicing!`
  if (!grade || grade < 70)
    return `Room for improvement, but you've got potential to shine.`
}
