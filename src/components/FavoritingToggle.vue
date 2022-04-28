<template>
  <div>
    <heart-icon :class="favoritedStatus.class" v-on:click="toggleFavoritedStatus"/>
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
import HeartIcon from '@/assets/heart.svg'
import VolunteerUnfavoritingModal from '@/views/VolunteerUnfavoritingModal'
import FavoritedListFullModal from '@/views/FavoritedListFullModal'
import NetworkService from '@/services/NetworkService'

export default {
  name: 'favoriting-toggle',
  components: { HeartIcon, VolunteerUnfavoritingModal, FavoritedListFullModal },
  props: {
    initialIsFavorite: {
      type: Boolean,
      default: false
    },
    volunteerName: {
      type: String,
      default: ''
    },
    volunteerId: {
      type: String,
      required: true,
      default: '',
    },
    sessionId: {
      type: String,
      default: ''
    }
  },
  created() {
    this.isFavorite = this.initialIsFavorite
  },
  watch: {
    initialIsFavorite(newIsFavorite) {
      this.isFavorite = newIsFavorite
    }
  },
  data() {
    return {
      showVolunteerUnfavoritingModal: false,
      showFavoritedListFullModal: false,
      isFavorite: false
    }
  },
  methods: {
    async unfavorite(value) {
      await this.setIsFavorite(value)
      this.showVolunteerUnfavoritingModal = false
    },
    async setIsFavorite(value) {
     try {
        const response = await NetworkService.updateFavoriteVolunteerStatus(this.volunteerId, { isFavorite: value })
        this.isFavorite = response.body.isFavorite
        this.$emit('change-favorited', this.volunteerId, this.isFavorite)
      } catch (error) {
        if (error.body.success === false)
          this.showFavoritedListFullModal = true
        else  
         this.$emit('error-favoriting', error.body.err)
     } 
    },
    async toggleFavoritedStatus(){
      if(this.isFavorite) {
        this.toggleVolunteerUnfavoritingModal()
        return
      }
      const { 
        body: { remaining }
      } = await NetworkService.getRemainingFavoriteVolunteers()
      if (remaining > 0)
        this.setIsFavorite(true)
      else
        this.toggleFavoritedListFullModal()
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
        class: 'heart-icon',
      }   

    if(this.isFavorite){
      status.class += '-favorited'
    }
    else {
      status.class += '-unfavorited'
    }
    return status
  },   
}
}
</script>

<style lang="scss">
.heart-icon {  
  &-favorited {
    fill: $c-shadow-warn;
    transition: all 0.3s ease-in-out;

    & path {
    stroke: $c-shadow-warn;
    } 

    &:active {
    transform: scale(0.9);
    }  

    &:hover {
      cursor: pointer;
    }
  
    &:hover path{
      stroke: $c-active-heart;
      fill: $c-active-heart;        
    }
  }

  &-unfavorited {
    transition: all 0.3s ease-in-out;

    &:hover path{
      stroke: $c-active-heart;
    }

    &:active {
      transform: scale(0.9);
    }
  } 
}
</style>