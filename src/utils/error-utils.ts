export function isErrorWithResponse(
  obj: unknown | { response: { data: { err: string } } }
): obj is { response: { data: { err: string } } } {
  return !!obj && Object.hasOwn(obj, 'response')
}
