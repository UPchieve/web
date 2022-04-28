<template>
  <modal :closeModal="closeModal" :useDefaultPadding="false">
    <div>
      <header>
        <heavy-cross-icon class="upc-modal-close-icon" @click="closeModal" />
        <h1 class="title">
          We’re giving away a $25 gift card and UPchieve t-shirt!
        </h1>
      </header>

      <section class="container">
        <h2 class="subtitle">
          Help us spread the word about UPchieve and be entered into a raffle
          for our first social media giveaway!
        </h2>
        <div class="instructions">
          <h3 class="instructions-header">Here’s how to participate:</h3>
          <ol class="steps">
            <li class="steps-step">
              Follow
              <a
                target="_blank"
                rel="noopener noreferrer"
                href="https://www.instagram.com/upchieve/"
                >@UPchieve</a
              >
              on Instagram and like
              <a
                target="_blank"
                rel="noopener noreferrer"
                href="https://www.instagram.com/p/CMz1bN3jlFb/"
                >this post</a
              >.
            </li>
            <li class="steps-step">
              Share the post on Instagram using the hashtag #UPchieveYourDreams.
            </li>
            <li class="steps-step">
              Email
              <a href="mailto:students@upchieve.org">students@upchieve.org</a>
              with your IG handle and a screenshot of your repost.
            </li>
          </ol>
        </div>
        <p class="additional-info">
          That’s it! A winner will be selected on <b>Monday, March 29th.</b>
        </p>

        <large-button
          class="gift-card-giveaway-btn"
          primary
          :showArrow="false"
          @click.native="closeModal"
        >
          Good luck!
        </large-button>
      </section>
    </div>
  </modal>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import Modal from '@/components/Modal'
import LargeButton from '@/components/LargeButton'
import HeavyCrossIcon from '@/assets/heavy-cross.svg'

export default {
  name: 'volunteer-dashboard',
  components: { Modal, LargeButton, HeavyCrossIcon },
  props: {
    closeModal: { type: Function, required: true }
  },
  computed: {
    ...mapState({
      user: state => state.user.user
    }),
    ...mapGetters({ mobileMode: 'app/mobileMode' })
  }
}
</script>

<style lang="scss" scoped>
header {
  background-image: linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.1)),
    url('~@/assets/confetti.png');
  height: 220px;
  padding-top: 1em;
  position: relative;
}

.container {
  width: 90%;
  margin: 0 auto;

  @include breakpoint-above('medium') {
    width: 80%;
  }
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
  margin-top: 1.4em;
}

.additional-info {
  text-align: left;
}

.gift-card-giveaway-btn {
  border: 1px solid black;
  margin: 20px auto;
  border: none;
}

.instructions {
  margin: 1.4em auto;

  &-header {
    @include font-category('heading');
    text-align: left;
  }
}

.steps {
  text-align: left;

  &-step {
    margin-bottom: 0.3em;
  }
}
</style>
