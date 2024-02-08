<template>
  <div class="course">
    <div v-if="course" class="course__container">
      <div class="course__title">{{ course.name }}</div>
      <div class="course__description">{{ course.description }}</div>
      <div class="course__modules">
        <module
          v-for="module in course.modules"
          :key="module.name"
          :module="module"
          v-on:material-completed="trackMaterialProgress"
        />
        <quiz-link
          :isDisabled="!course.isComplete"
          :quizKey="course.quizKey"
          :quizName="course.quizName"
          :certification="quizCertification"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import NetworkService from '@/services/NetworkService'
import Module from './Module.vue'
import QuizLink from './QuizLink.vue'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'
import LoggerService from '@/services/LoggerService'

export default {
  name: 'TrainingCourseView',
  components: {
    Module,
    QuizLink,
  },
  data() {
    return {
      course: null,
    }
  },
  async created() {
    const courseKey = this.$route.params.courseKey
    const {
      data: { course },
    } = await NetworkService.getTrainingCourse(courseKey)
    this.course = course
  },
  computed: {
    ...mapState({
      certifications: state => state.user.user.certifications,
    }),
    quizCertification() {
      return this.certifications[this.course.quizKey]
    },
  },
  methods: {
    async trackMaterialProgress(materialKey) {
      let materialName = ''
      this.course.modules.forEach(mod => {
        mod.materials.forEach(mat => {
          if (mat.materialKey === materialKey) {
            mat.isCompleted = true
            materialName = mat.name
          }
        })
      })

      try {
        const {
          data: { progress, isComplete },
        } = await NetworkService.recordTrainingCourseProgress(
          this.course.courseKey,
          materialKey
        )

        this.course.progress = progress
        this.course.isComplete = isComplete
        AnalyticsService.captureEvent(EVENTS.MATERIAL_COMPLETED, {
          event: EVENTS.MATERIAL_COMPLETED,
          title: materialName,
        })
      } catch (error) {
        LoggerService.noticeError(error)
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.course {
  padding: 10px;
  width: 100%;

  @include breakpoint-above('large') {
    padding: 40px;
  }

  &__container {
    background: #fff;
    border-radius: 8px;
    padding: 20px 10px;

    @include breakpoint-above('medium') {
      padding: 20px;
    }

    @include breakpoint-above('large') {
      padding: 40px;
    }
  }

  &__title {
    font-size: 24px;
    font-weight: 500;
  }

  &__description {
    text-align: left;
    font-size: 18px;
    color: $c-secondary-grey;
    margin: 20px 0 30px;

    @include breakpoint-above('large') {
      margin: 30px 0 40px;
    }
  }

  &__progress {
    color: $c-information-blue;
    &--step {
      font-weight: 600;
    }
  }
}
</style>
