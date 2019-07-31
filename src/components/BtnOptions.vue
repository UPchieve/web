<template>
  <div class="btn-options">
    <btn
      :label="secondBtnLabel"
      :click-handler="clickHandlers.second"
      btn-options-second
    />
    <btn :label="mainBtnLabel" :click-handler="clickHandlers.main" />
  </div>
</template>

<script>
import Btn from "./Btn";

export default {
  components: {
    Btn
  },
  props: {
    mainBtnLabel: {
      type: String,
      default: ""
    },
    secondBtnLabel: {
      type: String,
      default: ""
    },
    clickHandlers: {
      type: Object,
      required: true
    }
  }
};
</script>

<style lang="scss" scoped>
.btn-options {
  display: flex;
  flex-direction: column-reverse;
  flex-wrap: wrap;
  align-items: center;
}

@media screen and (min-width: 700px) {
  .btn-options {
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: space-between;
  }
}
</style>
