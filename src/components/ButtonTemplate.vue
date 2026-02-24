<template>
  <a
    class="ButtonTemplate"
    v-if="isExternalLink"
    :href="routeTo"
    @click="$emit('click')"
    :target="target"
  >
    <arrow-icon
      v-if="doShowArrow && isLeftArrow"
      class="ButtonTemplate-icon arrow-icon arrow-reversed"
    />
    <div class="ButtonTemplate-content">
      <slot />
    </div>
    <arrow-icon
      v-if="doShowArrow && !isLeftArrow"
      class="ButtonTemplate-icon arrow-icon"
    />
  </a>
  <router-link
    v-else-if="routeTo"
    tag="button"
    :to="routeTo"
    class="ButtonTemplate"
    @click="$emit('click')"
  >
    <arrow-icon
      v-if="doShowArrow && isLeftArrow"
      class="ButtonTemplate-icon arrow-icon arrow-reversed"
    />
    <div class="ButtonTemplate-content">
      <slot />
    </div>
    <arrow-icon
      v-if="doShowArrow && !isLeftArrow"
      class="ButtonTemplate-icon arrow-icon"
    />
  </router-link>

  <button
    v-else
    @click="(event) => $emit('click', event)"
    :type="buttonType"
    class="ButtonTemplate"
  >
    <arrow-icon
      v-if="doShowArrow && isLeftArrow"
      class="ButtonTemplate-icon arrow-icon arrow-reversed"
    />
    <span class="ButtonTemplate-content">
      <slot />
    </span>
    <arrow-icon
      v-if="doShowArrow && !isLeftArrow"
      class="ButtonTemplate-icon arrow-icon"
    />
  </button>
</template>

<script>
import ArrowIcon from '@/assets/arrow.svg'

export default {
  name: 'ButtonTemplate',
  components: { ArrowIcon },
  emits: ['click'],
  props: {
    primary: Boolean,
    variant: {
      type: String,
      default: 'secondary',
    },
    routeTo: String,
    target: String,
    showArrow: Boolean,
    arrowDirection: String, // 'right' | 'left'
    buttonType: {
      type: String,
      default: 'button',
    },
  },
  computed: {
    doShowArrow() {
      return (
        ((this.primary || this.variant?.includes('primary')) &&
          this.showArrow) ||
        this.showArrow
      )
    },
    isLeftArrow() {
      return this.doShowArrow && this.arrowDirection === 'left'
    },
    isExternalLink() {
      return typeof this.routeTo === 'string' && this.routeTo.startsWith('http')
    },
  },
}
</script>

<style lang="scss" scoped>
.ButtonTemplate {
  @include font-category('button');
  @include flex-container(row, center, center);

  background: none;
  border: none;
  margin: 0;
  padding: 8px 16px;
}

.ButtonTemplate-content {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ButtonTemplate-icon {
  margin-left: 8px; // space between text
}

.arrow-icon {
  fill: currentColor;
  height: 16px;
  width: 16px;
}

.arrow-reversed {
  transform: scaleX(-1);
  margin: 0;
  margin-right: 8px;
}
</style>
