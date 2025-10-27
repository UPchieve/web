<template>
  <!-- To simplify, we could just bring the ModalTemplate into this component. -->
  <modal-template
    v-on:cancel="onCancel"
    v-on:accept="onAccept"
    :back-text="modalData.backText"
    :accept-text="modalData.acceptText"
    :accept-button-variant="modalData.acceptButtonVariant"
    :alert-modal="modalData.alertModal"
    :enable-accept="enableAccept"
    :important="modalData.important"
    :showTemplateButtons="showTemplateButtons"
    :show-accept="modalData.showAccept"
    :modalComponentName="modalComponent && modalComponent.name"
  >
    <component
      v-if="modalComponent"
      v-bind:is="modalComponent"
      v-on:enable-accept="onEnableAccept"
      v-on:show-template-buttons="onShowTemplateButtons"
      :modal-data="modalData"
      ref="AppModalChild"
    />
  </modal-template>
</template>

<script>
import { mapState } from 'vuex'
import ModalTemplate from './ModalTemplate.vue'
import RejoinSessionModal from './RejoinSessionModal.vue'
import UpgradeAppModal from './UpgradeAppModal.vue'
import SubjectSelectionModal from '@/views/DashboardView/StudentDashboard/SubjectSelection/SubjectSelectionModal.vue'
import NotificationsModal from '@/views/DashboardView/StudentDashboard/SubjectSelection/NotificationsModal.vue'
import ReferralModal from '@/views/DashboardView/ReferralModal.vue'
import VolunteerOnboardingModal from '@/views/DashboardView/VolunteerDashboard/VolunteerOnboardingModal.vue'
import ReportSessionModal from '@/views/SessionView/ReportSessionModal.vue'
import CreateTeacherClassModal from '@/components/CreateTeacherClassModal.vue'
import TeacherClassCodeModal from '@/components/TeacherClassCodeModal.vue'
import CreateAndEditAssignmentModal from '@/components/CreateAndEditAssignmentModal.vue'
import StudentCompletionModal from '@/components/StudentCompletionModal.vue'
import EditTeacherClassModal from '@/components/EditTeacherClassModal.vue'
import RemoveAssignmentConfirmationModal from '@/components/RemoveAssignmentConfirmationModal.vue'
import BecomeAVolunteerModal from '@/views/BecomeAVolunteerModal.vue'
import VerificationAppModal from './VerificationAppModal.vue'
import DeleteAccountConfirmationModal from '@/components/DeleteAccountConfirmationModal.vue'

export default {
  components: {
    ModalTemplate,
    RejoinSessionModal,
    SubjectSelectionModal,
    NotificationsModal,
    ReferralModal,
    VolunteerOnboardingModal,
    UpgradeAppModal,
    ReportSessionModal,
    CreateTeacherClassModal,
    TeacherClassCodeModal,
    CreateAndEditAssignmentModal,
    StudentCompletionModal,
    EditTeacherClassModal,
    RemoveAssignmentConfirmationModal,
    BecomeAVolunteerModal,
    VerificationAppModal,
    DeleteAccountConfirmationModal,
  },
  data() {
    return {
      enableAccept: false,
      showTemplateButtons: true,
    }
  },
  computed: {
    ...mapState({
      modalComponent: (state) => state.app.modal.component,
      modalData: (state) => state.app.modal.data,
    }),
  },
  mounted() {
    // Enable the accept button by default if this is
    // an alert modal.
    this.enableAccept = !!this.modalData.alertModal
    this.showTemplateButtons = this.modalData.showTemplateButtons ?? true
  },
  methods: {
    onCancel() {
      const child = this.$refs.AppModalChild
      if (child.onCancel) child.onCancel()
    },
    onAccept() {
      const child = this.$refs.AppModalChild
      if (child.onAccept) child.onAccept()
    },
    onEnableAccept(value) {
      this.enableAccept = value
    },
    onShowTemplateButtons(value) {
      this.showTemplateButtons = value
    },
  },
}
</script>
