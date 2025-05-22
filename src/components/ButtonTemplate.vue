<template>
  <router-link
    v-if="routeTo"
    tag="button"
    :to="routeTo"
    class="ButtonTemplate"
    @click="$emit('click')"
  >
    <div class="ButtonTemplate-content">
      <slot />
    </div>
    <arrow-icon
      v-if="(primary || variant === 'primary') && showArrow"
      class="ButtonTemplate-icon arrow-icon"
    />
  </router-link>

  <button
    v-else
    @click="(event) => $emit('click', event)"
    :type="buttonType"
    class="ButtonTemplate"
  >
    <span class="ButtonTemplate-content">
      <slot />
    </span>
    <arrow-icon
      v-if="(primary || variant === 'primary') && showArrow"
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
    showArrow: Boolean,
    buttonType: {
      type: String,
      default: 'button',
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
  margin-top: 2px; // nudge down
  margin-left: 8px; // space between text
}

.arrow-icon {
  fill: currentColor;
  height: 16px;
  width: 16px;
}
</style>
