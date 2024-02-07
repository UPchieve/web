<template>
  <div class="progress-report">
    <section>
      <h1 class="progress-report__title--subject-score">
        {{ subjectDisplayName }} Score
      </h1>
      <h2 class="progress-report__title--grade-status">
        {{ gradeLabel(progressReport.summary.overallGrade) }}
      </h2>
      <p>{{ gradeDescription(progressReport.summary.overallGrade) }}</p>
      <grade-bars
        class="progress-report__grade-bars"
        :grade="progressReport.summary.overallGrade"
      />
    </section>

    <section>
      <p>{{ progressReport.summary.summary }}</p>
    </section>

    <section class="progress-report__overview-graphics">
      <div
        v-if="topConcept"
        class="progress-report__overview-top-concept progress-report__overview-graphics-stat"
      >
        <p class="progress-report__overview-subtitle">
          Strongest Concept
        </p>
        <p class="progress-report__concepts-concept">
          {{ topConcept.name }}
        </p>
      </div>

      <div
        class="progress-report__overview-practice progress-report__overview-graphics-stat"
      >
        <p class="progress-report__overview-subtitle">
          Concepts to Practice
        </p>
        <ol class="progress-report__overview-list">
          <li v-for="(practice, index) in practiceAreas" :key="practice.name">
            <span class="progress-report__concepts-concept" v-if="index < 5">{{
              practice.name
            }}</span>
          </li>
        </ol>
      </div>
    </section>

    <section>
      <h1
        class="progress-report__header progress-report__header-recommendations"
      >
        Recommendations for Improvement:
      </h1>
      <ol class="progress-report__overview-list">
        <li v-for="practice in practiceAreas" :key="practice.name">
          <span class="progress-report__concepts-concept">{{
            practice.name
          }}</span>
          - <span>{{ practice.content }}</span>
        </li>
      </ol>
    </section>
  </div>
</template>

<script>
import GradeBars from './GradeBars.vue'
import { gradeLabel, gradeDescription } from '@/utils/grades'

export default {
  name: 'ProgressReportSession',
  components: {
    GradeBars,
  },
  props: {
    progressReport: {
      type: Object,
      required: true,
    },
    subjectDisplayName: {
      type: String,
      required: true,
    },
  },
  computed: {
    summaryForRecommendations() {
      return this.getSummaryForFocusAreaAndInfoType(
        this.progressReport.summary,
        'practiceArea',
        'recommendation'
      )
    },
    topConcept() {
      const strengths = this.filteredConceptsWithFocusArea('strength') ?? []
      return strengths[0]
    },
    practiceAreas() {
      const practiceAreas =
        this.filteredConceptsWithFocusArea('practiceArea') ?? []
      const endResult = []
      for (const practiceArea of practiceAreas) {
        const name = practiceArea.name
        let content = ''
        for (const detail of practiceArea.details) {
          if (detail.focusArea === 'practiceArea') content += detail.content
        }
        endResult.push({ name, content })
      }

      return endResult
    },
    gradeLabel(grade) {
      return gradeLabel(grade)
    },
    gradeDescription(grade) {
      return gradeDescription(grade)
    },
  },
  methods: {
    getSummaryForFocusAreaAndInfoType(data, focusArea, infoType) {
      const summary = data.details
        .filter(
          detail =>
            detail.focusArea === focusArea && detail.infoType === infoType
        )
        .map(detail => detail.content)
      return summary.join('. ')
    },
    filteredConceptsWithFocusArea(focusArea) {
      const includedConceptNames = new Set()
      const filteredConcepts = this.progressReport.concepts.filter(concept => {
        if (
          !includedConceptNames.has(concept.name) &&
          concept.details.some(detail => detail.focusArea === focusArea)
        ) {
          includedConceptNames.add(concept.name)
          return true
        }
        return false
      })
      filteredConcepts.sort((a, b) => b.grade - a.grade)
      return filteredConcepts
    },
  },
}
</script>

<style lang="scss" scoped>
p {
  margin-bottom: 0;
}

.progress-report {
  &__concepts {
    padding-left: 1em;

    &--score {
      padding-left: 2em;
    }

    &-concept {
      font-weight: 500;

      &--score {
        margin-top: 0;
      }
    }

    &-concept-name {
      font-weight: 600;
    }

    &-concept-score {
      font-weight: 500;
    }
  }

  &__header {
    @include font-category('body');
    margin-top: 1em;
    margin-bottom: 0.5em;
    font-weight: 600;
    padding: 0.5em 1em;

    &-score {
      background-color: lighten($c-information-blue, $amount: 45%);
    }
    &-excellence {
      background-color: lighten($upchieve-green, $amount: 17%);
    }
    &-recommendations {
      background-color: lighten($c-warning-orange, $amount: 25%);
    }
  }

  &__overview {
    background-color: $upchieve-white;
    padding: 2em;
    border-radius: 8px;
    margin: 2em 0;

    &-graphics {
      position: relative;
      margin: 1em 0;

      @include breakpoint-above('large') {
        display: grid;
        grid-template-columns: minmax(auto, 250px) auto;
        gap: 0 10px;
      }

      @include breakpoint-between('992px', '1200px') {
        grid-template-columns: 50% 50%;
        grid-template-rows: auto;
      }

      &-stat {
        padding: 1em;
        border-radius: 12px;
        margin-bottom: 1em;
      }
    }

    &-subtitle {
      font-size: 14px;
    }

    &-level {
      background-color: #fbebfb;
    }

    &-top-concept {
      background-color: #d1f6fe;
    }

    &-practice {
      background-color: #feedbd;
      &-list {
        padding-left: 1.4em;
      }
    }
  }

  &__title {
    &--subject-score {
      font-size: 14px;
      font-weight: 400px;
    }

    &--grade-status {
      margin-bottom: 0;
    }
  }

  &__grade-bars {
    margin: 1em 0;
  }
}
</style>
