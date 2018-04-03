<template>
<div class="btn-options">
  <btn btnOptionsSecond :label="secondBtnLabel" :clickHandler="clickHandlers.second"></btn>
  <btn :label="mainBtnLabel" :clickHandler="clickHandlers.main"></btn>
</div>
</template>


<script>
import Btn from '../atoms/Btn';

export default {
  components: {
    Btn
  },
  props: {
    mainBtnLabel: String,
    secondBtnLabel: String,
    clickHandlers: Object
  }
}
</script>


<style>
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