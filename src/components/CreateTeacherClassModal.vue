<template>
  <modal :closeModal="close">
    <h1>Create a New Class</h1>

    <FormInput v-model="className" placeholder="Class Name" />

    <button class="uc-form-button" @click="accept()">Create</button>
  </modal>
</template>

<script>
import FormInput from '@/components/FormInput.vue'
import Modal from '@/components/Modal.vue'

export default {
  components: { FormInput, Modal },
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
    }
  },

  methods: {
    close() {
      this.$store.dispatch('app/modal/hide')
    },

    accept() {
      this.modalData.createTeacherClass(this.className)
      this.$store.dispatch('app/modal/hide')
    },
  },
}
</script>
