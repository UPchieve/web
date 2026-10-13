import { describe, expect, it } from 'vitest'
import { useAppModalStore } from '@/stores/app/modal'

describe('`app/modal` store', () => {
  it('show sets the modal and fills missing props with empty objects', () => {
    const store = useAppModalStore()

    store.show({ component: 'ConfirmModal', data: { backText: 'Back' } })

    expect(store.isShown).toBe(true)
    expect(store.component).toBe('ConfirmModal')
    expect(store.modalTemplateProps).toEqual({ backText: 'Back' })
    expect(store.componentProps).toEqual({})
  })

  it('update merges into the existing props', () => {
    const store = useAppModalStore()
    store.show({
      component: 'ConfirmModal',
      data: { backText: 'Back' },
      componentProps: { a: 1 },
    })

    store.update({
      modalTemplateProps: { showTemplateButtons: false },
      componentProps: { b: 2 },
    })

    expect(store.modalTemplateProps).toEqual({
      backText: 'Back',
      showTemplateButtons: false,
    })
    expect(store.componentProps).toEqual({ a: 1, b: 2 })
  })

  it('hide resets everything', () => {
    const store = useAppModalStore()
    store.show({ component: 'ConfirmModal', data: { x: 1 } })

    store.hide()

    expect(store.isShown).toBe(false)
    expect(store.component).toBeNull()
    expect(store.modalTemplateProps).toEqual({})
    expect(store.componentProps).toEqual({})
  })
})
