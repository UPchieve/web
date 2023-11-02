<template>
  <button
    class="subject-card uc-row justify-center"
    @click="handleClick"
    :disabled="isDisabled"
  >
    <img :src="svg" class="icon" aria-hidden="true" />

    <div class="uc-column justify-center items-start">
      <h2 class="title">{{ title }}</h2>
      <p class="metadata">{{ metadata }}</p>
    </div>
  </button>
</template>

<script>
export default {
  props: {
    title: {
      type: String,
      required: true,
    },
    svg: {
      type: [Object, String],
      required: true,
    },
    topic: String,
    subtopics: Array,
    subtopicDisplayNames: Object,
    isDisabled: Boolean,
  },
  computed: {
    metadata() {
      const numSubtopics = this.subtopics.length
      const pluralization = numSubtopics === 1 ? '' : 's'
      return numSubtopics + ' Subject' + pluralization
    },
  },
  methods: {
    handleClick() {
      this.$store.dispatch('app/modal/show', {
        component: 'SubjectSelectionModal',
        data: {
          acceptText: 'Continue',
          topic: this.topic,
          subtopics: this.subtopics,
          subtopicDisplayNames: this.subtopicDisplayNames,
          svg: this.svg,
          title: this.title,
          subtitle:
            'Choose a subject so we can connect you with the right tutor.',
        },
      })
    },
  },
}
</script>

<style lang="scss" scoped>
.subject-card {
  background: white;
  border: 1px solid #d8dee5;
  border-radius: 8px;
  padding: 16px;

  &:hover,
  &:focus {
    background: #f2fbf9;
    border-color: #16d2aa;
  }

  &[disabled] {
    background: #f1f3f6;
    border-color: #d8dee5;
  }
}

.icon {
  height: 80px;
  margin-right: 16px;
  width: 80px;
}

.title {
  @include font-category('heading');
  font-weight: 600;
  margin: 0;
  padding: 0;
  text-align: start;
}

.metadata {
  @include font-category('helper-text');
  color: #565961;
  text-align: start;
  margin: 0;
}
</style>
