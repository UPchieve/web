<template>
  <div :class="classes">
    <div :class="dialogClasses">
      <div class="v-modal-dialog__content">
        {{ message }}
      </div>
      <btn
        v-if="singleBtn"
        :label="mainBtnLabel"
        :click-handler="clickHandlers.main"/>
      <btn-options
        v-else
        :main-btn-label="mainBtnLabel"
        :second-btn-label="secondBtnLabel"
        :click-handlers="clickHandlers"
      />
    </div>
  </div>
</template>


<script>
import BtnOptions from './BtnOptions';
import Btn from '../atoms/Btn';

export default {
  components: {
    BtnOptions,
    Btn,
  },
  props: {
    singleBtn: Boolean,
    message: String,
    warn: Boolean,
    labels: Array[String],
    clickHandlers: Object,
  },
  data() {
    return {
      mainBtnLabel: this.labels[0],
      secondBtnLabel: this.labels[1] ? this.labels[1] : null,
      classes: {
        'v-modal': true,
        'v-modal--warn': this.warn,
      },
      dialogClasses: {
        'v-modal-dialog': true,
        'v-modal-dialog--warn': this.warn,
      },
    };
  },
};
</script>


<style>
.v-modal {
  position: fixed;
  top: 0;
  left: 300px;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  background: var(--c-backdrop);
}
.v-modal--warn {
  background: var(--c-backdrop-warn);
}

.v-modal-dialog {
  background: #fff;
  width: 80%;
  max-width: 480px;
  padding: 40px;
  box-shadow: -4px 4px var(--c-shadow);
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
