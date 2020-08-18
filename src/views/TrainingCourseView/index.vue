<template>
  <div class="course">
    <div v-if="course" class="course__container">
      <div class="course__title">{{ course.name }}</div>
      <div class="course__description">{{ course.description }}</div>
      <div class="course__modules">
        <module
          v-for="module in course.modules"
          :key="module.moduleKey"
          :module="module"
          v-on:material-completed="trackMaterialProgress"
        />
      </div>
    </div>
  </div>
</template>

<script>
import Module from "./Module";
import NetworkService from "@/services/NetworkService";

export default {
  name: "TrainingCourseView",
  components: {
    Module
  },
  data() {
    return {
      course: null
    };
  },
  async created() {
    /**
     * TODO
     * display quiz (when modules all completed)
     * material views
     * new material icons (link + resources)
     */

    const courseKey = this.$route.params.courseKey;
    const {
      body: { course }
    } = await NetworkService.getTrainingCourse(courseKey);
    this.course = course;
    this.trackMaterialProgress();
  },
  methods: {
    trackMaterialProgress(materialKey) {
      // TODO: lodash?
      this.course.modules.forEach(mod => {
        mod.materials.forEach(mat => {
          if (mat.materialKey === materialKey) {
            mat.isCompleted = true;
          }
        });
      });

      NetworkService.recordTrainingCourseProgress(
        this.course.courseKey,
        materialKey
      );
    }
  }
};
</script>

<style lang="scss" scoped>
.course {
  padding: 10px;
  width: 100%;

  @include breakpoint-above("large") {
    padding: 40px;
  }

  &__container {
    background: #fff;
    border-radius: 8px;
    padding: 20px 10px;

    @include breakpoint-above("medium") {
      padding: 20px;
    }

    @include breakpoint-above("large") {
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

    @include breakpoint-above("large") {
      margin: 30px 0 40px;
    }
  }
}
</style>
