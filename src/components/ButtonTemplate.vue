<template>
  <a
    class="ButtonTemplate"
    v-if="isExternalLink"
    :href="routeTo"
    @click="$emit('click')"
    :target="target"
    :class="{ bold: this.bold, 'ButtonTemplate--has-icon': hasIcon }"
  >
    <arrow-icon
      v-if="doShowArrow && isLeftArrow"
      class="ButtonTemplate-icon arrow-icon arrow-reversed"
    />
    <span v-if="hasIcon" class="ButtonTemplate-icon-slot">
      <slot name="icon" />
    </span>
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
    :class="{ bold: this.bold, 'ButtonTemplate--has-icon': hasIcon }"
    @click="$emit('click')"
  >
    <arrow-icon
      v-if="doShowArrow && isLeftArrow"
      class="ButtonTemplate-icon arrow-icon arrow-reversed"
    />
    <span v-if="hasIcon" class="ButtonTemplate-icon-slot">
      <slot name="icon" />
    </span>
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
    :class="{ bold: this.bold, 'ButtonTemplate--has-icon': hasIcon }"
  >
    <arrow-icon
      v-if="doShowArrow && isLeftArrow"
      class="ButtonTemplate-icon arrow-icon arrow-reversed"
    />
    <span v-if="hasIcon" class="ButtonTemplate-icon-slot">
      <slot name="icon" />
    </span>
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
    bold: {
      type: Boolean,
      default: false,
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
    hasIcon() {
      return !!this.$slots.icon
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

// Pill style with an inline icon. Activated automatically whenever a
// consumer fills `<template #icon>`. The button shrinks to its natural
// content width — no symmetric mirror padding, no `flex: 1` content
// stretching. Two design intents:
//
//  1. The icon "tucks" into the left curve. With `padding-left = pad`,
//     the icon's center lands ~1.5em from the left edge of the pill,
//     which is roughly the curve's center radius — visually flush, like
//     a decorative border element to the label.
//  2. The label sits flush after the icon with comfortable breathing on
//     the right (`padding-right = pad * 4`), so the curve on that side
//     doesn't crowd the text.
//
// In a wide / forced-width parent the inherited `justify-content: center`
// centers the icon-text group; the surrounding whitespace is wide enough
// that the icon-on-left no longer feels visually heavy. In an auto-width
// parent (the typical pill case) there's no extra space and the asymmetric
// padding produces the tucked-icon look.
//
// The selector is doubled (`.ButtonTemplate.ButtonTemplate--has-icon`) so
// it has 2 classes' worth of specificity — enough to beat single-class
// LargeButton variant rules like `.LargeButton-primary-blue` for the
// `padding` and `border-radius` overrides.
.ButtonTemplate.ButtonTemplate--has-icon {
  // Single knob. Padding, gap, and the icon's wrapper size all derive.
  --button-icon-size: 2.5em;
  --button-icon-pad: calc(var(--button-icon-size) * 0.1);

  // Exactly half the button's resolved height = a guaranteed pill at any
  // --button-icon-size. (A fixed value like `2em` happens to work today
  // because browsers clamp border-radius to half the smaller dimension,
  // but it stops looking pill-shaped if the icon grows past ~3em. Tying
  // it to the icon-size knob removes that hidden dependency.)
  border-radius: calc(var(--button-icon-size) / 2 + var(--button-icon-pad));
  padding: var(--button-icon-pad) calc(var(--button-icon-pad) * 4)
    var(--button-icon-pad) var(--button-icon-pad);
  // Wider than the structural pad so the colorful icon has visible
  // breathing room from the label.
  gap: calc(var(--button-icon-pad) * 2.5);
}

.ButtonTemplate-icon-slot {
  flex-shrink: 0;
  width: var(--button-icon-size);
  height: var(--button-icon-size);
  display: flex;

  // Whatever the consumer drops in (typically an SVG component) fills
  // the slot — so callers don't need to size the icon themselves.
  > * {
    width: 100%;
    height: 100%;
  }
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

.bold {
  font-weight: 500;
}
</style>
