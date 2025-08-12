<script lang="ts" setup>
import type { SimplifiedUpchieveTrainingModule } from '@/views/UpchieveTrainingView/types'
import { computed } from 'vue'
import { useStore } from 'vuex'

const store = useStore()
const props = defineProps<{
  module: SimplifiedUpchieveTrainingModule
}>()

const videoWidth = computed(() => (store.getters['app/mobileMode'] ? 300 : 560))
const videoHeight = computed(() =>
  store.getters['app/mobileMode'] ? 150 : 315
)
</script>

<template>
  <div class="training-module">
    <div class="module-content">
      <div v-if="props.module.key === 'introduction'" class="module-intro">
        <strong>OVERVIEW</strong>
        <p>
          In this training, you'll learn how to be a successful academic coach
          on UPchieve.
        </p>
        <p>
          Once you've completed UPchieve Training and your security screening,
          you'll meet students like Aaron, an UPchieve student alumni who was
          recently admitted to Yale University. Hear Aaron's story in the video
          below!
        </p>

        <!--        @TODO move to Vimeo-->
        <div class="video-content">
          <iframe
            :width="videoWidth"
            :height="videoHeight"
            src="https://www.youtube.com/embed/zlxwGBg4fqU?si=Pf6jGYEU30TaipU8"
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerpolicy="strict-origin-when-cross-origin"
            allowfullscreen
          ></iframe>
        </div>
      </div>
      <div
        v-else-if="
          props.module.material.materialKey ===
          'UPCHIEVE_TRAINING-IMPLEMENTING_EFFECTIVE_COACHING_STRATEGIES'
        "
      >
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
        veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
        commodo consequat. Duis aute irure dolor in reprehenderit in voluptate
        velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint
        occaecat cupidatat non proident, sunt in culpa qui officia deserunt
        mollit anim id est laborum.
      </div>
      <div v-else-if="props.module.key === 'academic-integrity'">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
        veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
        commodo consequat. Duis aute irure dolor in reprehenderit in voluptate
        velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint
        occaecat cupidatat non proident, sunt in culpa qui officia deserunt
        mollit anim id est laborum.
      </div>
      <div v-else-if="props.module.key === 'dei'">
        <p>
          At UPchieve, we’re on a mission: every student, no matter their
          background, should feel comfortable and supported as they work toward
          their goals. That means diversity, equity, and inclusion (DEI) isn’t
          just something we talk about—it’s something every coach and tutor does
          in every session.
        </p>

        <h3>Your Responsibilities as a Volunteer</h3>
      </div>
      <div v-else-if="props.module.key === 'safety'">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
        veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
        commodo consequat. Duis aute irure dolor in reprehenderit in voluptate
        velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint
        occaecat cupidatat non proident, sunt in culpa qui officia deserunt
        mollit anim id est laborum.
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.module-intro {
  display: flex;
  flex-direction: column;
  text-align: start;

  .video-content {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
}
</style>
