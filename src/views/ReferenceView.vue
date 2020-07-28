<template>
  <div class="reference-form-container">
    <div class="reference-form">
      <img class="header-img" src="@/assets/reference-form-header.png" />
      <reference-form />
    </div>
  </div>
</template>

<script>
import ReferenceForm from "@/components/ReferenceForm";

export default {
  name: "ReferenceView",
  components: { ReferenceForm },
  mounted() {
    this.$store.dispatch("app/sidebar/hide");
    this.$store.dispatch("app/header/hide");
  }
};
</script>

<style lang="scss" scoped>
.header-img {
  border-top-right-radius: inherit;
  border-top-left-radius: inherit;
  width: 100%;
}

.reference-form-container {
  background-color: #e5f2fc;
  text-align: left;
  padding: 2em 0;
  min-height: 100%;
}

.reference-form {
  max-width: 100vw;
  margin: 0 auto;
  background-color: white;
  border-radius: 5px;

  @include breakpoint-above("medium") {
    max-width: 900px;
    box-shadow: -9px 9px $c-information-blue;
  }
}
</style>
