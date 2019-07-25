<template>
  <button :class="classes" @click="clickHandler">
    {{ label }}
  </button>
</template>

<script>
export default {
  props: {
    label: {
      type: String,
      default: ""
    },
    btnOptionsSecond: {
      type: Boolean,
      default: false
    },
    big: {
      type: Boolean,
      default: false
    },
    clickHandler: {
      type: Function,
      required: true
    }
  },
  data() {
    return {
      classes: {
        "v-btn": true,
        "v-btn--btn-options-second": this.btnOptionsSecond,
        "v-btn--big": this.big
      }
    };
  }
};
</script>

<style lang="scss">
/**
 * @todo {1} Refactoring candidate: the v- prefix was added to avoid colliding
 *           with Bootstrap
 */
.v-btn {
  /*{1}*/
  background: $c-bg;
  color: $c-accent;
  text-align: center;
  text-transform: uppercase;
  font-weight: 600;
  border: 0;
  height: 40px;
  border-radius: 20px;
  padding: 0 20px;
  line-height: 1;
  min-width: 128px;
}
.v-btn:hover {
  /*{1}*/
  color: #fff;
  background: $c-accent;
}
.v-btn:focus {
  /*{1}*/
  outline: 0;
}
.v-btn--big {
  /*{1}*/
  width: 100%;
  max-width: 512px;
}
.v-btn--btn-options-second {
  /*{1}*/
  margin-top: 16px;
}

@media screen and (min-width: 700px) {
  .v-btn--btn-options-second {
    margin-top: 0;
    margin-right: 20px;
  }
}
</style>
