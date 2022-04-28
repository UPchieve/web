<template>
  <div class="module" :class="statusClass">
    <div class="module__cell" @click="toggleMaterials">
      <check-mark class="module__icon" :checked="isCompleted" />
      <div class="module__left">
        <div class="module__name">{{ module.name }}</div>
        <div class="module__status">{{ statusText }}</div>
      </div>
      <div class="module__right">
        <right-caret
          class="module__caret"
          :class="{ 'module__caret--open': showMaterials }"
        />
      </div>
    </div>

    <div class="module__materials" v-if="showMaterials">
      <material
        v-for="material in module.materials"
        :key="material.materialKey"
        :material="material"
        :isOpen="material.materialKey === openMaterial"
        v-on:material-completed="$emit('material-completed', $event)"
        v-on:material-toggled="toggleMaterial"
      />
    </div>
  </div>
</template>

<script>
import Material from './Material'
import CheckMark from '@/components/CheckMark'
import RightCaret from '@/assets/right-caret.svg'

export default {
  components: {
    Material,
    CheckMark,
    RightCaret
  },
  props: {
    module: Object
  },
  data() {
    return {
      showMaterials: false,
      openMaterial: ''
    }
  },
  computed: {
    isCompleted() {
      return this.module.materials.every(
        mat => mat.isCompleted || !mat.isRequired
      )
    },
    isStarted() {
      return this.module.materials.some(mat => mat.isCompleted)
    },
    statusClass() {
      if (this.isCompleted) return 'module--completed'
      else if (this.isStarted) return 'module--started'
      return 'module--not-started'
    },
    statusText() {
      if (this.isCompleted) return 'Completed'
      else if (this.isStarted) return 'In progress'
      return 'Not started'
    }
  },
  methods: {
    toggleMaterials() {
      this.showMaterials = !this.showMaterials
    },
    toggleMaterial(materialKey) {
      if (materialKey === this.openMaterial) this.openMaterial = ''
      else this.openMaterial = materialKey
    }
  }
}
</script>

<style lang="scss" scoped>
.module {
  color: $c-soft-black;
  margin-top: -1px;

  &__cell {
    display: flex;
    flex-direction: row;
    border: solid 1px $c-border-grey;
    padding: 10px 30px;
    align-items: center;
    justify-content: flex-start;
    cursor: pointer;
  }

  &__icon {
    flex-shrink: 0;
  }

  &__left {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    margin-left: 20px;

    // See: https://css-tricks.com/flexbox-truncated-text/
    min-width: 0;
  }

  &__name {
    font-size: 18px;
    margin-bottom: -3px;
    text-align: left;
    width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-right: 10px;
  }

  &__status {
    color: $c-secondary-grey;
  }

  &__right {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__caret {
    &--open {
      transform: rotate(90deg);
    }
  }

  &__materials {
    margin-left: 30px;

    @include breakpoint-above('large') {
      margin-left: 100px;
    }
  }

  &--completed {
    .module__status {
      color: $c-success-green;
    }
  }

  &--started {
    .module__status {
      color: $c-warning-orange;
    }
  }
}
</style>
