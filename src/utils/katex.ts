import renderMathInElement from 'katex/contrib/auto-render/auto-render'

export function renderKatexInElement(
  element: HTMLElement | null,
  errorCallback: () => void
) {
  if (!element) return

  renderMathInElement(element, {
    delimiters: [
      //remove delimiter
      { left: '$$', right: '$$', display: true },
      //render latex like standalone equation block
      { left: '\\[', right: '\\]', display: true },
      //render latex inline like text
      { left: '\\(', right: '\\)', display: false },
    ],
    errorCallback: errorCallback,
  })
}
