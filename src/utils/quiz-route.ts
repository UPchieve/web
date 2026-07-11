import Case from 'case'

export function quizRoute(subject: string) {
  return `/training/${Case.kebab(subject)}/quiz`
}
