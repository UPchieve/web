<script lang="ts" setup>
import type { Component } from 'vue'
import RightCaretIcon from '@/assets/right-caret.svg'
import CheckIcon from '@/assets/check.svg'

export type ActionListItem = {
  title: string
  subtitle?: string
  status: 'not-started' | 'in-progress' | 'complete'
  onClick: Function
  icon: Component
}
const props = defineProps<{
  title: string
  subtitle: string
  actions?: ActionListItem[]
}>()
</script>

<template>
  <div class="card-main">
    <slot name="icon" />
    <div class="heading-container">
      <div class="title">{{ props.title }}</div>
      <div v-if="props.subtitle" class="subtitle">{{ props.subtitle }}</div>
    </div>
    <slot name="content" />
    <div v-if="props.actions?.length" class="actions-list">
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
          }"
        >
          <component
            v-if="action.status !== 'complete'"
            :is="action.icon"
            class="action-icon"
          />
          <CheckIcon v-else class="action-icon complete" />
        </div>
        <div class="action-content">
          <div class="action-title">{{ action.title }}</div>
          <div class="action-subtitle">{{ action.subtitle }}</div>
        </div>
        <RightCaretIcon class="caret-icon" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.card-main {
  background: #fff;
  border-radius: 8px;
  padding: 40px 0 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.heading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-bottom: 16px;
  gap: 8px;
  width: 90%;

  .title {
    @include font-category('display-small');
    text-align: center;
    width: 80%;
  }

  .subtitle {
    @include font-category('body');
    color: $c-secondary-grey;
    text-align: center;
  }
}

.actions-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-left: 5%;
  margin-right: 5%;
  width: 90%;

  .action {
    display: grid;
    grid-template-columns: [icon] 1fr [content] 4fr [caret-icon] 1fr;
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
      height: 60px;
      width: 60px;
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
      width: 30px;
      height: 30px;
    }

    .complete {
      border-color: $c-success-green;
    }

    .in-progress {
      border-color: $c-warning-orange;
    }

    .caret-icon {
      grid-row: main;
      grid-column: caret-icon;
      margin-left: 5%;
    }
  }
}
</style>
