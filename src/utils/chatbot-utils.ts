import katex from 'katex'

export function getSessionEndDMsMessage(
  isSessionStudent: boolean,
  isViewingSessionRecap: boolean
) {
  let contents = `Your session has ended, but you can still <b>${isSessionStudent ? 'review what you discussed with this coach' : 'share extra resources and tips with this student'}!</b>`
  if (!isViewingSessionRecap) {
    contents += `\n\nYou can continue conversations asynchronously by messaging in this chat or later by going to the "Session History" tab and finding this session chat!`
  }
  contents += `\n\nYour ${isSessionStudent ? 'coach' : 'student'} will receive an email notification about your message and may respond later.`
  return contents
}

export function renderLatex(
  contents: string,
  escapeHtml?: (s: string) => string
) {
  const stripped = contents.startsWith('LATEX:') ? contents.slice(6) : contents

  return stripped
    .split(/\$([^$]+)\$/)
    .map((part, i) =>
      i % 2 === 1
        ? katex.renderToString(part, {
            throwOnError: false,
            displayMode: false,
          })
        : escapeHtml
          ? escapeHtml(part)
          : part
    )
    .join('')
}
