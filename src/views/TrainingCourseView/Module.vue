<template>
  <div class="module">
    <div class="module__cell" @click="toggleMaterials">
      <check-mark class="module__icon" :checked="isComplete" />
      <div class="module__name">{{ module.name }}</div>
    </div>

    <div class="module__materials" v-if="showMaterials">
      <material
        v-for="material in module.materials"
        :key="material.materialKey"
        :material="material"
      />
    </div>
  </div>
</template>

<script>
import Material from "./Material";
import CheckMark from "@/components/CheckMark";

export default {
  components: {
    Material,
    CheckMark
  },
  props: {
    module: Object,
    isComplete: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      showMaterials: false
    };
  },
  methods: {
    toggleMaterials() {
      this.showMaterials = !this.showMaterials;
    }
  }
};
</script>

<style lang="scss" scoped>
.module {
  color: #000;
}
</style>
