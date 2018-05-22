<template>
<div class="send-answer">
  <basic-template headerTitle="Answer question">
    <div class="question">
      <div class="question__content">
        {{ question.content }}
      </div>
      <div class="question__author">
        {{ question.author }}
      </div>
      <div class="attachment-list">
        <!-- TODO -->
      </div>
    </div>
    <message-form 
      textareaLabel="Write your answer below"
      :clickHandlersBtnOptions="clickHandlersBtnOptions"
    ></message-form>
  </basic-template>
  <modal v-if="showModal" singleBtn
      :labels="btnLabels"
      :message="message"
      :clickHandlers="clickHandlersModal"
  ></modal>
</div>
</template>


<script>
import BasicTemplate from '../organisms/BasicTemplate';
import MessageForm from '../organisms/MessageForm';
import Modal from '../molecules/Modal';

export default {
  components: {
    BasicTemplate,
    MessageForm,
    Modal
  },
  data() {
    return {
      question: {
        content: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Culpa a repellendus, illo nesciunt, sint suscipit veniam provident ad hic. Maxime sapiente esse similique, laudantium voluptas sequi! Nihil, molestiae, accusantium. Optio? ',
        author: 'Some Student'
      },
      showModal: false,
      clickHandlersBtnOptions: {
        main: this.sendAnswer,
        second: this.cancel
      },
      message: `
        The answer was sent.
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
    attachFile() {
      const click = new MouseEvent('click');
      this.$el.querySelector('input[type="file"]').dispatchEvent(click);
    },
    sendAnswer() {
      // this will be the success callback
      this.showModal = true;
      this.$el.style.overflow = 'hidden';
    },
    cancel() {
      this.$router.push('/');
    }
  },
  mounted() {
    console.log(this.$route.query);
  }
}
</script>


<style>
/*
* @notes
* [1] Refactoring candidate: this should be in the global container
*/
.send-answer { /*[1]*/
  height: 100vh;
  position: relative;
}

.question {
  margin-bottom: 40px;
  border-bottom: 1px solid var(--c-shadow-header);
  text-align: center;
}
.question__content {
  font-weight: 600;
}
.question__author {
  margin: 20px 0;
  font-style: italic;
}
.question__author::before {
  content: 'by'
}
</style>