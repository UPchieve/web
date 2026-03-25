<template>
  <span
    class="link-label"
    :class="{
      [color]: color,
    }"
    ><a :href="url" :target="target">{{ text }}</a
    ><ArrowIcon class="arrow-icon" v-if="showArrow"
  /></span>
</template>

<script setup lang="ts">
import ArrowIcon from '@/assets/arrow.svg'

const {
  url,
  text,
  showArrow = false,
  target = '_blank',
  color = 'green',
} = defineProps<{
  url: string
  text: string
  showArrow: boolean
  target: string
  color: 'green' | 'red' | 'blue'
}>()
</script>

<style lang="scss" scoped>
.link-label {
  white-space: nowrap;
}

svg {
  width: 24px;
  padding-left: 7px;
}

.red {
  a {
    color: $c-error-red;

    svg {
      fill: $c-error-red;
    }
    &:hover {
      color: darken($color: $c-error-red, $amount: 5%);
      svg {
        fill: darken($color: $c-error-red, $amount: 5%);
      }
    }
  }
  svg {
    fill: $c-error-red;
  }
}

.green {
  a {
    color: $c-success-green;

    &:hover {
      color: darken($color: $c-success-green, $amount: 5%);

      svg {
        fill: darken($color: $c-success-green, $amount: 5%);
      }
    }
  }
  svg {
    fill: $c-success-green;
  }
}

.blue {
  a {
    color: $c-information-blue;

    &:hover {
      color: darken($color: $c-information-blue, $amount: 5%);

      svg {
        fill: darken($color: $c-information-blue, $amount: 5%);
      }
    }
  }
  svg {
    fill: $c-information-blue;
  }
}
</style>
