<template>
  <div v-if="user.isVolunteer" class="send-answer">
    <basic-template header-title="Answer question">
      <div class="question">
        <div class="question__content">
          {{ question.content }}
        </div>
        <div class="question__author">
          {{ question.student.name }}
        </div>
        <div v-if="hasAttachments" class="attachment-list">
          <div class="attachment-list__icon" />
          <div class="attachment-list__content" @click="downloadFile()">
            {{ question.attachments[0] }}
          </div>
        </div>
      </div>
      <question-answer-form
        :modal-container="this"
        textarea-label="Write your answer below"
        type-of-form="send-answer"
      />
    </basic-template>
    <modal
      v-if="showModal"
      :warn="modalOptions.warn"
      :message="modalOptions.message"
      :labels="modalBtnLabels"
      :click-handlers="modalClickHandlers"
      single-btn
    />
  </div>
</template>

<script>
import { mapState } from "vuex";

import DownloadService from "@/services/DownloadService";
import StudentQuestionService from "@/services/StudentQuestionService";

import BasicTemplate from "@/components/BasicTemplate";
import QuestionAnswerForm from "@/components/QuestionAnswerForm";
import Modal from "@/components/Modal";

export default {
  components: {
    BasicTemplate,
    QuestionAnswerForm,
    Modal
  },
  data() {
    return {
      // This component
      hasAttachments: false,
      question: { student: { name: "" } },
      // Modal
      showModal: false,
      modalBtnLabels: [],
      modalOptions: {},
      modalClickHandlers: {}
    };
  },
  computed: {
    ...mapState({ user: state => state.user.user })
  },
  beforeCreate() {
    StudentQuestionService.getStudentQuestions(this, {
      _id: this.$route.query.q
    }).then(questions => {
      [this.question] = questions;
      this.hasAttachments = this.question.attachments.length > 0;
    });
  },
  methods: {
    downloadFile() {
      StudentQuestionService.getAttachment(
        this,
        this.question.attachments[0]
      ).then(res => {
        DownloadService.openDownloadDialog(
          res.body,
          this.question.attachments[0],
          res.headers.map["content-type"]
        );
      });
    }
  }
};
</script>

<style lang="scss">
/*
* @notes
* [1] Refactoring candidate: this should be in the global container
*/
.send-answer {
  /*[1]*/
  height: 100vh;
  position: relative;
}

.question {
  margin-bottom: 40px;
  border-bottom: 1px solid $c-shadow-header;
  text-align: center;
}
.question__content {
  font-weight: 600;
  overflow-wrap: break-word;
  word-wrap: break-word;
}
.question__author {
  margin: 20px 0;
  font-style: italic;
}
.question__author::before {
  content: "by";
}

/*
* @notes
* [1] Refactoring candidate: this should be in a separate component
*/
.attachment-list {
  /*[1]*/
  background: $c-bg;
  display: flex;
}
.attachment-list__icon {
  position: relative;
  min-width: 64px;
  background: $c-shadow-header;
}
.attachment-list__icon::before {
  content: " ";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 24px;
  height: 24px;
  background-image: url("~@/assets/attachment_icon.svg");
}
.attachment-list__content {
  padding: 20px;
  text-decoration: underline;
  cursor: pointer;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
