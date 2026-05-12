<script lang="ts" setup>
import CaretIcon from '@/assets/right-caret.svg'
import { computed, ref } from 'vue'
import { useStore } from 'vuex'
import { IonModal } from '@ionic/vue'
import type { Anchor } from 'vuetify'

export type MenuProps = {
  location: Anchor // i.e. 'top center' see https://vuetifyjs.com/en/components/overlays/#location-strategies
}
const props = defineProps<MenuProps>()
const store = useStore()
const isMobileMode = computed(() => store.getters['app/mobileMode'])
const isMenuOpen = ref<boolean>(false)
</script>

<template>
  <div>
    <div class="menu-toggle-container" role="button" id="toggle">
      <CaretIcon
        class="caret"
        :class="{
          'caret--open': isMenuOpen,
        }"
      />
    </div>

    <v-menu
      v-model="isMenuOpen"
      v-on:update:model-value="(isOpen) => (isMenuOpen = isOpen)"
      activator="#toggle"
      :location="props.location"
      :close-on-content-click="false"
      origin="auto"
      locationStrategy="connected"
      :scrim="false"
      :offset="[0, 275]"
    >
      <!--      On Mobile Mode, open the menu in a bottom drawer-->
      <IonModal
        v-if="isMobileMode"
        :is-open="isMenuOpen"
        :initial-breakpoint="0.9"
        :breakpoints="[0, 0.9]"
        :backdrop-dismiss="true"
        :can-dismiss="true"
        presentation="sheet"
      >
        <slot name="content" />
      </IonModal>
      <!--      On non-mobile, the menu opens in a popover-->
      <div v-else>
        <div class="menu">
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
  transition: 200ms linear;
  align-self: center;

  :deep(path) {
    stroke-width: 2;
  }

  &--open {
    transform: rotate(90deg);
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
