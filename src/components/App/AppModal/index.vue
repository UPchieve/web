<template>
  <modal-template
    v-on:cancel="onCancel"
    v-on:accept="onAccept"
    :back-text="modalData.backText"
    :accept-text="modalData.acceptText"
    :alert-modal="modalData.alertModal"
    :enable-accept="enableAccept"
    :important="modalData.important"
  >
    <component
      v-if="modalComponent"
      v-bind:is="modalComponent"
      v-on:enable-accept="onEnableAccept"
      :modal-data="modalData"
      ref="AppModalChild"
    />
  </modal-template>
</template>

<script>
import { mapState } from "vuex";
import ModalTemplate from "./ModalTemplate";
import RejoinSessionModal from "./RejoinSessionModal";
import SubjectSelectionModal from "@/views/DashboardView/StudentDashboard/SubjectSelection/SubjectSelectionModal";
import SessionFulfilledModal from "@/views/SessionView/SessionFulfilledModal";

export default {
  components: { ModalTemplate, RejoinSessionModal, SubjectSelectionModal },
  data() {
    return {
      enableAccept: false
    };
  },
  computed: {
    ...mapState({
      modalComponent: state => state.app.modal.component,
      modalData: state => state.app.modal.data
    })
  },
  mounted() {
    // enable the accept button by default if an alert modal
    this.enableAccept = !!this.modalData.alertModal
  },
  methods: {
    onCancel() {
      const child = this.$refs.AppModalChild;
      if (child.onCancel) child.onCancel();
    },
    onAccept() {
      const child = this.$refs.AppModalChild;
      if (child.onAccept) child.onAccept();
    },
    onEnableAccept(value) {
      this.enableAccept = value;
    }
  }
};
</script>
