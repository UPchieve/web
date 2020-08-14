<template>
  <div class="material">
    <div class="material__name">{{ material.name }}</div>
  </div>
</template>

<script>
export default {
  props: {
    material: Object
  }
};
</script>

<style lang="scss" scoped>
.material {
  color: $c-secondary-grey;
}
</style>
