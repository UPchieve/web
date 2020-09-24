<template>
  <div class="presession-survey">
    <large-button primary @click.native="submitSurvey"
      >Start a chat</large-button
    >
  </div>
</template>

<script>
import LargeButton from "@/components/LargeButton";

export default {
  components: { LargeButton },

  methods: {
    submitSurvey() {
      this.$emit("surveyCompleted");
    }
  }
};
</script>

<style lang="scss" scoped>
.presession-survey {
  height: 100%;
  width: 100%;
  padding: 15px;
}
</style>
