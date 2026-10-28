<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  adminNTHSGetMember,
  adminNTHSUpdateMember,
  type NTHSMemberForStaff,
} from '@/services/NetworkService'
import {
  LEADERSHIP_TITLES,
  type NTHSMemberUpdate,
  type NTHSTitle,
} from '@/services/NTHSGroupService'
import {
  displayTitle,
  memberDisplayName,
  titleChoices,
} from '@/services/NTHSRosterService'
import ModalService from '@/services/ModalService'
import { dayjs } from '@/utils/time-utils'

const route = useRoute()
const query = computed(() => {
  const one = (raw: unknown) => (Array.isArray(raw) ? raw[0] : raw) ?? ''
  return {
    chapterId: String(one(route.query.chapterId)),
    userId: String(one(route.query.userId)),
  }
})

const data = ref<NTHSMemberForStaff>()
const isAdminDraft = ref(false)
const titleDraft = ref<NTHSTitle>('Member')
const isLoading = ref(false)
const isSaving = ref(false)
const error = ref('')
const success = ref('')

const member = computed(() => data.value?.member)
const chapter = computed(() => data.value?.chapter)
const fullName = computed(() =>
  member.value
    ? `${member.value.firstName} ${member.value.lastName}`.trim()
    : ''
)
const isDeparted = computed(() => !!member.value?.deactivatedAt)
const canEditDetails = computed(
  () => !isDeparted.value && !member.value?.deleted
)
const otherAdminRoster = computed(() =>
  (data.value?.otherAdmins ?? []).map((a) => ({
    userId: a.userId,
    title: a.title,
    accountClosed: a.deleted,
  }))
)
const titleOptions = computed(() =>
  titleChoices(
    { userId: member.value?.userId ?? '' },
    otherAdminRoster.value,
    isAdminDraft.value
  )
)
const adminRoster = computed(() =>
  member.value && !isDeparted.value
    ? [
        ...otherAdminRoster.value,
        { title: member.value.title, accountClosed: member.value.deleted },
      ]
    : otherAdminRoster.value
)
const NO_TITLE_LABEL = 'No title'
const memberTitleLabel = computed(() =>
  member.value
    ? (displayTitle(member.value, adminRoster.value) ?? NO_TITLE_LABEL)
    : ''
)
// Unticking Admin keeps a President or VP draft, so ticking it again restores
// the choice without a save.
const effectiveTitle = computed<NTHSTitle>(() =>
  !isAdminDraft.value && LEADERSHIP_TITLES.includes(titleDraft.value)
    ? 'Member'
    : titleDraft.value
)
const titleSelect = computed<NTHSTitle>({
  get: () => effectiveTitle.value,
  set: (title) => (titleDraft.value = title),
})

const pendingUpdate = computed<NTHSMemberUpdate>(() => {
  const update: NTHSMemberUpdate = {}
  if (!member.value) return update
  const role = isAdminDraft.value ? 'admin' : 'member'
  if (role !== member.value.roleName) {
    update.role = role
  }
  if (effectiveTitle.value !== member.value.title) {
    update.title = effectiveTitle.value
  }
  return update
})
const hasChanges = computed(() => Object.keys(pendingUpdate.value).length > 0)

function errorMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}

function adminLink(userId: string) {
  return {
    path: '/admin/nths/member',
    query: { chapterId: query.value.chapterId, userId },
  }
}

function isCurrentQuery(chapterId: string, userId: string) {
  return chapterId === query.value.chapterId && userId === query.value.userId
}

async function load() {
  const { chapterId, userId } = query.value
  if (!chapterId || !userId) return
  isLoading.value = true
  try {
    const res = await adminNTHSGetMember(chapterId, userId)
    if (!isCurrentQuery(chapterId, userId)) return
    data.value = res
    isAdminDraft.value = res.member.roleName === 'admin'
    titleDraft.value = res.member.title
    error.value = ''
  } catch (e) {
    if (!isCurrentQuery(chapterId, userId)) return
    data.value = undefined
    error.value = `Could not load member: ${errorMessage(e)}`
  } finally {
    if (isCurrentQuery(chapterId, userId)) {
      isLoading.value = false
    }
  }
}

async function send(update: NTHSMemberUpdate, successMessage: string) {
  if (!member.value || !chapter.value) return
  isSaving.value = true
  error.value = ''
  success.value = ''
  try {
    await adminNTHSUpdateMember(chapter.value.id, member.value.userId, update)
    await load()
    if (!error.value) {
      success.value = successMessage
    }
  } catch (e) {
    error.value = `Could not save: ${errorMessage(e)}`
  } finally {
    isSaving.value = false
  }
}

function onSave() {
  if (!hasChanges.value) return
  return send(pendingUpdate.value, 'Saved.')
}

function onTakeAdminAway() {
  return send({ role: 'member' }, 'Admin removed.')
}

async function onRemove() {
  if (!member.value || !chapter.value) return
  const warning = member.value.isLastAdmin
    ? ` ${fullName.value} is the last admin of this chapter.`
    : ''
  const confirmed = await ModalService.showConfirm(
    `Remove ${fullName.value}?`,
    `${fullName.value} will be removed from ${chapter.value.name}.${warning}`,
    { acceptText: 'Remove member', acceptButtonVariant: 'danger' }
  )
  if (!confirmed) return
  return send({ isActive: false }, 'Member removed.')
}

watch(
  query,
  () => {
    data.value = undefined
    error.value = ''
    success.value = ''
    return load()
  },
  { immediate: true }
)
</script>

<template>
  <div class="card">
    <h1>NTHS Chapter Member</h1>

    <p v-if="!query.chapterId || !query.userId">
      No member to show. Open this page from the NTHS Admin Retool dashboard.
    </p>
    <p v-else-if="isLoading && !data">Loading...</p>
    <template v-else>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <p v-if="success" class="success" role="status">{{ success }}</p>

      <template v-if="member && chapter">
        <dl>
          <dt>Name</dt>
          <dd>{{ fullName }}</dd>
          <dt>Email</dt>
          <dd>{{ member.email }}</dd>
          <dt>Chapter</dt>
          <dd>
            {{ chapter.name }}
            <span v-if="chapter.closedAt">
              (closed {{ dayjs(chapter.closedAt).format('l') }})
            </span>
            <span v-else>(open)</span>
          </dd>
          <dt>Title</dt>
          <dd>{{ memberTitleLabel }}</dd>
          <dt>Role</dt>
          <dd>{{ member.roleName === 'admin' ? 'Admin' : 'Member' }}</dd>
          <dt>Membership</dt>
          <dd v-if="isDeparted">
            Departed since {{ dayjs(member.deactivatedAt).format('l') }} (joined
            {{ dayjs(member.joinedAt).format('l') }})
          </dd>
          <dd v-else>Current since {{ dayjs(member.joinedAt).format('l') }}</dd>
          <dt>Account</dt>
          <dd>{{ member.deleted ? 'Deleted' : 'Active' }}</dd>
        </dl>

        <p v-if="isDeparted" class="note">
          This member has left the chapter. Nothing can be changed.
        </p>

        <form
          v-if="canEditDetails"
          class="edit"
          autocomplete="off"
          @submit.prevent="onSave"
        >
          <label>
            <input
              v-model="isAdminDraft"
              type="checkbox"
              :disabled="isSaving"
            />
            Admin
          </label>
          <label>
            Title
            <select
              v-model="titleSelect"
              :disabled="isSaving"
              autocomplete="off"
            >
              <option
                v-for="choice in titleOptions"
                :key="choice.title"
                :value="choice.title"
              >
                {{ choice.label }}
              </option>
            </select>
          </label>
          <button
            class="uc-form-button"
            type="submit"
            :disabled="!hasChanges || isSaving"
          >
            Save
          </button>
        </form>

        <div v-if="!isDeparted" class="actions">
          <button
            v-if="member.deleted && member.roleName === 'admin'"
            class="uc-form-button"
            type="button"
            :disabled="isSaving"
            @click="onTakeAdminAway"
          >
            Take admin away
          </button>
          <button
            class="uc-form-button remove"
            type="button"
            :disabled="isSaving"
            @click="onRemove"
          >
            Remove from chapter
          </button>
        </div>

        <h2>Other admins</h2>
        <p v-if="!data?.otherAdmins.length">No other admins.</p>
        <ul v-else>
          <li v-for="admin in data.otherAdmins" :key="admin.userId">
            <router-link :to="adminLink(admin.userId)">
              {{ memberDisplayName(admin) }} </router-link
            >,
            {{
              displayTitle(
                { title: admin.title, accountClosed: admin.deleted },
                adminRoster
              ) ?? NO_TITLE_LABEL
            }}
            <span v-if="admin.deleted">(account deleted)</span>
          </li>
        </ul>
      </template>
    </template>
  </div>
</template>

<style lang="scss" scoped>
dl {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 8px 24px;
}
dt {
  font-weight: 600;
}
dd {
  margin: 0;
}
.edit {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
}
.actions {
  display: flex;
  gap: 16px;
  margin-top: 24px;
}
button {
  margin-top: 0;
  width: unset;
  padding: 12px 24px;
}
.remove {
  background-color: $c-error-red;
}
h2 {
  margin-top: 32px;
}
.error {
  color: $c-error-red;
}
.success {
  color: $c-success-green;
}

.card {
  background: #fff;
  margin: 10px;
  padding: 10px;
  border-radius: 8px;
  max-width: 1000px;

  @include breakpoint-above('medium') {
    margin: 40px;
    padding: 40px;
  }
}
</style>
