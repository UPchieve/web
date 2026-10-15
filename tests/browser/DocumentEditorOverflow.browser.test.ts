import { afterEach, describe, expect, it } from 'vitest'
import '@/views/SessionView/DocumentEditor.vue'
import '@/views/SessionView/DocumentEditorV2.vue'

function appendQuillEditor(parentClass?: string) {
  const parent = document.createElement('div')
  if (parentClass) parent.className = parentClass

  const editor = document.createElement('div')
  editor.className = 'ql-editor'
  parent.appendChild(editor)
  document.body.appendChild(parent)

  return editor
}

describe('document editor overflow styles', () => {
  afterEach(() => {
    document.body.replaceChildren()
  })

  it('allows the live document editor container to own scrolling', () => {
    const editor = appendQuillEditor('document-editor')

    expect(getComputedStyle(editor).overflowY).toBe('visible')
  })

  it('does not override Quill scrolling outside a live document editor', () => {
    const editor = appendQuillEditor()

    expect(getComputedStyle(editor).overflowY).toBe('auto')
  })
})
