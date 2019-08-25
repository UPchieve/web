<template>
  <modal-template
    v-on:cancel="onCancel"
    v-on:accept="onAccept"
    :back-text="modalData.backText"
    :accept-text="modalData.acceptText"
  >
    <component
      v-if="modalComponent"
      v-bind:is="modalComponent"
      :modal-data="modalData"
      ref="AppModalChild"
    />
  </modal-template>
</template>

<script>
import { mapState } from "vuex";
import ModalTemplate from "./ModalTemplate";
import SubjectSelectionModal from "@/views/DashboardView/StudentDashboard/SubjectSelection/SubjectSelectionModal";

export default {
  components: { ModalTemplate, SubjectSelectionModal },
  computed: {
    ...mapState({
      modalComponent: state => state.app.modal.component,
      modalData: state => state.app.modal.data
    })
  },
  methods: {
    onCancel() {
      const child = this.$refs.AppModalChild;
      if (child.onCancel) child.onCancel();
    },
    onAccept() {
      const child = this.$refs.AppModalChild;
      if (child.onAccept) child.onAccept();
    }
  }
};
</script>
