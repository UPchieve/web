<template>
  <modal :closeModal="close">
    <div class="modal-container">
      <h1>Create a New Class</h1>
      <p>Fill out the details below to set up your new class.</p>
      <FormInput
        v-model="className"
        placeholder="Class Name"
        :blurEvent="EVENTS.TEACHER_INPUT_CLASS_NAME"
      />
      <FormSelect
        :name="'topic'"
        :placeholder="'Choose a subject'"
        :optionTextField="'displayName'"
        :reduce="(option) => option.id"
        :getSelectOptions="() => topics"
        v-model="topicId"
        required="false"
        :blur-event="EVENTS.TEACHER_SELECTED_CLASS_TOPIC"
      />
      <div class="buttons">
        <button class="uc-form-button cancel-button" @click="close()">
          Cancel
        </button>
        <button
          class="uc-form-button"
          @click="accept()"
          :disabled="!isFormValid"
        >
          Create Class
        </button>
      </div>
    </div>
  </modal>
</template>

<script>
import FormInput from '@/components/FormInput.vue'
import Modal from '@/components/Modal.vue'
import NetworkService from '@/services/NetworkService'
import AnalyticsService from '@/services/AnalyticsService'
import FormSelect from '@/components/FormSelect.vue'
import { EVENTS } from '@/consts'

export default {
  components: { FormInput, Modal, FormSelect },
  name: 'CreateTeacherClassModal',

  props: {
    modalData: {
      type: Object,
      required: true,
    },
  },

  data() {
    return {
      isLoading: false,
      className: '',
      topicId: null,
      topics: [],
      EVENTS,
    }
  },

  computed: {
    isFormValid() {
      return this.topicId && this.className
    },
  },

  async created() {
    this.topics = this.modalData.topics
  },

  methods: {
    reduceOption(option) {
      return option
    },

    close() {
      this.$store.dispatch('app/modal/hide')
    },

    async getTopics() {
      const {
        data: { topics },
      } = await NetworkService.getTopics()
      return topics
    },

    accept() {
      const topic = this.topics.find((topic) => topic.id === this.topicId)
      AnalyticsService.captureEvent(EVENTS.TEACHER_CREATED_CLASS, {
        className: this.className,
        topicId: this.topicId,
        topicName: topic.displayName,
      })
      this.modalData.createTeacherClass({
        className: this.className,
        topicId: this.topicId,
      })
      this.$store.dispatch('app/modal/hide')
    },
  },
}
</script>

<style lang="scss" scoped>
.buttons {
  @include flex-container(row, right);
  gap: 20px;
  margin-top: 20px;
}

.buttons button {
  width: auto;
  padding: 20px;
}

.cancel-button {
  border: 1px solid #000000;
  background-color: white;
  color: #000;
}

.modal-container {
  text-align: left;
}

.modal-container h1 {
  font-size: 24px;
}

.modal-container p {
  color: #77778b;
}
</style>
