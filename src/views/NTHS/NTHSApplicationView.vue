<script lang="ts" setup>
import LargeButton from '@/components/LargeButton.vue'
import ArrowIcon from '@/assets/arrow.svg'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'
import { computed, onMounted, ref } from 'vue'
import { useStore } from 'vuex'

const store = useStore()

const learnMoreLink =
  'https://docs.google.com/document/d/1UDxRRJZ4b_Pt3PfjzN_7hxb-ffaF-hGdn_e_q1RCqqs/edit?tab=t.0'

const applicationLink = computed(() => {
  const user = store.state.user.user
  return `https://docs.google.com/forms/d/e/1FAIpQLSegNVaO1TGij0IZQyTop_735x0aAflc1jkKQPXlCl_Gmu__hA/viewform?usp=pp_url&entry.1706782819=${user.id}`
})

function onClickedLearnMore() {
  AnalyticsService.captureEvent(EVENTS.NTHS_APPLICATION_CLICKED_LEARN_MORE)
}
function onClickedApplyNow() {
  AnalyticsService.captureEvent(EVENTS.NTHS_APPLICATION_CLICKED_APPLY)
}

onMounted(() => {
  AnalyticsService.captureEvent(EVENTS.NTHS_APPLICATION_VIEWED_APPLY_NOW_PAGE)
})

const userId = computed(() => store.state.user.user.id)
const didCopyUserId = ref<boolean>(false)
function copyUserId() {
  if (navigator?.clipboard) {
    navigator.clipboard.writeText(userId.value)
    didCopyUserId.value = true
  }
}
</script>

<template>
  <div class="page">
    <div class="container">
      <div class="content">
        <h1 class="title">National Tutoring Honors Society</h1>
        <span>
          UPchieve's National Tutoring Honor Society (NTHS) is a student-led
          honor society where high schoolers lead chapters that recruit tutors,
          build community, and promote educational equity.
          <br /><br />
          Missed the Spring 2026 cohort deadline? We're inviting a select group
          of student leaders to apply to start an NTHS chapter on a rolling
          basis. Unlike cohort-based programs, this is a self-paced application
          available year-round.
        </span>
        <div class="actions">
          <a
            class="learn-more-link"
            :href="learnMoreLink"
            target="_blank"
            rel="noopener noreferrer"
            @click="onClickedLearnMore"
            ><strong>Learn more about NTHS & the president's role here</strong>
            <arrow-icon class="arrow-icon" />
          </a>
          <span><em>Please only submit one application.</em></span>

          <div class="user-id-container">
            <label for="user-id-input" class="user-id-label">
              <span class="label-main">Your UPchieve User ID</span>
              <span>(You'll need this for your application!)</span>
            </label>
            <div class="copy-container">
              <input type="text" autocomplete="off" disabled :value="userId" />
              <button type="button" @click="copyUserId" class="copy-button">
                {{ didCopyUserId ? 'Copied!' : 'Copy' }}
              </button>
            </div>
          </div>

          <LargeButton
            variant="primary-blue"
            class="apply-button"
            :show-arrow="false"
            :routeTo="applicationLink"
            target="_blank"
            @click="onClickedApplyNow"
            >Apply to Start a Chapter</LargeButton
          >
        </div>
      </div>
      <div class="footer">
        <img class="image" src="@/assets/nths/create-team.png" aria-hidden />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.user-id-container {
  padding: 16px;
  display: flex;
  flex-direction: column;
  border: 1px solid $c-border-grey;
  border-radius: 8px;
  background-color: lighten($c-information-blue, 50);

  .copy-container {
    display: flex;
    width: 100%;
    padding: 8px 16px 16px 16px;

    .copy-button {
      color: $c-information-blue;
      font-weight: 700;
    }
  }

  .user-id-label {
    display: flex;
    flex-direction: column;
    align-items: center;
    .label-main {
      font-weight: 700;
    }
  }

  input {
    border: none;
    background: none;
    width: 100%;
    color: $c-secondary-grey;
  }
}

.title {
  font-weight: 500;
  @include breakpoint-below('medium') {
    font-size: 24px;
  }
}

.page {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 32px;
}
.container {
  border-radius: 8px;
  width: 100%;
  background-color: #fff;
  overflow: hidden;
  box-shadow:
    3px 3px 3px $c-shadow-header,
    -3px 3px 3px $c-shadow-header;

  @include breakpoint-above('medium') {
    max-width: 600px;
  }
}
.content {
  padding: 32px;
  gap: 12px;
  display: flex;
  flex-direction: column;
}
.footer {
  display: flex;
  justify-content: center;
  background-color: $upchieve-green;
  background-color: color-mix(in oklab, $upchieve-green, white 70%);
  padding: 24px;
}
.actions {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 16px;
}
.apply-button {
  margin-top: 16px;
}
.learn-more-link {
  color: $c-success-green;
}
.arrow-icon {
  fill: $c-success-green;
  height: 16px;
  width: 16px;
  margin-top: 2px;
  margin-left: 8px;
}
.image {
  max-height: 233px;
}
.header {
  padding: 1em 1em 0 1em;
  display: flex;
  justify-content: space-between;
  width: 100%;
  @include breakpoint-below('large') {
    flex-direction: column;
  }
}
</style>
