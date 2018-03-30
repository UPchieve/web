<template>
<div class="submit-question">
  <basic-template headerTitle="Submit a question">
    <form class="question-form">
      <div class="form-body">
        <label for="">What is your question?</label>      
        <textarea name="" id="" cols="30" rows="10"></textarea>
        <label for="">(Optional) Attach a file</label>
        <btn big label="Upload a file" :clickHandler="attachFile"></btn>
      </div>
      <div class="form-options">
        <btn rowMember label="Cancel" :clickHandler="cancel"></btn>
        <btn label="Submit" :clickHandler="submitQuestion"></btn>
      </div>
    </form>
  </basic-template>
</div>
</template>


<script>
import BasicTemplate from '../organisms/BasicTemplate';
import Btn from '../atoms/Btn';

export default {
  components: {
    BasicTemplate,
    Btn
  },
  data() {
    return {
    }
  },
  methods: {
    attachFile() {

    },
    submitQuestion() {

    },
    cancel() {
      this.$router.push('/');
    }
  },
  mounted() {

  }
}
</script>


<style>
.submit-question {
  height: 100vh;
}

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
</style>