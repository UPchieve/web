<template>
  <div>
    <button
      v-if="variant === 'badge'"
      type="button"
      class="favorite-badge"
      :class="{ 'favorite-badge--active': isFavorite }"
      :aria-pressed="isFavorite"
      :aria-label="`${isFavorite ? 'Unfavorite' : 'Favorite'} ${volunteerName}`"
      data-testid="favorite-badge"
      @click="toggleFavoritedStatus"
    >
      <star-icon-filled aria-hidden="true" />
    </button>
    <star-icon
      v-else
      :class="favoritedStatus.class"
      v-on:click="toggleFavoritedStatus"
    />
    <favorited-list-full-modal
      v-if="showFavoritedListFullModal"
      :closeModal="toggleFavoritedListFullModal"
    />
  </div>
</template>

<script>
import StarIcon from '@/assets/icons/star_icon.svg'
import StarIconFilled from '@/assets/icons/star_icon_filled.svg'
import FavoritedListFullModal from '@/views/FavoritedListFullModal.vue'
import NetworkService from '@/services/NetworkService'

export default {
  name: 'favoriting-toggle',
  components: {
    StarIcon,
    StarIconFilled,
    FavoritedListFullModal,
  },
  props: {
    variant: {
      type: String,
      default: 'default',
      validator: (value) => ['default', 'badge'].includes(value),
    },
    initialIsFavorite: {
      type: Boolean,
      default: false,
    },
    volunteerName: {
      type: String,
      default: '',
    },
    volunteerId: {
      type: String,
      required: true,
      default: '',
    },
    sessionId: {
      type: String,
      default: '',
    },
  },
  emits: ['change-favorited', 'change-favoriting'],
  created() {
    this.isFavorite = this.initialIsFavorite
  },
  watch: {
    initialIsFavorite(newIsFavorite) {
      this.isFavorite = newIsFavorite
    },
  },
  data() {
    return {
      showFavoritedListFullModal: false,
      isFavorite: false,
    }
  },
  methods: {
    async setIsFavorite(value) {
      try {
        const response = await NetworkService.updateFavoriteVolunteerStatus(
          this.volunteerId,
          { isFavorite: value }
        )
        this.isFavorite = response.data.isFavorite
        this.$emit('change-favorited', this.volunteerId, this.isFavorite)
      } catch (error) {
        if (error.response.data.success === false)
          this.showFavoritedListFullModal = true
        else this.$emit('error-favoriting', error.response.data.err)
      }
    },
    async toggleFavoritedStatus() {
      if (this.isFavorite) {
        await this.setIsFavorite(false)
        return
      }
      const {
        data: { remaining },
      } = await NetworkService.getRemainingFavoriteVolunteers()
      if (remaining > 0) this.setIsFavorite(true)
      else this.toggleFavoritedListFullModal()
    },
    toggleFavoritedListFullModal() {
      this.showFavoritedListFullModal = !this.showFavoritedListFullModal
    },
  },
  computed: {
    favoritedStatus() {
      const status = {
        class: 'star-icon',
      }

      if (this.isFavorite) {
        status.class += '-favorited'
      } else {
        status.class += '-unfavorited'
      }
      return status
    },
  },
}
</script>

<style lang="scss">
.star-icon {
  &-favorited {
    cursor: pointer;
    fill: $c-success-green;
    transition: all 0.3s ease-in-out;

    & path {
      stroke: $c-success-green;
      fill: $c-success-green;
    }

    &:active {
      transform: scale(0.9);
    }

    &:hover path {
      stroke: $c-success-green;
      fill: $c-success-green;
    }
  }

  &-unfavorited {
    cursor: pointer;
    transition: all 0.3s ease-in-out;

    &:hover path {
      stroke: $c-success-green;
    }

    &:active {
      transform: scale(0.9);
    }
  }
}

.favorite-badge {
  display: flex;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  transition: transform 0.15s ease-in-out;
  color: #fff;

  svg {
    width: 100%;
    height: 100%;
    overflow: visible;
    stroke: $c-soft-black;
    stroke-width: 0.5;
    stroke-linejoin: round;
  }

  &--active {
    color: $c-college;

    svg {
      filter: drop-shadow(1.5px 1.5px 0 $c-soft-black);
    }
  }

  &:active {
    transform: scale(0.9);
  }

  &:focus-visible {
    outline: 2px solid $c-information-blue;
    outline-offset: 2px;
    border-radius: 50%;
  }
}
</style>
