export function isErrorWithResponse(
  obj: unknown | { response: { status?: number; data: { err: string } } }
): obj is { response: { status?: number; data: { err: string } } } {
  return !!obj && Object.hasOwn(obj, 'response')
}
