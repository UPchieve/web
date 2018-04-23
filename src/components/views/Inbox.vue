<template>
<div class="inbox">
  Le inbox
  <div class="tabular-template">
    <div class="tabular-template__header">
      <h1>{{ headerTitle }}</h1>
    </div>
    <div class="tabular-template__content">
      <div class="content-card">
        <div class="content-card__card">
          <slot></slot>
        </div>
      </div>
    </div>
  </div>
</div>
</template>


<script>
import BasicTemplate from '../organisms/BasicTemplate';
import BtnOptions from '../molecules/BtnOptions';
import Modal from '../molecules/Modal';
import Btn from '../atoms/Btn';

export default {
  components: {
    BasicTemplate,
    BtnOptions,
    Modal,
    Btn
  },
  data() {
    return {
      showModal: false,
      clickHandlersBtnOptions: {
        main: this.submitQuestion,
        second: this.cancel
      },
      message: `
        Thanks for submitting your question! You 
        will receive a response to your email 
        address as soon as possible.
      `,
      btnLabels: ['Go to home page'],
      clickHandlersModal: {
        main: () => {
          this.$router.push('/');
        }
      }
    }
  },
  methods: {

  },
  mounted() {

  }
}
</script>


<style>
/*
* @notes
* [1] Refactoring candidate: this should be in the global container
*/
.inbox { /*[1]*/
  height: 100vh;
  position: relative;
}
</style>