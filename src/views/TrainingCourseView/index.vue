<template>
  <div class="course">
    <div class="course__container">
      <div class="course__title">{{ course.name }}</div>
      <div class="course__description">{{ course.description }}</div>
      <div class="course__modules">
        <module
          v-for="module in course.modules"
          :key="module.moduleKey"
          :module="module"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { find } from "lodash";
import Module from "./Module";

const courses = [
  {
    name: "UPchieve 101",
    courseKey: "upchieve101",
    description:
      "UPchieve101 is a required training in order to be an Academic Coach. Please complete each Module before completeing the quiz at the bottom.",
    modules: [
      {
        name: "Module 1",
        moduleKey: "module1",
        materials: [
          {
            name: "Intro Video",
            materialKey: "material1",
            type: "video",
            videoUrl: "https://www.youtube.com/watch?v=VjZzfgqno2A"
          },
          {
            name: "Coach Guide",
            materialKey: "material2",
            type: "document",
            documentUrl:
              "https://app.upchieve.org/cc4c54987cdaeac2653be81033aa95ff.pdf"
          },
          {
            name: "How to complete a session on UPchieve",
            materialKey: "material3",
            type: "document",
            documentUrl:
              "https://app.upchieve.org/cc4c54987cdaeac2653be81033aa95ff.pdf"
          },
          {
            name: "About our students",
            materialKey: "material4",
            type: "slideshow",
            slideshowUrl:
              "https://app.upchieve.org/cc4c54987cdaeac2653be81033aa95ff.pdf"
          }
        ]
      },
      {
        name: "Module 2",
        moduleKey: "module2",
        materials: [
          {
            name: "Intro Video",
            materialKey: "material1",
            type: "video",
            videoUrl: "https://www.youtube.com/watch?v=VjZzfgqno2A"
          },
          {
            name: "Coach Guide",
            materialKey: "material2",
            type: "document",
            documentUrl:
              "https://app.upchieve.org/cc4c54987cdaeac2653be81033aa95ff.pdf"
          },
          {
            name: "How to complete a session on UPchieve",
            materialKey: "material3",
            type: "document",
            documentUrl:
              "https://app.upchieve.org/cc4c54987cdaeac2653be81033aa95ff.pdf"
          },
          {
            name: "About our students",
            materialKey: "material4",
            type: "slideshow",
            slideshowUrl:
              "https://app.upchieve.org/cc4c54987cdaeac2653be81033aa95ff.pdf"
          }
        ]
      }
    ]
  }
];

export default {
  name: "TrainingCourseView",
  components: {
    Module
  },
  data() {
    const courseKey = this.$route.params.courseKey;
    const course = find(courses, { courseKey });
    if (!course) this.$router.push("/training");

    return {
      course
    };
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

    @include breakpoint-above("large") {
      padding: 40px 30px;
    }
  }

  &__title {
    font-size: 24px;
    font-weight: 500;
  }

  &__description {
    text-align: left;
    font-size: 16px;
    color: $c-secondary-grey;
    margin: 20px 0 0;
  }
}
</style>
