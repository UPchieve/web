<template>
  <div>
    <header class="actions-header">
      <div class="page-control__button" @click="closeReferenceView">
        <span>← Back</span>
      </div>
      <select
        name="reference-form"
        @change="updateReferenceStatus"
        :value="referenceStatusText"
      >
        <option selected disabled value="SUBMITTED">Review required...</option>
        <option value="REJECTED">Reject</option>
        <option value="APPROVED">Approve</option>
      </select>
    </header>
    <reference-form :reference="reference" :isAdminReview="true" />
  </div>
</template>

<script>
import { mapState, mapGetters } from "vuex";
import ReferenceForm from "@/components/ReferenceForm";

export default {
  name: "AdminReferenceView",
  props: {
    reference: { type: Object, required: true },
    closeReferenceView: { type: Function, required: true },
    updateReferenceStatus: { type: Function, required: true },
    referenceStatusText: { type: String, required: true }
  },
  components: { ReferenceForm },
  data() {
    return {
      hideReferenceForm: false
    };
  },
  created() {
    this.referenceValue = this.referenceStatusText;
  },
  computed: {
    ...mapState({
      user: state => state.user.user
    }),
    ...mapGetters({
      mobileMode: "app/mobileMode"
    })
  },
  methods: {
    testing() {
      this.hideReferenceForm = true;
    }
  }
};
</script>

<style lang="scss" scoped>
.page-control__button {
  display: inline-flex;
  align-items: center;
  color: #417db1;
  border-radius: 20px;
  padding: 5px 15px;
  cursor: pointer;
  &:hover {
    background: #f7fcfe;
  }
}

.actions-header {
  @include flex-container(row, space-between);
  padding: 1em;

  @include breakpoint-above("medium") {
    padding: 4em 4em 1em;
  }
}

.questions-container {
  padding: 1em;
  width: 100%;
  width: 100vw;
  @include breakpoint-above("medium") {
    width: 100%;
    padding: 4em;
  }
}
</style>
