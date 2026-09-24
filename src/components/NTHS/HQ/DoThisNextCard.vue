<script setup lang="ts">
import { computed, nextTick, onBeforeMount, ref } from 'vue'
import { useStore } from 'vuex'
import { RouterLink } from 'vue-router'
import LoggerService from '@/services/LoggerService'
import {
  CheckboxStatus,
  toggleCheckbox,
  type ChecklistItem,
} from '@/services/NTHSGroupService'

const props = defineProps<{ groupId: string }>()
const emit = defineEmits<{ (e: 'finished'): void }>()

const store = useStore()
const checklist = computed<ChecklistItem[]>(
  () => store.getters['nths/NTHSChecklist']
)

const isLoading = ref(true)
const loadFailed = ref(false)

onBeforeMount(async () => {
  try {
    await store.dispatch('nths/fetchNTHSGroupActions', props.groupId)
  } catch (err) {
    loadFailed.value = true
    LoggerService.noticeError(err, 'Could not load the NTHS chapter checklist')
  } finally {
    isLoading.value = false
  }
})

const item = computed(() =>
  isLoading.value || loadFailed.value
    ? undefined
    : checklist.value.find(({ status }) => status !== CheckboxStatus.Done)
)

const heading = ref<HTMLElement>()
const isSaving = ref(false)
const errorMessage = ref('')
const announcement = ref('')

async function markDone() {
  const current = item.value
  if (!current || current.locked || isSaving.value) return

  isSaving.value = true
  errorMessage.value = ''
  announcement.value = ''
  const recorded = await toggleCheckbox({
    item: current,
    groupId: props.groupId,
  })
  isSaving.value = false
  if (!recorded) {
    errorMessage.value = 'Something went wrong while saving. Please try again.'
    return
  }

  // The pressed button leaves with its item, so focus moves to the next
  // item's heading, or out to Home.
  if (item.value) {
    announcement.value = `Marked "${current.text}" as done.`
    await nextTick()
    heading.value?.focus()
  } else {
    announcement.value = `Marked "${current.text}" as done. Your checklist is finished.`
    emit('finished')
  }
}
</script>

<template>
  <Transition name="card">
    <section
      v-if="item"
      class="do-next"
      aria-labelledby="do-next-eyebrow"
      data-testid="do-this-next"
    >
      <p id="do-next-eyebrow" class="eyebrow">Do this next</p>
      <h2
        ref="heading"
        class="title"
        tabindex="-1"
        data-testid="do-this-next-title"
      >
        {{ item.text }}
      </h2>
      <p v-if="item.help" class="help" data-testid="do-this-next-help">
        {{ item.help }}
      </p>

      <div class="actions">
        <a
          v-if="item.url"
          class="action resource"
          :href="item.url"
          target="_blank"
          rel="noopener noreferrer"
          data-testid="do-this-next-resource"
        >
          {{ item.controlText }}
        </a>
        <RouterLink
          v-else-if="item.routeTo"
          class="action resource"
          :to="item.routeTo"
          data-testid="do-this-next-resource"
        >
          {{ item.controlText }}
        </RouterLink>
        <button
          v-if="!item.locked"
          type="button"
          class="action mark-done"
          :aria-disabled="isSaving || undefined"
          data-testid="do-this-next-mark-done"
          @click="markDone"
        >
          {{ isSaving ? 'Saving…' : 'Mark as done' }}
        </button>
        <RouterLink
          class="to-do"
          to="/groups/to-do"
          data-testid="do-this-next-to-do"
        >
          See the full checklist
        </RouterLink>
      </div>

      <p
        v-if="errorMessage"
        class="error"
        role="alert"
        data-testid="do-this-next-error"
      >
        {{ errorMessage }}
      </p>
    </section>
  </Transition>
  <p class="visually-hidden" role="status" data-testid="do-this-next-status">
    {{ announcement }}
  </p>
</template>

<style scoped lang="scss">
.do-next {
  @include nths-card(28px 30px);
  background: $c-nths-navy;
  border-color: $c-nths-navy;
  color: $upchieve-white;
}
.eyebrow {
  @include nths-card-eyebrow;
  color: $c-college;
  margin: 0;
}
.title {
  font-size: 24px;
  font-weight: 500;
  line-height: 1.3;
  max-width: 560px;
  margin: 14px 0 0;

  &:focus-visible {
    outline: 2px solid $c-college;
    outline-offset: 4px;
  }
}
.help {
  font-size: 15px;
  line-height: 1.6;
  color: rgba($upchieve-white, 0.85);
  max-width: 520px;
  margin: 8px 0 0;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 16px;
  margin-top: 22px;
}
.action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  // Transparent on the resource link so both pills are the same height.
  border: 1px solid transparent;
  border-radius: 20px;
  padding: 10px 22px;
  font-size: 15px;
  line-height: 1.2;
  text-align: center;
  text-decoration: none;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid $c-college;
    outline-offset: 2px;
  }

  @include breakpoint-below('small') {
    flex: 1 1 100%;
  }
}
.resource {
  background: $c-college;
  color: $c-nths-navy;
  font-weight: 600;

  &:hover {
    background: darken($c-college, 9%);
    color: $c-nths-navy;
    text-decoration: none;
  }
}
.mark-done {
  background: transparent;
  border-color: rgba($upchieve-white, 0.5);
  color: $upchieve-white;
  font-weight: 500;

  &:hover {
    border-color: $upchieve-white;
  }

  &[aria-disabled='true'] {
    border-color: rgba($upchieve-white, 0.5);
    color: rgba($upchieve-white, 0.7);
    cursor: default;
  }
}
.to-do {
  font-size: 14px;
  font-weight: 500;
  line-height: 1.2;
  padding: 2px 0;
  color: $upchieve-white;
  text-decoration: underline;

  &:hover {
    color: $c-college;
  }

  &:focus-visible {
    outline: 2px solid $c-college;
    outline-offset: 2px;
  }

  @include breakpoint-below('small') {
    flex: 1 1 100%;
    text-align: center;
  }
}
.error {
  @include nths-error-box;
  color: $c-soft-black;
  font-size: 14px;
  line-height: 1.4;
  margin: 16px 0 0;
}
.visually-hidden {
  @include visually-hidden;
}

.card-enter-active,
.card-leave-active {
  transition: opacity 200ms ease;
}
.card-enter-from,
.card-leave-to {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .card-enter-active,
  .card-leave-active {
    transition: none;
  }
}
</style>
