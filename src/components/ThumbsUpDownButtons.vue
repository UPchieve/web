<template>
  <div class="thumbs-up-down-container">
    <button
      @click="onClick('up')"
      class="thumbs-btn up"
      :class="{ selected: isThumbsUpSelected }"
      data-testid="high-rating-btn"
    >
      <ThumbsUpIcon />
    </button>
    <button
      @click="onClick('down')"
      class="thumbs-btn down"
      :class="{ selected: isThumbsDownSelected }"
      data-testid="low-rating-btn"
    >
      <ThumbsDownIcon />
    </button>
  </div>
</template>

<script>
import ThumbsUpIcon from '@/assets/thumbs-up.svg'
import ThumbsDownIcon from '@/assets/thumbs-down.svg'
export default {
  components: { ThumbsDownIcon, ThumbsUpIcon },
  props: {
    onClickThumbsUp: {
      type: Function,
      required: false,
    },
    onClickThumbsDown: {
      type: Function,
      required: false,
    },
  },
  data() {
    return {
      selection: undefined, // or 'up' or 'down'
    }
  },
  computed: {
    isThumbsUpSelected() {
      return this.selection === 'up'
    },
    isThumbsDownSelected() {
      return this.selection === 'down'
    },
  },
  methods: {
    onClick(upOrDown) {
      this.selection = upOrDown
      if (upOrDown === 'up' && this.onClickThumbsUp) {
        this.onClickThumbsUp()
      } else if (upOrDown === 'down' && this.onClickThumbsDown) {
        this.onClickThumbsDown()
      }
    },
  },
}
</script>

<style lang="scss">
.thumbs-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;

  svg {
    width: 50px;
    height: 50px;
    margin: auto;
  }

  &:hover {
    transform: scale(1.1);
  }
}

.up {
  padding-bottom: 5px;
  padding-left: 5px;

  &.selected {
    &:hover {
      transform: none;
    }

    background-color: lighten($color: $c-success-green, $amount: 40%);
    svg {
      & path {
        fill: $c-success-green;
      }
    }
  }
}

.down {
  padding-top: 5px;
  padding-right: 5px;

  &.selected {
    &:hover {
      transform: none;
    }

    background-color: lighten($color: $c-error-red, $amount: 30%);
    svg {
      & path {
        fill: $c-error-red;
      }
    }
  }
}
</style>
