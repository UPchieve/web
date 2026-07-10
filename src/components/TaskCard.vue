<script lang="ts" setup>
import type { Component } from 'vue'
import RightCaretIcon from '@/assets/right-caret.svg'
import CheckIcon from '@/assets/check.svg'
import Card from '@/components/Card.vue'
import type { CardProps } from '@/components/Card.vue'

export type ActionListItem = {
  title: string
  subtitle?: string
  status: 'not-started' | 'in-progress' | 'complete' | 'error'
  onClick: () => void
  icon: Component
  estimatedTimeToCompleteInMinutes?: number
}

export type TaskCardProps = CardProps & {
  actions?: ActionListItem[]
  showEstimatedTime?: boolean
}
const props = defineProps<TaskCardProps>()
</script>

<template>
  <Card
    :title="props.title"
    :subtitle="props.subtitle"
    :dismissOptions="props.dismissOptions"
  >
    <template #icon>
      <slot name="icon" />
    </template>
    <template #heading-content>
      <slot name="heading-content" />
    </template>
    <template #content>
      <slot name="content" />
      <div class="actions-list">
        <div
          v-for="action in props.actions"
          :key="action.title"
          class="action"
          @click="action.onClick"
          type="button"
        >
          <div
            class="icon-container"
            :class="{
              'in-progress': action.status === 'in-progress',
              complete: action.status === 'complete',
              error: action.status === 'error',
            }"
          >
            <component
              v-if="action.status !== 'complete'"
              :is="action.icon"
              class="action-icon"
            />
            <CheckIcon v-else class="action-icon complete" />
          </div>
          <div
            class="action-content"
            :data-testid="`${action.title}-container`"
          >
            <div class="action-title" :data-testid="action.title">
              {{ action.title }}
            </div>
            <div class="action-subtitle">
              {{ action.subtitle }}
            </div>
          </div>
          <div
            class="action-time"
            v-if="
              props.showEstimatedTime && action.estimatedTimeToCompleteInMinutes
            "
          >
            {{ action.estimatedTimeToCompleteInMinutes }}
            {{ action.estimatedTimeToCompleteInMinutes === 1 ? 'min' : 'mins' }}
          </div>
          <RightCaretIcon class="caret-icon" />
        </div>
      </div>
    </template>
  </Card>
</template>

<style lang="scss" scoped>
.actions-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-left: 5%;
  margin-right: 5%;
  width: 90%;

  .action {
    display: grid;
    grid-template-columns: [icon] 1fr [content] 4fr max-content [caret-icon];
    grid-template-rows: [main] 1fr;
    align-items: center;
    column-gap: 5%;

    .action-content {
      grid-row: main;
      grid-column: content;
      display: flex;
      flex-direction: column;
    }

    .action-title {
      @include font-category('heading');
    }

    .action-subtitle {
      @include font-category('body');
      color: $c-secondary-grey;
    }

    .icon-container {
      grid-row: main;
      grid-column: icon;
      height: 52px;
      width: 52px;
      border: 2px solid $c-border-grey;
      border-radius: 50%;
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      justify-self: center;
      align-self: center;
    }

    .action-icon {
      width: 24px;
      height: 24px;
    }

    .complete {
      border-color: $c-success-green;
    }

    .in-progress {
      border-color: $c-warning-orange;
    }

    .error {
      border-color: $c-error-red;
    }
    .action-time {
      grid-row: main;
      font-size: 14px;
      color: $upchieve-white;
      background-color: $uc-primary-blue;
      padding: 0 6px;
      border-radius: 4px;
    }

    .caret-icon {
      grid-row: main;
      grid-column: caret-icon;
      margin-left: 5%;
    }
  }
}
</style>
