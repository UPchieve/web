<template>
  <modal :closeModal="close">
    <h1>Create a New Class</h1>
    <p>
      Fill out the details below to set up your new class and start teaching.
    </p>
    <FormInput
      v-model="className"
      placeholder="Class Name (e.g., Algebra I - Period 3)"
      label="Class Name"
      name="class-name"
      :blurEvent="EVENTS.TEACHER_INPUT_CLASS_NAME"
    />
    <FormSelect
      v-model="selectedTopic"
      placeholder="Select a subject"
      label="Subject"
      name="topic"
      optionTextField="displayName"
      :options="sortedTopics"
    />
    <div class="buttons">
      <button
        type="button"
        class="uc-form-button cancel-button"
        @click="close()"
      >
        Cancel
      </button>
      <button
        type="button"
        class="uc-form-button"
        @click="accept()"
        :disabled="!isFormValid"
      >
        Create Class
      </button>
    </div>
  </modal>
</template>

<script>
// TODO: Merge this component with 'EditTeacherClassModal'.
import { mapState } from 'vuex'
import { EVENTS } from '@/consts'
import FormInput from '@/components/FormInput.vue'
import FormSelect from '@/components/FormInputs/FormSelect.vue'
import Modal from '@/components/Modal.vue'
import AnalyticsService from '@/services/AnalyticsService'

export default {
  components: { FormInput, FormSelect, Modal },
  name: 'CreateTeacherClassModal',

  props: {
    modalData: {
      type: Object,
      required: true,
    },
  },

  data() {
    return {
      className: '',
      selectedTopic: null,
      sortedTopics: [],
      EVENTS,
    }
  },

  computed: {
    isFormValid() {
      return this.selectedTopic && this.className
    },
    ...mapState({
      topics: (state) => state.subjects.topics,
    }),
  },

  async created() {
    this.sortedTopics = [
      ...this.topics,
      { name: 'other', displayName: 'Other' },
    ]
    this.sortedTopics.sort((a, b) => a.dashboardOrder - b.dashboardOrder)
  },

  methods: {
    close() {
      this.$store.dispatch('app/modal/hide')
    },

    accept() {
      AnalyticsService.captureEvent(EVENTS.TEACHER_CREATED_CLASS, {
        className: this.className,
        topicId: this.selectedTopic.id,
        topicName: this.selectedTopic.displayName,
      })
      this.modalData.createTeacherClass({
        className: this.className,
        topicId: this.selectedTopic.id,
      })
      this.$store.dispatch('app/modal/hide')
    },
  },
}
</script>

<style lang="scss" scoped>
h1 {
  font-size: 24px;
  font-weight: 500;
  margin-bottom: 0;
  text-align: start;
}

p {
  color: $c-secondary-grey;
  font-size: 16px;
  margin-bottom: 4px;
  margin-top: 8px;
  text-align: start;
}

.buttons {
  @include flex-container(row, right, flex-end);
  gap: 20px;
  margin-top: 20px;
}

.buttons button {
  width: auto;
  padding: 20px 24px;
}

.cancel-button {
  border: 1px solid #000000;
  background-color: white;
  color: #000;
}
</style>
