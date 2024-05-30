<template>
  <updog-paws-up-right v-if="isFlipped" />
  <updog-paws-up-left v-else />
</template>

<script>
import UpdogPawsUpLeft from '@/assets/updog-paws-up-left.svg'
import UpdogPawsUpRight from '@/assets/updog-paws-up-right.svg'

export default {
  name: 'UpdogLoader',
  components: {
    UpdogPawsUpLeft,
    UpdogPawsUpRight,
  },
  data() {
    return {
      isFlipped: false,
      intervalId: null,
    }
  },
  mounted() {
    this.intervalId = setInterval(() => {
      // We could flip the image by adding a class to the one of the images,
      // but the "UP" on UPdog gets flipped to "PU". That's why
      // we use two images flip horizontally
      this.flipImage()
    }, 500)
  },
  beforeUnmount() {
    clearInterval(this.intervalId)
  },
  methods: {
    flipImage() {
      this.isFlipped = !this.isFlipped
    },
  },
}
</script>
