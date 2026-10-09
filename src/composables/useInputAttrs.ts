import { useAttrs } from 'vue'
import { omit, pick } from 'lodash-es'

type Attrs = Record<string, unknown>
const WRAPPER_ATTRS = ['class', 'style']

export function useInputAttrs(omitFromInput: string[] = []): {
  attrs: Attrs
  wrapperAttrs: () => Attrs
  inputAttrs: () => Attrs
  inputId: () => string
} {
  const attrs = useAttrs()

  const wrapperAttrs = (): Attrs => pick(attrs, WRAPPER_ATTRS)
  const inputAttrs = (): Attrs =>
    omit(attrs, [...WRAPPER_ATTRS, ...omitFromInput])
  const inputId = (): string => attrs.id as string

  return { attrs, wrapperAttrs, inputAttrs, inputId }
}
