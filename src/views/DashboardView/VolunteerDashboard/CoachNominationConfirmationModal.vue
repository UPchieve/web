<script lang="ts" setup>
import Modal from '@/components/Modal.vue'
import { computed, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import CrossIcon from '@/assets/cross.svg'
import UpdogHooray from '@/assets/updog-hooray.svg'

const store = useStore()

onUnmounted(() => {
  store.commit('volunteer/setLastCoachNomination', null)
})

const coachingSkills = computed(
  () => store.state.volunteer.lastCoachNomination?.coachingSkills
)

const emit = defineEmits(['closed'])
</script>

<template>
  <Modal>
    <div class="exit-button" @click="emit('closed')">
      <CrossIcon class="exit-icon" />
    </div>
    <h1>We'll let them know someone noticed!</h1>

    <div class="main-message">
      <p>
        The student will receive a message from UPchieve with the qualities you
        observed. They'll have time to think about it — no pressure either way.
      </p>
      <UpdogHooray class="updog" />
    </div>

    <div class="what-you-shared-container">
      <h2>What you shared</h2>
      <div class="skills-container">
        <div v-for="skill in coachingSkills" :key="skill">
          <span class="emoji">{{ skill.emoji }}</span>
          {{ skill.coachFacingValue }}
        </div>
      </div>
    </div>

    <p>
      The student sees your kind words and decides on their own. We won't loop
      you in on their response.
    </p>
  </Modal>
</template>

<style lang="scss" scoped>
.exit-button {
  margin-left: auto;
  padding: 5px;

  &:hover {
    cursor: pointer;
  }
}
.exit-icon {
  height: 15px;
  width: 15px;
}
h1 {
  @include font-category('display-small');
  margin-top: 0;
}

h2 {
  @include font-category('subheading');
}

p {
  @include font-category('body');
  color: $c-secondary-grey;
}

.what-you-shared-container {
  border: 1px solid $c-border-grey;
  border-radius: 8px;
  padding: 24px;
}

.skills-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.main-message {
  display: flex;
  flex-direction: row;
}

.updog {
  height: 125px;
}
</style>
