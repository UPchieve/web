<template>
  <modal :closeModal="close">
    <div class="uc-row justify-between mb-4">
      <h1>Edit Class</h1>
      <button
        type="button"
        @click="deactivateClass()"
        class="uc-row items-center archive-btn"
      >
        <archive-icon class="archive-icon mr-1" /><span>Archive</span>
      </button>
    </div>
    <FormInput
      v-model="className"
      placeholder="Class Name"
      label="Class Name"
    />
    <FormSelect
      v-model="currentTopic"
      label="Subject"
      name="topic"
      optionTextField="displayName"
      :options="topics"
    />
    <div class="buttons-container">
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
        Save Changes
      </button>
    </div>
  </modal>
</template>

<script>
// TODO: Merge this component with 'CreateTeacherClassModal'.
import { mapState } from 'vuex'
import FormInput from '@/components/FormInput.vue'
import Modal from '@/components/Modal.vue'
import FormSelect from '@/components/FormInputs/FormSelect.vue'
import ArchiveIcon from '@/assets/archive.svg'

export default {
  components: { FormInput, Modal, FormSelect, ArchiveIcon },
  name: 'EditTeacherClassModal',

  props: {
    modalData: {
      type: Object,
      required: true,
    },
  },

  data() {
    return {
      isLoading: false,
      className: this.modalData.classInfo.name,
      currentTopic: {},
    }
  },

  computed: {
    isFormValid() {
      return this.currentTopic && this.className
    },
    ...mapState({
      topics: (state) => state.subjects.topics,
    }),
  },

  created() {
    this.currentTopic = this.topics.filter(
      (topic) => topic.id === this.modalData.classInfo.topicId
    )[0]
  },

  methods: {
    close() {
      this.$store.dispatch('app/modal/hide')
    },

    accept() {
      const topicId = this.currentTopic.id
      const newClassInfo = {
        id: this.modalData.classInfo.id,
        className: this.className,
        topicId: topicId,
      }
      this.modalData.updateTeacherClass({
        classData: newClassInfo,
      })
      this.$store.dispatch('app/modal/hide')
    },

    deactivateClass() {
      const classId = this.modalData.classInfo.id
      this.modalData.deactivateTeacherClass({ id: classId })
      this.$store.dispatch('app/modal/hide')
    },
  },
}
</script>

<style lang="scss" scoped>
h1 {
  font-size: 24px;
  font-weight: 500;
  margin: 0;
}

.archive-btn {
  color: $c-soft-black;
  font-size: 16px;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
}

.archive-icon {
  max-height: 20px;
}

.buttons-container {
  @include flex-container(row, flex-end);
  gap: 20px;
  margin-top: 20px;

  button {
    font-size: 16px;
    font-weight: 500;
    padding: 12px 24px;
    width: fit-content;

    &.cancel-button {
      background-color: #fff;
      border: 1px solid $c-secondary-grey;
      color: $c-soft-black;
    }
  }
}
</style>
