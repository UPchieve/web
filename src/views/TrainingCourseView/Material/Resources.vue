<template>
  <div class="resources">
    <link-material
      v-for="link in links"
      :key="link.url"
      :linkUrl="link.url"
      :label="link.displayName"
    />
  </div>
</template>

<script>
import LinkMaterial from "./Link";

export default {
  components: {
    LinkMaterial
  },
  props: {
    links: Array
  }
};
</script>

<style lang="scss" scoped>
.resources {
  .link {
    &:not(:last-of-type) {
      margin-bottom: 12px;
    }
  }
}
</style>
