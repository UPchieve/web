<template>
  <router-link v-if="routeTo" tag="button" :to="routeTo" class="ButtonTemplate">
    <div>
      <slot />
    </div>
    <upchieve-icon
      v-if="primary"
      icon="arrow"
      color="inherit"
      class="ButtonTemplate-icon"
    />
  </router-link>

  <button v-else class="ButtonTemplate">
    <div>
      <slot />
    </div>
    <upchieve-icon
      v-if="primary"
      icon="arrow"
      color="inherit"
      class="ButtonTemplate-icon"
    />
  </button>
</template>

<script>
import UpchieveIcon from "@/components/UpchieveIcon";

export default {
  components: { UpchieveIcon },
  props: {
    primary: Boolean,
    routeTo: String
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
</style>
