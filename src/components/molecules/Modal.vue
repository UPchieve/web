<template>
  <div :class="classes">
    <div :class="dialogClasses">
      <div class="v-modal-dialog__content">
        {{ message }}
      </div>
      <div class="v-modal-dialog__options">
        <btn rowMember :label="secondBtnLabel" :clickHandler="clickHandlers.second"></btn>
        <btn :label="mainBtnLabel" :clickHandler="clickHandlers.main"></btn>
      </div>
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
        },
        dialogClasses: {
          'v-modal-dialog': true,
          'v-modal-dialog--warn': this.warn
        }
      }
    }
  }
</script>


<style>
  .v-modal {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  .v-modal--warn {
    background: var(--c-backdrop-warn);
  }

  .v-modal-dialog {
    background: #fff;
    width: 80%;
    max-width: 480px;
    padding: 40px;
  }
  .v-modal-dialog__content {
    margin-bottom: 40px;
  }
  .v-modal-dialog__options {
  
  }
  .v-modal-dialog--warn {
    box-shadow: -4px 4px var(--c-shadow-warn);
  }
</style>