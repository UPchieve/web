<template>
  <div class="progress-report">
    <section>
      Topics that were discussed in the session:
      <ol class="progress-report__concepts">
        <li
          v-for="concept of progressReport.concepts"
          :key="concept.name"
          class="progress-report__concepts-concept"
        >
          <span class="progress-report__concepts-concept-name"
            >{{ concept.name }} -
          </span>
          <span>{{ concept.description }}</span>
        </li>
      </ol>
    </section>

    <section>
      <h1 class="progress-report__header progress-report__header-score">
        Score
      </h1>

      <ol class="progress-report__concepts progress-report__concepts--score">
        <li
          v-for="concept of progressReport.concepts"
          :key="concept.name"
          class="progress-report__concepts-concept progress-report__concepts-concept--score"
        >
          <span class="progress-report__concepts-concept-name"
            >{{ concept.name }}:
          </span>
          <span class="progress-report__concepts-concept-score"
            >Score: {{ concept.grade }}</span
          >
        </li>
      </ol>
    </section>

    <section>
      <h1 class="progress-report__header progress-report__header-excellence">
        Areas of Excellence:
      </h1>
      <p>{{ summaryForStrengths }}</p>
    </section>

    <section>
      <h1
        class="progress-report__header progress-report__header-recommendations"
      >
        Recommendations for Improvement:
      </h1>
      <p>{{ summaryForRecommendations }}</p>
    </section>
  </div>
</template>

<script>
export default {
  props: {
    progressReport: {
      type: Object,
      required: true,
    },
  },
  computed: {
    summaryForStrengths() {
      return this.getSummaryForFocusAreaAndInfoType(
        this.progressReport.summary,
        'strength',
        'reason'
      )
    },
    summaryForRecommendations() {
      return this.getSummaryForFocusAreaAndInfoType(
        this.progressReport.summary,
        'practiceArea',
        'recommendation'
      )
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
  },
}
</script>

<style lang="scss" scoped>
.progress-report {
  &__concepts {
    padding-left: 1em;

    &--score {
      padding-left: 2em;
    }

    &-concept {
      margin-top: 1em;

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
}
</style>
