<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import NetworkService from '@/services/NetworkService'
import { useStore } from 'vuex'
import LoggerService from '@/services/LoggerService'

const EXPERIENCE_LEVELS = [
  'No prior experience',
  '0-1 years',
  '1-2 years',
  '2-5 years',
  '5+ years',
]
const SKILLS = [
  { key: 'tutoring', displayName: 'Tutoring' },
  { key: 'collegeCounseling', displayName: 'College Counseling' },
  { key: 'mentoring', displayName: 'Mentoring' },
]

type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number]
type Skill = (typeof SKILLS)[number]['key']
type SkillExperienceMap = Record<Skill, ExperienceLevel | null>

const store = useStore()
const userExperience = computed(
  () =>
    store.state.user.user.experience ?? {
      [SKILLS[0].key]: null,
      [SKILLS[1].key]: null,
      [SKILLS[2].key]: null,
    }
)
const selections = ref<SkillExperienceMap>(userExperience.value)
const experience = ref<SkillExperienceMap>(userExperience.value)

const emit = defineEmits(['error', 'success'])
async function updateSelection(skill: Skill, level: ExperienceLevel) {
  // We will revert to the old experience data if we get an error while trying to
  // save the new selections.
  selections.value = {
    ...selections.value,
    [skill]: level,
  }
  try {
    await NetworkService.addBackgroundInfo({
      experience: selections.value,
    })
    experience.value = selections.value
    store.dispatch('user/addToUser', {
      experience: experience.value,
    })
    emit('success')
  } catch (err) {
    emit('error')
    LoggerService.noticeError('Failed to save volunteer experience data', {
      err,
    })
    selections.value = experience.value
  }
}

// Show a scroll hint when there's horizontal overflow.
// On mobile web, lots of times the scroll bar is hidden until the user is
// actively scrolling. So this makes it clearer that they can scroll
const tableContainer = ref<HTMLElement | null>(null)
const showScrollHint = ref<boolean>(false)
function updateScrollHint() {
  if (tableContainer.value) {
    showScrollHint.value =
      tableContainer.value?.scrollWidth > tableContainer.value?.clientWidth
  }
}
onMounted(() => window.addEventListener('resize', updateScrollHint))

onBeforeUnmount(() => window.removeEventListener('resize', updateScrollHint))
</script>

<template>
  <div class="main-container">
    <div class="table-container" ref="tableContainer">
      <table>
        <thead>
          <th />
          <th v-for="level in EXPERIENCE_LEVELS" :key="level">{{ level }}</th>
        </thead>
        <tbody>
          <tr v-for="skill in SKILLS" :key="skill.key">
            <td>{{ skill.displayName }}</td>
            <td
              v-for="level in EXPERIENCE_LEVELS"
              :key="`${skill.key}-${level}`"
            >
              <input
                type="radio"
                class="radio"
                value="level"
                @input="() => updateSelection(skill.key, level)"
                :checked="selections[skill.key] === level"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="scroll-hint" v-if="showScrollHint">← Swipe to see more →</div>
  </div>
</template>
<script setup lang="ts"></script>

<style lang="scss" scoped>
.table-container {
  overflow-x: auto;
}

th {
  padding: 8px 22px 15px 22px;
  text-align: center;
  vertical-align: middle;
  @include font-category('body');
}

td {
  text-align: center;
  vertical-align: middle;
  padding: 8px;
}

tr:nth-child(even) {
  background: #f1f8fc;
}

tr:nth-child(odd) {
  background: #e5f2fc;
}

.scroll-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
}
</style>
