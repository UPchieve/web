<script setup lang="ts">
import { computed } from 'vue'
import UserPlusIcon from '@/assets/user-plus.svg'
import AwardIcon from '@/assets/icons/resources/award.svg'
import CalendarIcon from '@/assets/icons/resources/calendar.svg'
import DocumentIcon from '@/assets/icons/resources/document.svg'
import MegaphoneIcon from '@/assets/icons/resources/megaphone.svg'
import PaletteIcon from '@/assets/icons/resources/palette.svg'
import PrinterIcon from '@/assets/icons/resources/printer.svg'
import SchoolIcon from '@/assets/icons/resources/school.svg'
import ShareIcon from '@/assets/icons/resources/share.svg'
import ShieldCheckIcon from '@/assets/icons/resources/shield-check.svg'

const ICONS = {
  award: AwardIcon,
  calendar: CalendarIcon,
  document: DocumentIcon,
  megaphone: MegaphoneIcon,
  palette: PaletteIcon,
  printer: PrinterIcon,
  school: SchoolIcon,
  share: ShareIcon,
  'shield-check': ShieldCheckIcon,
  'user-plus': UserPlusIcon,
}

const props = defineProps<{ name: string }>()
const icon = computed(() =>
  Object.hasOwn(ICONS, props.name)
    ? ICONS[props.name as keyof typeof ICONS]
    : undefined
)
</script>

<template>
  <component
    :is="icon"
    v-if="icon"
    class="resource-icon"
    aria-hidden="true"
    data-testid="resource-icon"
  />
</template>

<style scoped lang="scss">
.resource-icon {
  stroke-width: 1.8;
}
</style>
