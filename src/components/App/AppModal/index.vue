<template>
  <modal-template
    v-on:cancel="onCancel"
    v-on:accept="onAccept"
    :back-text="modalData.backText"
    :accept-text="modalData.acceptText"
  >
    <component v-if="modalType" v-bind:is="modalType" :modal-data="modalData" ref="AppModalChild" />
  </modal-template>
</template>

<script>
import ModalTemplate from "./ModalTemplate";
import SubjectSelectionModal from "@/views/DashboardView/StudentDashboard/SubjectSelection/SubjectSelectionModal";
import { mapState } from "vuex";

export default {
  components: { ModalTemplate, SubjectSelectionModal },
  computed: {
    ...mapState({
      modalType: state => state.app.modalType,
      modalData: state => state.app.modalData
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
