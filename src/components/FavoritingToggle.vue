<template>
  <div>
    <star-icon
      :class="favoritedStatus.class"
      v-on:click="toggleFavoritedStatus"
    />
    <volunteer-unfavoriting-modal
      v-if="showVolunteerUnfavoritingModal"
      :closeModal="toggleVolunteerUnfavoritingModal"
      :volunteerName="volunteerName"
      @unfavorite="unfavorite"
    />
    <favorited-list-full-modal
      v-if="showFavoritedListFullModal"
      :closeModal="toggleFavoritedListFullModal"
    />
  </div>
</template>

<script>
import StarIcon from '@/assets/icons/star_icon.svg'
import VolunteerUnfavoritingModal from '@/views/VolunteerUnfavoritingModal.vue'
import FavoritedListFullModal from '@/views/FavoritedListFullModal.vue'
import NetworkService from '@/services/NetworkService'

export default {
  name: 'favoriting-toggle',
  components: { StarIcon, VolunteerUnfavoritingModal, FavoritedListFullModal },
  props: {
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
      showVolunteerUnfavoritingModal: false,
      showFavoritedListFullModal: false,
      isFavorite: false,
    }
  },
  methods: {
    async unfavorite(value) {
      await this.setIsFavorite(value)
      this.showVolunteerUnfavoritingModal = false
    },
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
        this.toggleVolunteerUnfavoritingModal()
        return
      }
      const {
        data: { remaining },
      } = await NetworkService.getRemainingFavoriteVolunteers()
      if (remaining > 0) this.setIsFavorite(true)
      else this.toggleFavoritedListFullModal()
    },
    toggleVolunteerUnfavoritingModal() {
      this.showVolunteerUnfavoritingModal = !this.showVolunteerUnfavoritingModal
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
</style>
