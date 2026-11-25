export type QueryParamValue = string | number | boolean | null | undefined

// Matches URLSearchParams on a plain object: every value goes through
// String(), so undefined is sent as "undefined".
export function toQueryString(params: Record<string, QueryParamValue>) {
  return new URLSearchParams(
    Object.entries(params).map(([key, value]) => [key, String(value)])
  ).toString()
}
