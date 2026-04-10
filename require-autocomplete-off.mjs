import { Rule } from 'html-validate'

const TARGET_ELEMENTS = ['form', 'input', 'select', 'textarea']

class RequireAutocompleteOff extends Rule {
  documentation() {
    return {
      description:
        'All form, input (text or numeric), select, and textarea elements must have autocomplete="off" to prevent browser autofill.',
    }
  }

  setup() {
    this.on('dom:ready', (event) => {
      const { document } = event
      const selector = TARGET_ELEMENTS.join(',')
      const elements = document.querySelectorAll(selector)

      for (const element of elements) {
        const tagName = element.tagName.toLowerCase()
        const type = element.getAttribute('type')

        // Input elements with non text or numeric types (e.g. radio, checkbox, etc.) should
        // not have `autocomplete` attribute.
        // Input elements with type="password" should receive `autocomplete="new-password"`
        // instead, which is covered by an existing rule.
        if (tagName === 'input' && ['radio', 'checkbox', 'file', 'password'].includes(type?.value)) {
          continue
        }

        const autocomplete = element.getAttribute('autocomplete')
        if (!autocomplete) {
          this.report(
            element,
            `<${tagName}> is missing required attribute "autocomplete"`,
            element.location
          )
          continue
        }

        const value = autocomplete.value
        if (value !== 'off') {
          this.report(
            element,
            `<${tagName}> autocomplete attribute must be "off", got "${value}"`,
            autocomplete.valueLocation ?? element.location
          )
        }
      }
    })
  }
}

export default {
  name: 'local',
  rules: {
    'local/require-autocomplete-off': RequireAutocompleteOff,
  },
}
