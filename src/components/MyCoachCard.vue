<template>
  <div class="card-container">
    <div class="volunteer-card__icon"><coach-icon class="coach-icon" /></div>
    <div class="volunteer-card">
      <div class="volunteer-card__info">
        <h2 class="volunteer-card__name">
          {{ coach.firstName }}
        </h2>
        <div class="volunteer-card__info">
          <span class="volunteer-card__num-sessions">
            {{ coach.numSessions }}
            {{ coach.numSessions === 1 ? `session` : `sessions` }} together
          </span>
        </div>
      </div>
    </div>
    <div class="isFavorite">
      <favoriting-toggle
        :initialIsFavorite="coach.isFavorite"
        :volunteerName="coach.firstName"
        :volunteerId="coach.volunteerId"
        @change-favorited="handleFavoriteChange"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import FavoritingToggle from './FavoritingToggle.vue'
import CoachIcon from '@/assets/user_avatars/volunteer-icon.svg'

defineProps({
  coach: {
    type: Object,
    required: true,
  },
  handleFavoriteChange: {
    type: Function,
    required: true,
  },
})
</script>

<style lang="scss" scoped>
.card-container {
  padding: 16px;
  @include flex-container(row, flex-start, center);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border: solid 1px $c-border-grey;
  border-radius: 16px;
  background-color: #fff;
}
.volunteer-card {
  margin: 0 16px;

  &__name {
    font-size: 20px;
    color: $c-soft-black;
  }

  &__info {
    @include flex-container(column, center, flex-start);
  }

  &__vol-info {
    font-size: 14px;
    color: $c-secondary-grey;
    font-weight: 500;
  }

  &__num-sessions {
    font-size: 14px;
    color: $c-secondary-grey;
  }
}

.isFavorite {
  margin-left: auto;
  margin-right: 24px;
}

.coach-icon {
  height: 60px;
  width: 60px;
}
</style>
