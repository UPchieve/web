<script lang="ts" setup>
import CaretIcon from '@/assets/right-caret.svg'
import { computed } from 'vue'
import { useStore } from 'vuex'
import { IonModal } from '@ionic/vue'
import type { Anchor } from 'vuetify'

export type MenuProps = {
  location: Anchor
  buttonHeightPx: number
  caretThickness: 'regular' | 'bold'
  isOpen: boolean
  offsetX?: number
  offsetY?: number
  transition?: 'scale-transition' | 'slide-x-transition' | 'slide-y-transition'
  useS2vTheming?: boolean
}

const props = withDefaults(defineProps<MenuProps>(), {
  location: 'bottom',
  buttonHeightPx: 20,
  caretThickness: 'regular',
  offsetX: 0,
  offsetY: 0,
  transition: 'scale-transition',
  useS2vTheming: false,
})
const buttonHeight = computed(() => props.buttonHeightPx + 'px')
const store = useStore()
const isMobileMode = computed(() => store.getters['app/mobileMode'])

const emit = defineEmits<{
  (e: 'update:isOpen', value: boolean): void
}>()

const isMenuOpen = computed({
  get: () => props.isOpen,
  set: (value) => emit('update:isOpen', value),
})
</script>

<template>
  <div>
    <v-menu
      v-model="isMenuOpen"
      :location="props.location"
      :close-on-content-click="false"
      :scrim="false"
      :offset="[props.offsetX, props.offsetY]"
      :transition="props.transition"
    >
      <template v-slot:activator="{ props: activatorProps }">
        <div
          class="menu-toggle-container"
          data-testid="menu-container"
          role="button"
          v-bind="activatorProps"
          :aria-label="isMenuOpen ? 'Close user menu' : 'Open user menu'"
          :aria-expanded="isMenuOpen"
          aria-haspopup="menu"
        >
          <CaretIcon
            :class="[
              'caret',
              { 'caret--open': isMenuOpen },
              { 'caret--regular': props.caretThickness === 'regular' },
              { 'caret--bold': props.caretThickness === 'bold' },
            ]"
          />
        </div>
      </template>
      <!--      On Mobile Mode, open the menu in a bottom drawer-->
      <IonModal
        v-if="isMobileMode"
        :is-open="isMenuOpen"
        :initial-breakpoint="0.9"
        :breakpoints="[0, 0.9]"
        :backdrop-dismiss="true"
        :can-dismiss="true"
        presentation="sheet"
        :class="['menu-modal', { s2v: props.useS2vTheming }]"
        @didDismiss="(e) => emit('update:isOpen', e)"
      >
        <slot name="content" />
      </IonModal>
      <!--      On non-mobile, the menu opens in a popover-->
      <div v-else :class="['menu', { s2v: props.useS2vTheming }]">
        <slot name="content" />
      </div>
    </v-menu>
  </div>
</template>

<style lang="scss" scoped>
.menu-toggle-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-self: center;
}

.caret {
  transform: rotate(90deg);
  transition: 200ms linear;
  align-self: center;
  margin-left: 16px;
  height: v-bind(buttonHeight);
  width: v-bind(buttonHeight);

  :deep(path) {
    stroke: var(--secondary-text-color);
  }

  &--regular {
    :deep(path) {
      stroke-width: 1;
    }
  }

  &--bold {
    :deep(path) {
      stroke-width: 2;
    }
  }

  &--open {
    transform: rotate(-90deg);
  }
}

.menu {
  background-color: white;
  border: 2px solid $c-border-grey;
  box-shadow: 0px 2px 6px 0px rgba(0, 0, 0, 0.1);
  padding: 12px;
  z-index: 1;
  border-radius: 8px;
  width: max-content;
}

.menu.s2v {
  background-color: var(--bg-color);
  color: var(--text-color);
}

:global(.menu-modal) {
  --background: white;
}

:global(.menu-modal.s2v) {
  --background: var(--bg-color);
}
</style>
