<template>
  <div class="chip">
    <img :src="svg" :alt="altImageText" class="chip-icon" :style="iconStyles" />

    <div class="chip-column">
      <h2 class="chip-title">{{ title }}</h2>
      <p class="chip-subjects" v-if="totalSubjects">
        {{ totalSubjects }} Subjects
      </p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TopicChip',
  props: {
    title: {
      type: String,
      required: true,
    },
    svg: {
      type: [Object, String],
      required: true,
    },
    totalSubjects: Number,
    iconStyles: {
      type: Object,
      default() {
        return {
          height: '50px',
          width: '50px',
        }
      },
    },
  },
  computed: {
    altImageText() {
      return `${this.title} icon`
    },
  },
}
</script>

<style lang="scss" scoped>
.chip {
  @include flex-container(row, flex-start, center);
  border: 1px solid $c-border-grey;
  border-radius: 8px;
  padding: 1em;

  &:hover {
    cursor: pointer;
  }

  &-subjects {
    @include font-category('helper-text');
    margin-bottom: 0;
    color: $c-secondary-grey;
  }

  &-title {
    @include font-category('subheading');
    margin: 0;
    margin-bottom: 0.4em;
    padding: 0;
    text-align: left;
  }

  &-column {
    @include flex-container(column, center, flex-start);
    margin-left: 0.6em;
  }
}
</style>
