<script lang="ts" setup>
import CaretIcon from '@/assets/right-caret.svg'
import { computed, ref } from 'vue'
import { useStore } from 'vuex'
import { IonModal } from '@ionic/vue'
export type MenuProps = {
  location: string // i.e. 'top center' see https://vuetifyjs.com/en/components/overlays/#location-strategies
}
const props = defineProps<MenuProps>()
const store = useStore()
const isMobileMode = computed(() => store.getters['app/mobileMode'])

const isMenuOpen = ref<boolean>(false)
function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}
</script>

<template>
  <div>
    <div
      class="menu-toggle-container"
      role="button"
      @click="toggleMenu"
      id="toggle"
    >
      <CaretIcon
        class="caret"
        :class="{
          'caret--open': isMenuOpen,
        }"
      />
    </div>

    <v-menu
      v-if="isMenuOpen"
      :location="props.location"
      origin="auto"
      locationStrategy="connected"
      :scrim="false"
    >
      <div class="menu" v-if="isMenuOpen" activator="#toggle">
        <!--      On Mobile Mode, open the menu in a bottom drawer-->
        <IonModal
          v-if="isMobileMode"
          :isOpen="isMenuOpen"
          :initial-breakpoint="0.9"
          :breakpoints="[0, 0.9]"
          :backdrop-dismiss="true"
          :can-dismiss="true"
          presentation="sheet"
          @didDismiss="toggleMenu"
        >
          <slot name="content" />
        </IonModal>
        <!--      On non-mobile, the menu opens in a popover-->
        <div v-else>
          <slot name="content" />
        </div>
      </div>
    </v-menu>
  </div>
</template>

<style lang="scss" scoped>
.menu-toggle-container {
  width: 30px;
  height: 30px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-self: center;
}

.caret {
  transform: rotate(90deg);
  transition: 200ms linear;
  align-self: center;

  :deep(path) {
    stroke-width: 2;
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
  position: absolute;
}
</style>
