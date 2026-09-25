import type { Directive } from 'vue'

const toSnakeCase = (name: string) =>
  name
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase()

// posthog-js autocapture reads only attributes with this exact prefix, from the
// clicked element and its ancestors, into the $autocapture event's properties.
// The value is written in snake_case, so `members.period.lastTwoWeeks` reaches
// PostHog as `members.period.last_two_weeks`.
export const vPh: Directive<HTMLElement, string> = (el, { arg, value }) => {
  el.setAttribute(`data-ph-capture-attribute-${arg}`, toSnakeCase(value))
}
