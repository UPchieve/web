<script lang="ts" setup>
import {
  SchoolAffiliationMachine,
  type AdvisorInfo,
  type AffiliationStatus,
} from './SchoolAffiliation/school-affiliation-machine'
import SchoolForm from './SchoolAffiliation/Form.vue'
import { useMachine } from '@xstate/vue'
import LargeButton from '../LargeButton.vue'
import Spinner from '../Spinner.vue'
import Card from './Card.vue'

const props = defineProps<{
  groupId: string
  initialStatus: AffiliationStatus | null
}>()

const { snapshot, send } = useMachine(SchoolAffiliationMachine, {
  input: {
    groupId: props.groupId,
    schoolAffiliationStatus: props.initialStatus,
  },
})
</script>

<template>
  <Card class="card">
    <template v-slot:header>School Affiliation: Optional</template>
    <Spinner class="spinner" v-if="snapshot.hasTag('loading')" />

    <div class="max-width" v-if="snapshot.matches('Undecided')">
      <p class="card-text">
        School-affiliated chapters are verified through your school
        administration.
      </p>
      <div class="card-text">
        What happens when you submit:
        <ul>
          <li>
            UPchieve will send a verification request to your NTHS advisor's
            email
          </li>
          <li>
            Your advisor must verify their contact information using the
            instructions in the email
          </li>
          <li>
            Your advisor will review and confirm your chapter's affiliation
          </li>
          <li>UPchieve will complete final verification and approval</li>
          <li>You'll receive updates as the process progresses</li>
        </ul>
      </div>

      <div class="footer">
        <LargeButton
          variant="primary-blue"
          :show-arrow="false"
          v-on:click="send({ type: 'OPT_IN' })"
        >
          Link School to Chapter
        </LargeButton>
      </div>
    </div>
    <div
      class="max-width"
      v-if="
        snapshot.matches('SeekingAffiliation') ||
        snapshot.matches('SubmittingAdvisorInfo')
      "
    >
      <div>
        <div class="header">Chapter Advisor</div>
        <p class="card-text">
          Add your school and a faculty advisor who can verify your chapter's
          affiliation.
        </p>
        <p v-if="snapshot.context.submitError" class="card-text error-text">
          {{ snapshot.context.submitError }}
        </p>
      </div>
      <SchoolForm
        class="form"
        @submit="
          (advisorInfo: AdvisorInfo) =>
            send({ type: 'SUBMIT_ADVISOR_INFO', advisorInfo })
        "
        @cancel="() => send({ type: 'WITHDRAW' })"
        :submitting="snapshot.matches('SubmittingAdvisorInfo')"
      />
    </div>

    <div class="max-width" v-if="snapshot.matches('OptedOut')">
      <p class="card-text">
        You've opted out of affiliating your NTHS Chapter with your school
      </p>
      <p class="card-text">
        School-affiliated chapters are verified through your school
        administration.
      </p>
      <div class="footer">
        <LargeButton
          variant="primary-blue"
          :show-arrow="false"
          v-on:click="send({ type: 'OPT_IN' })"
        >
          Link School to Chapter
        </LargeButton>
      </div>
    </div>

    <div class="max-width status" v-if="snapshot.matches('Denied')">
      <div class="body">
        <div class="header">Denied</div>
        Your school has denied the affiliation request. You can try again with a
        different school or contact the school administrators.
      </div>
      <div class="footer">
        <LargeButton
          variant="primary-blue"
          :show-arrow="false"
          v-on:click="send({ type: 'OPT_IN' })"
        >
          Try again
        </LargeButton>
      </div>
    </div>

    <div class="max-width status" v-if="snapshot.matches('Approved')">
      <div class="body">
        <div class="header">🎉 Approved</div>
        Your chapter is officially affiliated with your school.
      </div>
    </div>

    <div
      class="max-width status"
      v-if="snapshot.matches('AwaitingUPchieveVerification')"
    >
      <div class="body">
        <div class="header">✓ Submitted for Approval</div>
        Your chapter's school affiliation request has been sent to your school
        administrators for verification. We will update your approval status
        here.
      </div>
    </div>
  </Card>
</template>

<style lang="scss" scoped>
.card {
  width: fit-content;
  height: fit-content;
}
.form {
  min-width: 400px;
}
.spinner {
  min-width: 400px;
}
.card-text {
  text-align: left;
}
.error-text {
  color: $c-error-red;
}
.header {
  text-align: left;
  font-weight: 500;
}
.body {
  border-radius: 8px;
  background-color: $border-grey;
  border: 1px solid rgb(184, 184, 184);

  padding: 1em;
  text-align: left;
}
.footer {
  padding-top: 1em;
  display: flex;
  justify-content: end;
  align-items: center;
  gap: 12px;
}
.max-width {
  max-width: 400px;
}

ul {
  padding-left: 16px;
}
</style>
