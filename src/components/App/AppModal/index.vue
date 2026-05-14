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
    :showTemplateButtons="modalData.showTemplateButtons"
    :showSeparator="modalData.showSeparator"
    :show-accept="modalData.showAccept"
    :modalComponentName="modalComponent && modalComponent.name"
  >
    <component
      v-if="modalComponent"
      v-bind:is="modalComponent"
      v-on:enable-accept="onEnableAccept"
      :modal-data="modalData"
      v-bind="modalComponentProps"
      ref="AppModalChild"
    />
  </modal-template>
</template>

<script>
import { mapState } from 'vuex'
import ModalTemplate from './ModalTemplate.vue'
import RejoinSessionModal from './RejoinSessionModal.vue'
import ConfirmModal from './ConfirmModal.vue'
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
import RemoveTeamMemberModal from '@/components/NTHS/RemoveTeamMemberModal.vue'
import RemoveMemberConfirmation from '@/views/NTHS/RemoveMemberConfirmation.vue'

export default {
  components: {
    ModalTemplate,
    RejoinSessionModal,
    ConfirmModal,
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
    RemoveTeamMemberModal,
    RemoveMemberConfirmation,
  },
  data() {
    return {
      enableAccept: false,
    }
  },
  computed: {
    ...mapState({
      modalComponent: (state) => state.app.modal.component,
      modalData: (state) => state.app.modal.modalTemplateProps,
      modalComponentProps: (state) => state.app.modal.componentProps,
    }),
  },
  mounted() {
    // Enable the accept button by default if this is
    // an alert modal or we have explicitly set to enable the button.
    this.enableAccept =
      this.modalData.enableAccept || !!this.modalData.alertModal
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
  },
}
</script>
