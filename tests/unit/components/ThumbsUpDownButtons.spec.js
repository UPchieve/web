import ThumbsUpDownButtons from "@/components/ThumbsUpDownButtons.vue";
import { mount } from "@vue/test-utils";
import { vi } from 'vitest'

describe('ThumbsUpDownButtons', () => {
  const getWrapper = (opts) => {
    return mount(ThumbsUpDownButtons, {
      props: {
        ...opts?.props
      }
    })
  }

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('Calls onClickThumbsUp, onClickThumbsDown when clicked', async () => {
    const onClickThumbsUp = vi.fn()
    const onClickThumbsDown = vi.fn()
    const wrapper = getWrapper({
        props: {
          onClickThumbsUp,
          onClickThumbsDown
      }
    })
    expect(onClickThumbsUp).not.toHaveBeenCalled()
    await wrapper.find('[data-testid="high-rating-btn"]').trigger('click')
    expect(onClickThumbsUp).toHaveBeenCalledOnce()

    expect(onClickThumbsDown).not.toHaveBeenCalled()
    await wrapper.find('[data-testid="low-rating-btn"]').trigger('click')
    expect(onClickThumbsDown).toHaveBeenCalledOnce()
  })
})
