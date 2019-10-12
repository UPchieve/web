<template>
  <div :class="classes">
    {{ label }}
  </div>
</template>

<script>
import { topics } from "@/utils/topics";

export default {
  props: {
    label: {
      type: String,
      default: ""
    }
  },
  data() {
    const classes = Object.entries(topics)
      .map(([key, topicObj]) => ["topic-label--" + key, this.label === topicObj.displayName])
      .reduce((result, [key, value]) => {
        result[key] = value;
        return result;
      }, { "topic-label" : true });
  
    return {
      classes: classes
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
