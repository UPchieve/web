<template>
<div class="message-form">
  <form class="question-form">
    <div class="form-body">
      <label for="">{{ textareaLabel }}</label>      
      <textarea name="" id=""></textarea>
      <label for="">(Optional) Attach a file</label>
      <input type="file">
      <btn big label="Upload a file" :clickHandler="attachFile"></btn>
    </div>
    <btn-options 
      mainBtnLabel="Submit" 
      secondBtnLabel="Cancel" 
      :clickHandlers="clickHandlersBtnOptions"
    ></btn-options>
  </form>
</div>
</template>


<script>
import BtnOptions from '../molecules/BtnOptions';
import Btn from '../atoms/Btn';

export default {
  components: {
    BtnOptions,
    Btn
  },
  props: {
    clickHandlersBtnOptions: Object,
    textareaLabel: String
  },
  data() {
    return {

    }
  },
  methods: {
    attachFile() {
      const click = new MouseEvent('click');
      this.$el.querySelector('input[type="file"]').dispatchEvent(click);
    }
  }
}
</script>


<style>
.form-body {
  margin-bottom: 80px;
  text-align: left;
}
.form-body label {
  width: 100%;
  font-weight: 500;
}
.form-body textarea {
  width: 100%;
  height: 200px;
  resize: none;
  border: 2px solid var(--c-accent);
  margin-bottom: 20px;
  padding: 4px 8px;
}
.form-body textarea:focus {
  outline: 0;
}
.form-body input[type="file"] {
  display: none;
}
</style>