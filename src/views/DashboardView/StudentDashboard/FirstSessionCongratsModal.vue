<template>
  <modal :closeModal="closeModal" :useDefaultPadding="false">
    <div>
      <header>
        <heavy-cross-icon class="upc-modal-close-icon" @click="closeModal" />
        <h1 class="title">Congrats on your first session!</h1>
      </header>

      <p class="subtitle">
        Did you know UPchieve can help your friends level up too?
      </p>

      <p class="additional-info">
        When you refer friends to UPchieve, they skip the wait list AND you can
        earn cool rewards!
      </p>

      <large-button class="refer-friends-btn" routeTo="/refer-friends" primary>
        Tell me more!
      </large-button>
    </div>
  </modal>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import Modal from '@/components/Modal'
import LargeButton from '@/components/LargeButton'
import HeavyCrossIcon from '@/assets/heavy-cross.svg'

export default {
  name: 'FirstSessionCongratsModal',
  components: { Modal, LargeButton, HeavyCrossIcon },
  props: {
    closeModal: { type: Function, required: true }
  },
  computed: {
    ...mapState({
      user: state => state.user.user
    }),
    ...mapGetters({ mobileMode: 'app/mobileMode' })
  },
  mounted() {
    window.localStorage.setItem('viewedFirstSessionCongratsModal', true)
  }
}
</script>

<style lang="scss" scoped>
header {
  background-image: url('~@/assets/confetti.png');
  background-size: stretch;
  height: 250px;
  padding-top: 1em;
  position: relative;
}

.upc-modal-close-icon {
  margin-left: auto;
  margin-right: 1em;
  font-weight: 600;
  display: block;
  align-self: flex-start;
  flex-basis: 100%;
}

.title {
  @include font-category('display-large');
  width: 80%;
  font-weight: 700;
  text-align: center;
  color: #fff;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translateX(-50%) translateY(-50%);
}

.subtitle {
  @include font-category('display-small');
  text-align: center;
  width: 70%;
  margin: 1em auto;
}

.additional-info {
  @include font-category('body');
  text-align: center;
  width: 80%;
  margin: 0 auto;
}

.refer-friends-btn {
  background-color: $c-success-green;
  border-color: transparent;
  color: white;
  margin: 20px auto;
  border: none;
}
</style>
