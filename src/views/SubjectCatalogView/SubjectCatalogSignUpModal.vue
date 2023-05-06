<template>
  <div class="text-left">
    <student-form isDashboardFirst />
  </div>
</template>

<script>
import StudentForm from '@/views/SignupView/StudentForm'

export default {
  name: 'SubjectCatalogSignUpModal',
  components: {
    StudentForm,
  },
  props: {
    modalData: { type: Object, required: true },
  },
}
</script>

<style lang="scss">
.text-left {
  text-align: left;
}
</style>
