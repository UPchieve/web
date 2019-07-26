<template>
  <div :class="classes">
    {{ label }}
  </div>
</template>

<script>
export default {
  props: {
    label: {
      type: String,
      default: ""
    }
  },
  data() {
    return {
      classes: {
        "topic-label": true,
        "topic-label--math": this.label.toLowerCase() === "math",
        "topic-label--college": this.label.toLowerCase() === "college"
      }
    };
  }
};
</script>

<style lang="scss">
.topic-label {
  color: #fff;
  text-transform: uppercase;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 12px;
  border-radius: 12px;
}
.topic-label--math {
  background: $c-math;
}
.topic-label--college {
  background: $c-college;
}
</style>
