<template>
  <div :class="classes">
    <div class="v-modal__content">
      {{ message }}
    </div>
    <div class="v-modal__options">
      <btn rowMember :label="secondBtnLabel" :clickHandler="clickHandlers.second"></btn>
      <btn :label="mainBtnLabel" :clickHandler="clickHandlers.main"></btn>
    </div>
  </div>  
</template>


<script>
  import Btn from '../atoms/Btn';

  export default {
    components: {
      Btn
    },
    props: {
      message: String,
      warn: Boolean,
      labels: Array[String],
      clickHandlers: Object
    },
    data() {
      return {
        mainBtnLabel: this.labels[1],
        secondBtnLabel: this.labels[0],
        classes: {
          'v-modal': true,
          'v-modal--warn': this.warn
        }
      }
    }
  }
</script>


<style>
  .v-modal {
    background: #fff;
    width: 80%;
    max-width: 480px;
    padding: 40px;
  }
  .v-modal__content {
    margin-bottom: 40px;
  }
  .v-modal__options {
  
  }
  .v-modal--warn {
    box-shadow: -4px 4px var(--c-shadow-warn);
  }
</style>