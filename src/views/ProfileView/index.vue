<template>
  <div class="profile">
    <IonToast
      :isOpen="errorMessage.length"
      :message="errorMessage"
      header="Uh Oh!"
      icon="alert-circle-outline"
      duration="5000"
      position="bottom"
      @didDismiss="resetErrorMessage"
      color="danger"
    />
    <VerificationModal
      v-if="showSmsVerificationModal"
      data-testid="sms-verification-modal"
      :phoneOrEmailToVerify="phoneInputInfo.e164"
      :verificationMethod="VERIFICATION_METHOD.SMS"
      :closeModal="toggleShowSmsVerificationModal"
      :onCloseSuccess="updateVerifiedPhoneInfo"
    />
    <SecondaryEmailModal
      v-if="showSecondaryEmailModal"
      @dismissed="() => toggleSecondaryEmailModal(false)"
      @completed="updateSecondaryEmail"
    />
    <deactivate-account-modal
      v-if="showDeactivateAccountModal"
      :closeModal="toggleDeactivatedAccountModal"
      :setIsAccountActive="setIsAccountActive"
    />
    <div class="header">Your Profile</div>
    <div class="wrap-container">
      <div class="personal-info contain">
        <div v-if="errors.length" class="errors">
          <h4 class="errors-heading">
            Please correct the following problem
            <span v-if="errors.length > 1">s</span>
            before saving:
          </h4>
          <ul class="errors-list">
            <li v-for="error in errors" v-bind:key="error">{{ error }}</li>
          </ul>
        </div>
        <div v-if="saveFailed" class="errors">
          <h4 class="errors-heading">Could not save data</h4>
        </div>
        <div class="subheader">Personal Information</div>
        <div class="container-content">
          <div
            v-if="showSection(ProfileSections.EMAIL)"
            id="email"
            class="container-section"
          >
            <div class="prompt">Your Email</div>
            <div id="ph-no-capture" class="answer">{{ user.email }}</div>
          </div>

          <div
            v-if="
              showSection(ProfileSections.SECONDARY_EMAIL) &&
              isSecondaryEmailOnProfilePageEnabled
            "
            id="secondary-email"
            class="container-section"
          >
            <div class="prompt">Secondary Email</div>
            <div v-if="user.proxyEmail" id="ph-no-capture" class="answer">
              {{ user.proxyEmail }}
            </div>
            <div
              v-else
              class="alert alert-warning w-full inline-block"
              id="secondary-email-profile-cta"
            >
              Add a secondary email to make sure you don't lose access to your
              account if something happens to your primary email.<br />
              <span
                @click="() => toggleSecondaryEmailModal(true)"
                class="secondary-btn uc-link bold"
              >
                Add email
              </span>
            </div>
          </div>

          <div
            v-if="showSection(ProfileSections.PHONE_INFORMATION)"
            id="phone"
            class="container-section"
          >
            <hr />
            <div id="phone-heading">
              <div class="prompt">Your Phone Information</div>
              <div class="phone-crud-buttons">
                <div class="edit-phone-information-button">
                  <button
                    type="button"
                    class="field-button"
                    data-testid="edit-profile-btn"
                    @click="editPhoneInformation()"
                  >
                    <PencilIcon class="delete-phone-icon" />
                    {{ editPhoneInformationButtonLabel }}
                  </button>
                </div>
                <div class="edit-phone-information-button">
                  <button
                    v-if="user.phone && !hasVolunteerRole"
                    type="button"
                    class="field-button"
                    value="Remove"
                    @click="toggleDeletePhoneConfirmationModal"
                    data-testid="delete-phone-button"
                    id="delete-phone-button"
                    label="Remove"
                  >
                    <TrashIcon class="delete-phone-icon" />
                    Remove
                  </button>
                </div>
              </div>
            </div>
            <RemovePhoneConfirmationModal
              v-if="showDeletePhoneConfirmationModal"
              :onCancel="toggleDeletePhoneConfirmationModal"
              :onAccept="handleDeleteNumber"
            />
            <div
              id="ph-no-capture"
              v-show="!activeEdit && user.phone"
              class="answer phone-answer"
            >
              {{ phoneInputInfo.e164 }}

              <!-- Unverified phone number: Show alert with CTA to verify phone number -->
              <div
                v-if="!user.phoneVerified"
                class="alert alert-warning unverified w-full"
              >
                Your phone number has not been verified.<br />
                <span
                  class="uc-link secondary-btn bold"
                  @click.prevent="toggleShowSmsVerificationModal"
                  >Verify now
                </span>
              </div>
            </div>

            <div v-show="!activeEdit && !user.phone" class="answer">
              No phone number provided
            </div>
            <maz-phone-number-input
              class="phone-input"
              required="true"
              v-show="activeEdit"
              v-model="phone"
              show-code-on-list
              @update="onPhoneInputUpdate"
              :country-code="showNationalPhoneNumbersOnly ? 'US' : null"
              :only-countries="showNationalPhoneNumbersOnly ? ['US'] : null"
              :no-search="showNationalPhoneNumbersOnly ? true : false"
            />

            <div class="sms-consent" v-if="shouldSeeSmsConsentCheckbox">
              <div class="checkbox-container">
                <checkbox
                  id="sms-consent-checkbox"
                  v-model="smsConsent"
                  @change="onChangeSmsConsent"
                  :checked="smsConsent"
                />
                <label for="sms-consent-input"
                  >By checking this box, I consent to receiving SMS messages
                  from UPchieve at the phone number provided above.</label
                >
              </div>
              <div class="description" v-if="hasVolunteerRole">
                <span v-if="smsConsent">
                  <strong class="sms-consent-true"
                    >We will text you when a student needs your help.</strong
                  >
                  You will only be notified during the periods that you select
                  in your schedule.
                </span>
                <span v-else>
                  <span class="sms-consent-false"
                    >You will not receive text messages when a student needs
                    your help</span
                  >
                  unless you check the above checkbox.
                </span>
              </div>
            </div>
          </div>

          <div
            v-if="showSection(ProfileSections.OCCUPATION)"
            class="container-section"
            data-testid="occupation-field"
          >
            <hr />
            <EditOccupation
              @success="() => (errorMessage = '')"
              @error="
                () =>
                  (errorMessage =
                    'Something went wrong while updating your background information')
              "
            />
          </div>

          <div
            v-if="showSection(ProfileSections.GRADE_LEVEL)"
            class="container-section"
            data-testid="grade-level-select"
          >
            <hr />
            <div class="prompt">
              Confirm your grade level for the
              {{ getAcademicYear().asString }} academic year
            </div>
            <div class="description">
              This helps us tailor your UPchieve experience to you.
            </div>
            <GradeLevelSelect
              v-model="selectedGradeLevel"
              :modelValue="selectedGradeLevel"
              @update:modelValue="saveGradeLevel"
              :placeholder="
                user.gradeLevel ? user.gradeLevel + ' grade' : 'Grade level'
              "
            />
          </div>

          <div
            v-if="showSection(ProfileSections.ACCOUNT_STATUS)"
            class="container-section"
          >
            <hr />
            <div class="prompt">Account status</div>
            <div class="answer">
              <toggle-button
                :value="isAccountActive"
                :labels="{ checked: 'Active', unchecked: 'Deactivated' }"
                :width="95"
                :color="{
                  checked: '#16D2AA',
                  unchecked: '#F44747',
                  disabled: '#AAAAAA',
                }"
                @change="toggleAccountActive"
                :sync="true"
                data-testid="deactivate-account-toggle"
              />
            </div>
            <div class="description">
              Deactivate your account to stop receiving emails and text
              notifications. You can reactivate it at any time.
            </div>
          </div>

          <div
            v-if="showSection(ProfileSections.BROWSER_NOTIFICATIONS)"
            class="container-section"
          >
            <hr />
            <div class="prompt">Browser Notifications</div>
            <template v-if="isNotificationPermissionGranted">
              <div class="answer">
                <toggle-button
                  :value="isAllowingNotifications"
                  :labels="{ checked: 'On', unchecked: 'Off' }"
                  :width="95"
                  :color="{
                    checked: '#16D2AA',
                    unchecked: '#F44747',
                    disabled: '#AAAAAA',
                  }"
                  @change="toggleWebNotifications"
                  :sync="true"
                />
              </div>
              <div v-if="isVolunteer" class="description">
                Browser alerts when a student appears on the dashboard waitlist
                and when a student sends a message while you're not looking.
              </div>
              <div v-else-if="isStudent" class="description">
                Browser alerts when a coach joins your session and when a coach
                sends a message while you're not looking.
              </div>
            </template>
            <div v-else class="description">
              Browser notifications are currently blocked. To receive
              notifications, please update your browser settings to allow
              notifications for this site.
            </div>
          </div>

          <div
            v-if="
              showSection(ProfileSections.CLEVER_SYNC) &&
              (user.usesClever || isPartnerTeacher)
            "
            class="container-section"
          >
            <hr />
            <button type="button" class="sync-clever-btn" @click="syncClever">
              <clever-logo class="mr-2" />
              {{ user.lastSuccessfulCleverSync ? 'Resync' : 'Sync' }} Clever
            </button>
            <div class="last-clever-sync" v-if="user.lastSuccessfulCleverSync">
              Last successful Clever sync:
              {{ new Date(user.lastSuccessfulCleverSync).toLocaleString() }}
            </div>
          </div>

          <div
            v-if="showSection(ProfileSections.PREFERRED_LANGUAGE)"
            class="container-section"
          >
            <hr />
            <div class="prompt">Select your preferred language</div>
            <preferred-language-select
              ref="preferredLanguageSelectRef"
              :userPreferredLanguage="user.preferredLanguage"
              @error="onPreferredLanguageError"
            />
          </div>

          <div
            v-if="showSection(ProfileSections.TUTORING_LANGUAGES)"
            class="container-section"
          >
            <hr />
            <div class="prompt">
              Are there any other languages (besides English) that you would
              feel comfortable tutoring a student in?
            </div>
            <TutoringLanguagesChecklist
              @error="
                () => {
                  errorMessage =
                    'Something went wrong while updating your tutoring languages'
                }
              "
              @success="
                () => {
                  errorMessage = ''
                }
              "
            />
          </div>

          <div
            v-if="showSection(ProfileSections.TUTORING_EXPERIENCE)"
            class="container-section"
          >
            <hr />
            <div class="prompt">
              How much prior experience do you have with the following
              activities?
            </div>
            <TutoringExperienceQuestion
              @success="() => (errorMessage = '')"
              @error="
                () =>
                  (errorMessage =
                    'Something went wrong while updating your experience information')
              "
            />
          </div>

          <div
            v-if="showSection(ProfileSections.RESET_PASSWORD)"
            class="container-section"
          >
            <hr />

            <large-button
              class="button-width"
              variant="outlined"
              route-to="/resetpassword"
              :show-arrow="false"
            >
              Reset Password
            </large-button>
          </div>

          <div
            v-if="showSection(ProfileSections.DELETE_ACCOUNT)"
            class="container-section"
          >
            <hr />
            <large-button
              class="button-width"
              variant="danger"
              :show-arrow="false"
              @click="ModalService.showDeleteAccountConfirmation"
            >
              Delete Account
            </large-button>
          </div>
        </div>
      </div>

      <div
        v-if="showSection(ProfileSections.UNLOCKED_SUBJECTS)"
        class="cert-info contain"
      >
        <div class="subheader-subjects">
          <div class="subheader-subjects--left">Unlocked Subjects</div>
          <div class="subheader-subjects--right" data-testid="tutoring-alerts">
            Tutoring Alerts
          </div>
        </div>
        <loader
          v-if="isFetchingSubjects"
          class="loader--center"
          :height="40"
          :width="40"
        />
        <div v-else class="container-content cert">
          <div
            v-for="subject in userSubjects"
            :key="`certification-${subject.name}-${subject.value}`"
          >
            <div v-if="subject.value" class="certBox">
              <div class="subjects-left">
                <div
                  :style="{
                    backgroundColor: subjects[subject.name].topicColor,
                  }"
                  class="certKey"
                >
                  {{ subjects[subject.name].topicDisplayName.toUpperCase() }}
                </div>
                <div class="certValue">
                  {{ subjects[subject.name].displayName }}
                </div>
              </div>
              <div class="subjects-right" data-testid="toggle-buttons">
                <toggle-button
                  :data-testid="`toggle-button-${subject.name}`"
                  :value="subjectIsNotMuted(subject.name)"
                  :width="75"
                  :labels="{ checked: 'On', unchecked: 'Off' }"
                  :color="{
                    checked: '#16D2AA',
                    unchecked: '#F44747',
                    disabled: '#AAAAAA',
                  }"
                  @change="
                    togglemutedSubjectAlerts(
                      subject.name,
                      subjectIsNotMuted(subject.name)
                    )
                  "
                  :sync="true"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import { toastController } from '@ionic/vue'
import UserService from '@/services/UserService'
import AnalyticsService from '@/services/AnalyticsService'
import ModalService from '@/services/ModalService'
import { SsoProvider, signInWithSso } from '@/services/SsoService'
import DeactivateAccountModal from '../DeactivateAccountModal.vue'
import setNotificationPermission from '@/utils/set-notification-permission'
import getNotificationPermission from '@/utils/get-notification-permission'
import { EVENTS, VERIFICATION_METHOD } from '@/consts'
import { getAcademicYear } from '@/utils/academic-year'
import Loader from '@/components/Loader.vue'
import VerificationModal from '../VerificationModal.vue'
import Checkbox from '@/components/CheckBox.vue'
import RemovePhoneConfirmationModal from '@/views/ProfileView/RemovePhoneConfirmationModal.vue'
import TutoringLanguagesChecklist from '@/views/TutoringLanguagesChecklist.vue'
import CleverLogo from '@/components/CleverLogo.vue'
import TrashIcon from '@/assets/trash.svg'
import PencilIcon from '@/assets/pencil.svg'
import ToggleButton from '@/components/ToggleButton.vue'
import PreferredLanguageSelect from '@/components/PreferredLanguageSelect.vue'
import MazPhoneNumberInput from 'maz-ui/components/MazPhoneNumberInput'
import SecondaryEmailModal from '@/views/SecondaryEmailModal.vue'
import LargeButton from '@/components/LargeButton.vue'
import { IonToast } from '@ionic/vue'
import TutoringExperienceQuestion from '@/views/TutoringExperienceQuestion.vue'
import EditOccupation from '@/views/ProfileView/EditOccupation.vue'
import GradeLevelSelect from '@/components/GradeLevelSelect.vue'

const ProfileSections = {
  EMAIL: 'email',
  SECONDARY_EMAIL: 'secondaryEmail',
  PHONE_INFORMATION: 'phoneInformation',
  ACCOUNT_STATUS: 'accountStatus',
  BROWSER_NOTIFICATIONS: 'browserNotifications',
  CLEVER_SYNC: 'cleverSync',
  PREFERRED_LANGUAGE: 'preferredLanguage',
  TUTORING_LANGUAGES: 'tutoringLanguages',
  // pragma: allowlist nextline secret
  RESET_PASSWORD: 'resetPassword',
  DELETE_ACCOUNT: 'deleteAccount',
  UNLOCKED_SUBJECTS: 'unlockedSubjects',
  TUTORING_EXPERIENCE: 'tutoringExperience',
  OCCUPATION: 'occupation',
  GRADE_LEVEL: 'gradeLevel',
}

const RoleSections = {
  volunteer: [
    ProfileSections.EMAIL,
    ProfileSections.PHONE_INFORMATION,
    ProfileSections.ACCOUNT_STATUS,
    ProfileSections.BROWSER_NOTIFICATIONS,
    ProfileSections.TUTORING_LANGUAGES,
    ProfileSections.TUTORING_EXPERIENCE,
    ProfileSections.RESET_PASSWORD,
    ProfileSections.DELETE_ACCOUNT,
    ProfileSections.UNLOCKED_SUBJECTS,
    ProfileSections.OCCUPATION,
  ],
  student: [
    ProfileSections.EMAIL,
    ProfileSections.SECONDARY_EMAIL,
    ProfileSections.PHONE_INFORMATION,
    ProfileSections.BROWSER_NOTIFICATIONS,
    ProfileSections.PREFERRED_LANGUAGE,
    ProfileSections.RESET_PASSWORD,
    ProfileSections.DELETE_ACCOUNT,
    ProfileSections.GRADE_LEVEL,
  ],
  teacher: [
    ProfileSections.EMAIL,
    ProfileSections.CLEVER_SYNC,
    ProfileSections.RESET_PASSWORD,
    ProfileSections.DELETE_ACCOUNT,
  ],
}

export default {
  name: 'profile-view',
  components: {
    EditOccupation,
    TutoringExperienceQuestion,
    IonToast,
    SecondaryEmailModal,
    RemovePhoneConfirmationModal,
    TutoringLanguagesChecklist,
    Checkbox,
    DeactivateAccountModal,
    MazPhoneNumberInput,
    Loader,
    VerificationModal,
    TrashIcon,
    PencilIcon,
    CleverLogo,
    ToggleButton,
    PreferredLanguageSelect,
    LargeButton,
    GradeLevelSelect,
  },
  data() {
    return {
      ProfileSections,
      ModalService,
      activeEdit: false,
      editPhoneInformationButtonLabel: 'Edit',
      errors: [],
      invalidInputs: [],
      saveFailed: false,
      phone: '',
      phoneInputInfo: {},
      isAccountActive: true,
      isAllowingNotifications: true,
      showDeactivateAccountModal: false,
      shouldSeeSmsConsentCheckbox: false,
      showDeletePhoneConfirmationModal: false,
      showSmsVerificationModal: false,
      smsConsent: false,
      newMutedSubjectAlerts: [],
      showSecondaryEmailModal: false,
      errorMessage: '',
      selectedGradeLevel: '',
    }
  },
  async created() {
    this.isAllowingNotifications = getNotificationPermission() === 'granted'
    this.isAccountActive = !this.user.isDeactivated
    if (this.user.phone) {
      this.phone = this.user.phone
      this.smsConsent = this.user.smsConsent
    }
    if (this.isVolunteer) {
      this.newMutedSubjectAlerts = [...this.user.mutedSubjectAlerts]
    }
    this.selectedGradeLevel = this.user.gradeLevel ?? ''
    this.updateVerifiedPhoneInfo()

    if (this.$route?.query?.error) {
      const toast = await toastController.create({
        message: this.$route.query.error,
        color: 'danger',
        duration: 3000,
        position: 'bottom',
      })
      await toast.present()
    }
  },
  computed: {
    ...mapState({
      user: (state) => state.user.user,
      subjects: (state) => state.subjects.subjects,
      isFetchingSubjects: (state) => state.subjects.isFetchingSubjects,
    }),
    ...mapGetters({
      userType: 'user/userType',
      isVolunteer: 'user/isVolunteer',
      isStudent: 'user/isStudent',
      isTeacher: 'user/isTeacher',
      showNationalPhoneNumbersOnly: 'user/showNationalPhoneNumbersOnly',
      allSubtopics: 'subjects/allSubtopics',
      isFilterActiveSubjectsActive: 'featureFlags/isFilterActiveSubjectsActive',
      hasStudentOccupation: 'user/hasStudentOccupation',
      isSecondaryEmailOnProfilePageEnabled:
        'featureFlags/isSecondaryEmailOnProfilePageEnabled',
      hasStudentRole: 'user/hasStudentRole',
      hasVolunteerRole: 'user/hasVolunteerRole',
    }),

    isPartnerTeacher() {
      return this.isTeacher && this.user.isSchoolPartner
    },
    name() {
      const user = this.$store.state.user.user
      return user.firstname || this.userType
    },
    VERIFICATION_METHOD() {
      return VERIFICATION_METHOD
    },
    userSubjects() {
      const user = this.user
      const userSubjects = this.isFilterActiveSubjectsActive
        ? user.activeSubjects
        : user.subjects

      const subjects = this.subjects
      if (Object.keys(subjects).length === 0) {
        return []
      }

      const sortedSubjects = userSubjects
        .map((subject) => {
          const displayName = subjects[subject].displayName
          return {
            name: subject,
            value: true,
            displayName: displayName,
          }
        })
        .sort((a, b) => a.displayName.localeCompare(b.displayName))

      return sortedSubjects
    },
    isNotificationPermissionGranted() {
      return 'Notification' in window && Notification.permission === 'granted'
    },
    userNeedsToVerifyPhone() {
      const isAddingForFirstTime = !this.user.phone && this.phoneInputInfo.e164
      const isUpdating =
        this.user.phone && this.user.phone !== this.phoneInputInfo.e164
      return isAddingForFirstTime || isUpdating
    },
    userPreferredLanguage() {
      return this.$refs.preferredLanguageSelectRef?.selectedLanguage
    },
  },
  methods: {
    getAcademicYear,
    async saveGradeLevel() {
      await this.setProfile(
        this.createUpdateProfileRequestBody({
          gradeLevel: this.selectedGradeLevel,
        }),
        'grade level'
      )
    },
    showSection(sectionName, additionalCriteria = true) {
      let maybeShowSection = false
      if (this.isVolunteer)
        maybeShowSection = RoleSections.volunteer.includes(sectionName)
      if (this.isStudent)
        maybeShowSection = RoleSections.student.includes(sectionName)
      if (this.isTeacher)
        maybeShowSection = RoleSections.teacher.includes(sectionName)
      // apply optional additional filters
      return maybeShowSection && additionalCriteria
    },
    onPreferredLanguageError(err) {
      this.errorMessage =
        err?.message ??
        'Something went wrong while updating your preferred language. Please refresh the page and try again.'
    },
    resetErrorMessage() {
      this.errorMessage = ''
    },
    async setProfile(data, fieldName, revertFn) {
      try {
        await UserService.setProfile(data, this.$store)
      } catch (err) {
        this.errorMessage =
          err?.message ??
          `Something went wrong while updating your ${fieldName ?? 'information'}. Please refresh the page and try again.`
        if (revertFn) {
          revertFn()
        }
      }
    },
    async updateSecondaryEmail(email) {
      await this.$store.dispatch('user/addToUser', {
        proxyEmail: email,
      })
    },
    toggleSecondaryEmailModal(maybeValue) {
      if (maybeValue === undefined) {
        this.showSecondaryEmailModal = !this.showSecondaryEmailModal
      } else {
        this.showSecondaryEmailModal = maybeValue
        if (maybeValue)
          AnalyticsService.captureEvent(
            EVENTS.SECONDARY_EMAIL_CLICKED_ADD_EMAIL
          )
      }
    },
    onPhoneInputUpdate(phoneInputInfo) {
      this.phoneInputInfo = phoneInputInfo
    },
    toggleDeletePhoneConfirmationModal() {
      this.showDeletePhoneConfirmationModal =
        !this.showDeletePhoneConfirmationModal
    },
    handleDeleteNumber() {
      this.showDeletePhoneConfirmationModal = false
      this.shouldSeeSmsConsentCheckbox = false
      this.smsConsent = false
    },

    async onChangeSmsConsent() {
      const smsConsent = !this.smsConsent
      const reqBody = this.createUpdateProfileRequestBody({
        smsConsent,
      })
      await this.setProfile(reqBody, 'SMS consent', () => {
        this.smsConsent = !smsConsent
      })
      AnalyticsService.captureEvent(EVENTS.SMS_CONSENT_CHECKBOX_CHANGED, {
        event: EVENTS.SMS_CONSENT_CHECKBOX_CHANGED,
        value: smsConsent ? 'checked' : 'unchecked',
      })
    },

    async toggleAccountActive({ value }) {
      if (!value) {
        this.toggleDeactivatedAccountModal()
        return
      }
      await this.setProfile({ isDeactivated: false }, 'account status', () => {
        this.setIsAccountActive(false)
      })
      this.setIsAccountActive(true)
    },

    toggleDeactivatedAccountModal() {
      this.showDeactivateAccountModal = !this.showDeactivateAccountModal
    },

    toggleWebNotifications({ value }) {
      const permission = value ? 'granted' : 'denied'
      this.isAllowingNotifications = value
      setNotificationPermission(permission)
    },

    async togglemutedSubjectAlerts(subject, isNotMuted) {
      const previousAlerts = [...this.newMutedSubjectAlerts]
      if (isNotMuted) {
        this.newMutedSubjectAlerts.push(subject)
      } else {
        this.newMutedSubjectAlerts = this.newMutedSubjectAlerts.filter(
          (s) => s != subject
        )
      }

      // TODO handle failures (i.e. unset non-saved values)
      // maybe dont' reuse createUpdateProfileRequestBody.
      // how about a new endpoint?
      const reqBody = this.createUpdateProfileRequestBody({
        mutedSubjectAlerts: this.newMutedSubjectAlerts,
      })
      await this.setProfile(reqBody, 'tutoring alerts', () => {
        this.mutedSubjectAlerts = previousAlerts
      })
    },

    subjectIsNotMuted(subject) {
      return !this.newMutedSubjectAlerts.includes(subject)
    },

    toggleShowSmsVerificationModal(isSuccess) {
      if (!isSuccess) {
        this.phone = this.user.phone
      }
      this.showSmsVerificationModal = !this.showSmsVerificationModal
    },

    setIsAccountActive(value) {
      this.isAccountActive = value
    },

    async updateVerifiedPhoneInfo() {
      this.shouldSeeSmsConsentCheckbox = this.user.phone
    },

    syncClever() {
      signInWithSso({
        provider: SsoProvider.CLEVER,
        email: this.user.email,
        redirect: '/profile',
        errorRedirect: '/profile',
      })
    },

    editPhoneInformation() {
      // {Case A} Enter the editing state, then early exit
      if (!this.activeEdit) {
        this.editPhoneInformationButtonLabel = 'Save'
        this.activeEdit = true
        return
      }

      // {Case B} The remainder of this function saves new changes and exits the editing state

      // Start by erasing previous errors
      this.errors = []
      this.invalidInputs = []
      this.saveFailed = false

      // Validate fields
      if (this.isVolunteer) {
        // volunteers must provide a phone number, so display error message and
        // mark field invalid
        if (
          this.user.phone &&
          (!this.phoneInputInfo.isValid || !this.phoneInputInfo.e164)
        ) {
          this.errors.push('Please enter a valid phone number.')
          this.invalidInputs.push('phone')
        }
      }

      if (!this.errors.length) {
        // Phone number verification flow
        if (this.userNeedsToVerifyPhone) {
          this.showSmsVerificationModal = true
        }
        this.activeEdit = false
      }
    },

    /*
     * @TODO: Get rid of this eventually.
     * It's only here because the backend requires isDeactivated to be present in the request
     * or else it will reactivate the user. We don't necessarily want that behavior, so we always
     * send it up on the client.
     * We should update subway and then clean this up.
     */
    createUpdateProfileRequestBody(data) {
      return {
        isDeactivated: !this.isAccountActive,
        ...data,
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.prompt {
  @include font-category('subheading');
}

hr {
  background-color: $border-grey;
  border: none;
  height: 1px;
  width: 100%;
  margin: 16px 0;
}
.profile {
  font-size: 16px;
  font-family: $font-family-default;
}

.wrap-container {
  padding: 15px 15px 55px 15px;
  gap: 1em;
  display: grid;

  @include breakpoint-below('medium') {
    padding: 8px;
    display: flex;
    flex-direction: column;
  }

  @include breakpoint-above('huge') {
    padding: 40px;
    grid-auto-flow: column;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }
}

.header {
  display: flex;
  margin: 0;
  font-size: 24px;
  align-items: center;
  justify-content: space-between;
  font-weight: 500;
  padding: 25px 15px 10px 35px;

  @include breakpoint-above('large') {
    padding: 40px 40px 0 40px;
  }
}

.contain {
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  background: white;
  padding-left: 16px;
  padding-right: 16px;
}

.container-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  text-align: left;

  @include breakpoint-above('large') {
    padding: 40px;
  }
}

.subheader {
  font-weight: 600;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30px 15px 0;
  font-size: 20px;
}

.subheader-subjects {
  display: grid;
  grid-template-columns: 2fr 1fr;
  grid-template-rows: 1;
  font-size: 20px;
  font-weight: 600;
  padding: 30px 15px 0;
}

.subheader-subjects--center {
  grid-column: 1 / 3;
  text-align: center;
}

.subheader-subjects--left {
  grid-column: 1;
  text-align: left;
}

.subheader-subjects--right {
  grid-column: 2;
  text-align: right;
}

.subjects-left {
  grid-column: 1;
  text-align: left;
}

.subjects-right {
  grid-column: 2;
  text-align: right;
  padding-top: 8px;
}

.container-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

ul {
  padding: 0px;
  height: 100%;
  margin: auto;
}

.basic-info {
  display: flex;
  flex-direction: column;
  align-items: left;
  margin-top: 30px;
}

.info-header {
  display: flex;
  align-items: center;

  margin-left: 30px;
  font-size: 20px;
  font-weight: 600;
}

.info-header.basic {
  height: 60px;
}

.info-header.cert {
  margin-bottom: 15px;
}

.answer {
  font-weight: 600;
}

#phone-heading {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

.phone-answer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: baseline;
}

.answer .vue-js-switch {
  margin: 5px 0;
}

.answer ul {
  margin-left: 20px;
}

.phone-input {
  margin: 5px 0 0;
  width: 100%;
  :deep(.m-input-wrapper) {
    width: 100%;
  }
}

.description {
  margin-top: 10px;
  @include font-category('helper-text');
}

button {
  border-radius: 20px;
  padding: 0px 10px;
  color: #16d2aa;
  background-color: #f6f6f6;
}

button:active,
button:hover {
  background-color: #16d2aa;
  color: #fff;
}

.form-control {
  border: none;
  box-shadow: none;
  border-radius: 0;
  background-color: #f0f8fd;
}

.form-control {
  border-bottom: 3px solid #16d2aa;
  margin-bottom: 10px;

  &.invalid {
    border-bottom: 3px solid #bf0000;
  }
}

.form-control:focus {
  border-bottom: 3px solid #16d2aa;
  box-shadow: none;
}

.phone-crud-buttons {
  display: flex;
  flex-direction: row;
}

.edit-phone-information-button {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.field-button {
  color: $c-soft-black;
  border-radius: 0px;
  border: none;
  background-color: transparent;
  display: flex;
  flex-direction: row;
  align-items: baseline;
  gap: 4px;

  &:hover {
    background-color: transparent;
    color: $c-soft-black;
  }

  button {
    border: none;
    background: none;
    padding-left: 0px;
  }
}

.delete-phone-icon {
  height: 14px;
  width: 14px;
}

.container-content.cert {
  padding: 30px 0 0;
}

.certBox {
  display: grid;
  grid-template-columns: 2fr 1fr;
  grid-template-rows: 1;
  height: 60px;
  align-items: center;
  padding-left: 20px;
  padding-right: 20px;
  border-top: 1px solid #cccccf;
  font-weight: 600;
}

.certKey {
  display: inline-block;
  border-radius: 12px;
  padding: 0 10px;
  margin: 0 10px 0 0;
  color: #ffffff;
  font-size: 12px;
  background-color: #1855d1;
}

.certValue {
  display: inline-block;
}

.errors {
  text-align: left;
  padding: 30px;
}

.errors-heading {
  color: #bf0000;
}

.errors-list {
  color: #bf0000;
  margin-left: 40px;
}

.loader--center {
  margin-top: 2em;
  margin-right: auto;
  margin-left: auto;
}

.unverified {
  display: flex;
  gap: 4px;
  font-weight: normal;
}

.secondary-btn {
  &:hover {
    cursor: pointer;
  }

  p {
    font-style: none;
  }
}

.sms-consent {
  display: flex;
  flex-direction: column;
  align-items: baseline;

  .checkbox-container {
    display: flex;
    flex-direction: row;
  }

  .sms-consent-false {
    color: $c-error-red;
  }

  .sms-consent-true {
    color: $c-success-green;
  }
}

.sync-clever-btn {
  align-items: center;
  display: flex;

  background-color: $upchieve-white;
  color: $c-information-blue;

  height: fit-content;
  padding: 10px 20px 10px 0;
  width: fit-content;

  &:hover {
    background-color: $upchieve-white;
    color: $c-information-blue;
    text-decoration: underline;
  }

  .clever-logo {
    width: 25px;
  }
}

.last-clever-sync {
  color: $c-secondary-grey;
  font-size: 14px;
}

.preferred-language-select {
  margin-top: 1em;
}

.button-width {
  max-width: 300px;
}
</style>
