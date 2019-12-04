<template>
  <modal-template
    v-on:cancel="onCancel"
    v-on:accept="onAccept"
    :back-text="modalData.backText"
    :accept-text="modalData.acceptText"
    :cancel-text="modalData.cancelText"
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
  components: {
    ModalTemplate,
    RejoinSessionModal,
    SubjectSelectionModal,
    SessionFulfilledModal
  },
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
    // enable the accept button by default if an alert modal or if specified
    this.enableAccept = !!this.modalData.alertModal || !!this.modalData.enableAcceptByDefault;
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
