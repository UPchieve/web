<template>
  <router-link v-if="routeTo" tag="button" :to="routeTo" class="ButtonTemplate">
    <div>
      <slot />
    </div>
    <arrow-icon
      v-if="primary && showArrow"
      class="ButtonTemplate-icon arrow-icon"
    />
  </router-link>

  <button v-else class="ButtonTemplate">
    <span>
      <slot />
    </span>
    <arrow-icon
      v-if="primary && showArrow"
      class="ButtonTemplate-icon arrow-icon"
    />
  </button>
</template>

<script>
import ArrowIcon from "@/assets/arrow.svg";

export default {
  name: "ButtonTemplate",
  components: { ArrowIcon },
  props: {
    primary: Boolean,
    routeTo: String,
    showArrow: Boolean
  }
};
</script>

<style lang="scss" scoped>
.ButtonTemplate {
  @include font-category("button");
  @include flex-container(row, center, center);

  background: none;
  border: none;
  margin: 0;
  padding: 0;
}

.ButtonTemplate-icon {
  margin-top: 2px; // nudge down
  margin-left: 8px; // space between text
}

.arrow-icon {
  fill: currentColor;
  height: 16px;
  width: 16px;
}
</style>
