<script lang="ts" setup>
import CaretIcon from '@/assets/right-caret.svg'
import { computed } from 'vue'
import { useStore } from 'vuex'
import { IonModal } from '@ionic/vue'

/**
 * @property activatorId: When provided, the menu will open when the element with the given ID is clicked.
 * When not provided, the caret button will be the activator by default.
 */
export type MenuProps = {
  location: string
  buttonHeightPx: number
  caretThickness: 'regular' | 'bold'
  isOpen: boolean
  offsetX: number
  offsetY: number
  transition: 'scale-transition' | 'slide-x-transition' | 'slide-y-transition'
  activatorId: string
}

const props = withDefaults(defineProps<MenuProps>(), {
  location: 'bottom',
  buttonHeightPx: 20,
  caretThickness: 'regular',
  offsetX: 0,
  offsetY: 0,
  transition: 'scale-transition',
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

const activatorId = computed(() =>
  props.activatorId ? `#${props.activatorId}` : null
)
</script>

<template>
  <div class="menu-container">
    <v-menu
      v-model="isMenuOpen"
      :location="props.location"
      :close-on-content-click="false"
      :scrim="false"
      :offset="[props.offsetX, props.offsetY]"
      :transition="props.transition"
      :activator="activatorId"
    >
      <template
        v-if="!props.activatorId"
        v-slot:activator="{ props: activatorProps }"
      >
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
        class="menu-modal"
      >
        <slot name="content" />
      </IonModal>
      <!--      On non-mobile, the menu opens in a popover-->
      <div v-else class="menu">
        <slot name="content" />
      </div>
    </v-menu>
  </div>
  <!--  If there is another element being used as the activator, still render the caret to animate as the-->
  <!--  menu opens or closes-->
  <CaretIcon
    v-if="props.activatorId"
    :class="[
      'caret',
      { 'caret--open': isMenuOpen },
      { 'caret--regular': props.caretThickness === 'regular' },
      { 'caret--bold': props.caretThickness === 'bold' },
    ]"
  />
</template>

<style lang="scss" scoped>
.menu-container {
  position: absolute;
}

.menu-toggle-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-self: center;
  background-color: red;
}

.caret {
  transform: rotate(90deg);
  transition: 200ms linear;
  align-self: center;
  margin-left: auto;
  margin-right: 4px;
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
  background-color: var(--bg-color);
  color: var(--text-color);
  border: 2px solid $c-border-grey;
  box-shadow: 0px 2px 6px 0px rgba(0, 0, 0, 0.1);
  padding: 12px;
  z-index: 1;
  border-radius: 8px;
  width: max-content;
}

:global(.menu-modal) {
  --background: var(--bg-color);
}
</style>
