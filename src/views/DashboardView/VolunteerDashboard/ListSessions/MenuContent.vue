<script lang="ts" setup>
import ToggleButton from '@/components/ToggleButton.vue'
import InformationIcon from '@/assets/information.svg'
import { vTooltip } from 'maz-ui'
import { useStore } from 'vuex'
import { computed } from 'vue'

const store = useStore()
const props = defineProps<{
  showLockedSessions: boolean
}>()
const emit = defineEmits(['toggleShowLockedSessions'])
const mobileMode = computed(() => store.getters['app/mobileMode'])
const tooltipText = "See sessions in subjects you haven't unlocked yet"
const lockedSessionsLabel = '🔒Locked sessions'
</script>

<template>
  <div>
    <div
      :class="{
        'menu-content': !mobileMode,
        'menu-content--mobile': mobileMode,
      }"
    >
      <label for="show-locked-sessions-toggle" class="setting-label">
        {{ lockedSessionsLabel }}</label
      >
      <!--      Desktop view uses a tooltip-->
      <span
        v-if="!mobileMode"
        class="helper"
        v-tooltip="{
          text: `${tooltipText}`,
          color: 'black',
          position: 'top',
        }"
      >
        <InformationIcon />
      </span>

      <!--      Mobile does not-->
      <span v-else class="helper-text">{{ tooltipText }}</span>

      <div class="toggle">
        <ToggleButton
          data-testid="show-locked-sessions-toggle"
          id="show-locked-sessions-toggle"
          :value="props.showLockedSessions"
          @change="() => emit('toggleShowLockedSessions')"
          :labels="{ checked: 'Show', unchecked: 'Hide' }"
          :width="75"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.menu-content {
  padding: 2% 4%;
  display: grid;
  grid-template-rows: 1fr;
  grid-template-columns: [label] max-content [helper] 1fr [toggle] 1fr;
  column-gap: 5%;
  align-items: center;

  .setting-label {
    grid-column: label;
    margin-bottom: 0;

    label {
      margin-bottom: 0;
    }
  }

  .helper {
    grid-column: helper;
  }

  .toggle {
    grid-column: toggle;
  }

  &--mobile {
    display: flex;
    flex-direction: row;
    padding: 12% 8% 8%;
    align-items: center;
    text-align: center;
    gap: 4%;
    margin-bottom: 0;
  }
}

label {
  margin-bottom: 0;
}

.helper-text {
  @include font-category('helper-text');
}
</style>
