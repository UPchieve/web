<script setup lang="ts">
// Not built on Menu.vue: on mobile that always opens as a full IonModal
// bottom sheet, too heavy for a two- or three-item row action menu that
// needs to stay anchored next to its trigger inside a scrolling table.
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import type { NTHSRosterMemberPublic } from '@/services/NTHSGroupService'

const props = defineProps<{
  member: NTHSRosterMemberPublic
  open: boolean
  busy?: boolean
}>()
const emit = defineEmits<{
  (e: 'toggle'): void
  (e: 'close'): void
  (e: 'changeRole', roleName: 'admin' | 'member'): void
  (e: 'remove'): void
}>()

const POPOVER_WIDTH = 230
const GAP = 6
const VIEWPORT_MARGIN = 8

const root = ref<HTMLElement>()
const button = ref<HTMLButtonElement>()
const popover = ref<HTMLElement>()
// The table sits in an overflow-x container, which clips an absolutely
// positioned menu. Fixed coordinates measured off the button escape it.
const coords = ref<{ top: number; left: number }>()

function place() {
  const trigger = button.value?.getBoundingClientRect()
  if (!trigger) return
  const height = popover.value?.offsetHeight ?? 0
  const below = trigger.bottom + GAP
  const overflowsBelow = below + height > window.innerHeight - VIEWPORT_MARGIN
  coords.value = {
    top: overflowsBelow
      ? Math.max(VIEWPORT_MARGIN, trigger.top - GAP - height)
      : below,
    left: Math.max(VIEWPORT_MARGIN, trigger.right - POPOVER_WIDTH),
  }
}

function onDocumentClick(event: MouseEvent) {
  if (!root.value?.contains(event.target as Node)) emit('close')
}

function menuItems(): HTMLButtonElement[] {
  return Array.from(popover.value?.querySelectorAll('.item') ?? [])
}

function focusItem(index: number) {
  const items = menuItems()
  if (!items.length) return
  const wrapped = (index + items.length) % items.length
  items[wrapped].focus()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('close')
    button.value?.focus()
    return
  }
  if (!props.open) return
  if (event.key === 'Tab') {
    // The items are tabindex="-1" so Tab never lands on one; close the menu
    // rather than leave it open while focus moves past it.
    emit('close')
    return
  }
  const items = menuItems()
  const current = items.indexOf(document.activeElement as HTMLButtonElement)
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    focusItem(current + 1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    focusItem(current - 1)
  } else if (event.key === 'Home') {
    event.preventDefault()
    focusItem(0)
  } else if (event.key === 'End') {
    event.preventDefault()
    focusItem(items.length - 1)
  }
}

function listen(active: boolean) {
  if (active) {
    document.addEventListener('click', onDocumentClick)
    document.addEventListener('keydown', onKeydown)
    // Capture, so a scroll of the table's own container repositions it too.
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
  } else {
    document.removeEventListener('click', onDocumentClick)
    document.removeEventListener('keydown', onKeydown)
    window.removeEventListener('scroll', place, true)
    window.removeEventListener('resize', place)
  }
}

watch(
  () => props.open,
  async (open) => {
    listen(open)
    if (!open) {
      coords.value = undefined
      return
    }
    await nextTick()
    place()
    // place() only sets coords; the popover stays visibility:hidden until this
    // second tick applies the .placed class, and focus() is a no-op before then.
    await nextTick()
    focusItem(0)
  },
  // The roster swaps between table and cards on resize, mounting a fresh menu
  // that is already open.
  { immediate: true }
)

onBeforeUnmount(() => listen(false))

function onTriggerClick() {
  if (!props.busy) emit('toggle')
}

function choose(action: () => void) {
  button.value?.focus()
  action()
}
</script>

<template>
  <div class="row-menu" ref="root">
    <button
      ref="button"
      type="button"
      class="dots"
      :class="{ open }"
      :aria-disabled="busy"
      aria-label="Member actions"
      aria-haspopup="menu"
      :aria-expanded="open"
      :aria-controls="open ? `member-menu-${member.userId}` : undefined"
      :data-testid="`member-actions-${member.userId}`"
      v-ph:nthshq="'members.row_menu'"
      @click="onTriggerClick"
    >
      &#8943;
    </button>
    <div
      v-if="open"
      :id="`member-menu-${member.userId}`"
      ref="popover"
      class="popover"
      :class="{ placed: !!coords }"
      :style="{ top: `${coords?.top ?? 0}px`, left: `${coords?.left ?? 0}px` }"
      role="menu"
    >
      <template v-if="!member.accountClosed">
        <button
          v-if="member.roleName === 'member'"
          type="button"
          class="item"
          role="menuitem"
          tabindex="-1"
          :data-testid="`member-make-admin-${member.userId}`"
          v-ph:nthshq="'members.make_admin'"
          @click="choose(() => emit('changeRole', 'admin'))"
        >
          Make admin
        </button>
        <button
          v-else
          type="button"
          class="item"
          role="menuitem"
          tabindex="-1"
          :data-testid="`member-remove-admin-${member.userId}`"
          v-ph:nthshq="'members.remove_admin'"
          @click="choose(() => emit('changeRole', 'member'))"
        >
          Remove admin
        </button>
      </template>
      <button
        type="button"
        class="item danger"
        role="menuitem"
        tabindex="-1"
        :data-testid="`member-remove-${member.userId}`"
        v-ph:nthshq="'members.remove'"
        @click="choose(() => emit('remove'))"
      >
        Remove
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.row-menu {
  display: inline-block;
}
.dots {
  width: 32px;
  height: 32px;
  border-radius: 9999px;
  border: 1px solid $c-border-grey;
  background: $upchieve-white;
  color: $c-default-grey;
  font-size: 15px;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
}
.dots.open {
  border-color: $c-information-blue;
}
.popover {
  position: fixed;
  z-index: 20;
  width: 230px;
  background: $upchieve-white;
  border: 1px solid $c-border-grey;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  padding: 6px;
  text-align: left;
  visibility: hidden;
}
.popover.placed {
  visibility: visible;
}
.item {
  display: block;
  width: 100%;
  border: none;
  background: none;
  border-radius: 4px;
  padding: 10px 12px;
  font-size: 14px;
  text-align: left;
  color: $c-soft-black;
  cursor: pointer;

  &:hover {
    background: $c-background-grey;
  }
}
.item.danger {
  color: $c-error-red;
}
</style>
