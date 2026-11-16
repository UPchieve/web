<script lang="ts" setup>
import { ref } from 'vue'
import Modal from '@/components/Modal.vue'
import LargeButton from '@/components/LargeButton.vue'

type OnboardingFrame = {
  step: number
  heading: string
  text: string
  image: string
}

interface OnboardingFrameProps {
  closeModal: () => void
  pages: Array<OnboardingFrame>
  nextButtonText?: string
  acceptButtonText?: string
  previousButtonText?: string
}

const {
  closeModal,
  pages,
  nextButtonText,
  acceptButtonText,
  previousButtonText,
} = withDefaults(defineProps<OnboardingFrameProps>(), {
  nextButtonText: () => 'Continue',
  acceptButtonText: () => 'Got it!',
  previousButtonText: () => 'Back',
})

const currentPage = ref(0)

const nextPage = () => {
  if (hasNextPage()) currentPage.value++
}

const previousPage = () => {
  if (hasPreviousPage()) currentPage.value--
}

const hasNextPage = () => {
  return currentPage.value < pages.length - 1
}

const hasPreviousPage = () => {
  return currentPage.value > 0
}
</script>

<template>
  <Modal class="modal" :close-modal="closeModal">
    <div class="OnboardingModal">
      <div class="OnboardingModal-container">
        <div v-if="pages[currentPage].image.url" class="OnboardingModal-image">
          <picture>
            <source
              :srcset="pages[currentPage].image.url"
              :type="pages[currentPage].image.type"
            />
            <img
              :src="pages[currentPage].image.fallback.url"
              :type="pages[currentPage].image.fallback.type"
            />
          </picture>
        </div>
        <div class="OnboardingModal-text">
          <h1 class="OnboardingModal-title">
            {{ pages[currentPage].heading }}
          </h1>

          <p class="OnboardingModal-description">
            {{ pages[currentPage].text }}
          </p>
        </div>
      </div>

      <div class="separator"></div>
    </div>
    <div class="footer">
      <div class="back-button-container">
        <LargeButton
          class="button back-button"
          @click="previousPage"
          v-if="hasPreviousPage()"
          :show-arrow="false"
        >
          {{ previousButtonText }}
        </LargeButton>
      </div>

      <div class="dots">
        <div
          v-for="(page, index) in pages"
          :key="page.step"
          :class="['dot', { active: index === currentPage }]"
        ></div>
      </div>

      <div class="next-button-container">
        <LargeButton
          class="button next-button"
          :primary="currentPage === pages.length - 1"
          @click="hasNextPage() ? nextPage() : closeModal()"
        >
          {{ hasNextPage() ? nextButtonText : acceptButtonText }}
        </LargeButton>
      </div>
    </div>
  </Modal>
</template>

<style lang="scss" scoped>
:deep(.upc-modal-form) {
  padding-bottom: 16px;
  max-height: 100vh;

  @include breakpoint-above('medium') {
    padding: 0;
    padding-bottom: 16px;
  }
}

.OnboardingModal {
  @include flex-container(column, center, center);
  @include child-spacing(top, 24px);
  text-align: center;

  &-container {
    @include flex-container(column, center, center);
    align-items: center;
  }

  &-image {
    @include flex-container(column, center, center);
    background-color: $selected-green;
    padding: 40px 20px 10px 20px;
    width: 100%;

    img {
      width: 100%;
      max-height: 300px;
      object-fit: contain;
    }
  }

  &-text {
    padding: 18px;
    width: 100%;

    @include breakpoint-below('small') {
      width: 80%;
    }

    @include breakpoint-below('tiny') {
      width: 70%;
    }
  }

  &-title {
    @include font-category('display-small');
    margin-bottom: 1.4em;
    @include breakpoint-above('medium') {
      margin-top: 24px;
    }
  }

  &-description {
    font-size: 1rem;
    color: gray;
  }
}

.footer {
  // Equal-width side columns keep the dots optically centered while each
  // button sizes to its own label. The fixed-width columns this replaces left
  // ~60px for text once the arrow icon was accounted for, so anything longer
  // than "Next" ellipsised.
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  grid-template-areas: 'back dots next';
  align-items: center;
  gap: 16px;
  padding: 18px;
  position: relative;
  margin-top: 16px;

  // At phone widths the two labels plus the dots can't share a row, so the
  // dots move above the actions rather than squeezing them back into ellipses.
  @include breakpoint-below('small') {
    grid-template-columns: auto auto;
    grid-template-areas:
      'dots dots'
      'back next';
    justify-content: space-between;
    row-gap: 20px;
  }

  .back-button-container {
    grid-area: back;
    justify-self: start;
  }

  .next-button-container {
    grid-area: next;
    justify-self: end;

    .next-button {
      background: $c-information-blue;
      color: White;
    }
  }

  .dots {
    @include flex-container(row, center, center);
    grid-area: dots;
    justify-self: center;
    gap: 10px;

    .dot {
      width: 10px;
      height: 10px;
      background-color: $border-grey;
      border-radius: 50%;

      &.active {
        background-color: $c-default-grey;
      }
    }
  }
}

.separator {
  width: 90%;
  height: 2px;
  background-color: $c-background-grey;
}
</style>
