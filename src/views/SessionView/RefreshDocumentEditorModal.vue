<template>
  <modal>
    <div class="refresh_doc">
      <header>
        <h1 class="refresh_doc__title">
          We were unable to load the document
        </h1>
      </header>

      <p class="refresh_doc__message">
         Please refresh the page.
      </p>
      <separator />
      <footer class="refresh_doc__footer">
        <div class="refresh_doc__buttons">
          <large-button
            class="refresh_doc__refresh-btn"
            @click.native="refreshDoc"
            >Refresh</large-button
          >
        </div>
      </footer>
    </div>
  </modal>
</template>

<script>
import LargeButton from '@/components/LargeButton'
import Modal from '@/components/Modal'
import Separator from '@/components/Separator'

export default {
  components: { LargeButton, Modal, Separator },
  methods: {
    async refreshDoc()   {
      window.location.reload()
    },
  }
}
</script>

<style lang="scss" scoped>
.refresh_doc {
  @include flex-container(column, normal, center);

  &__title {
    @include font-category('display-small');
  }

  &__message {
    @include font-category('body');
    margin: 0 0 2em;
    color: $c-secondary-grey;
  }

  &__buttons {
    margin-top: 1em;
  }

  &__refresh-btn {
    background-color: $c-success-green;
    color: $upchieve-white;

    &:hover {
      background: lighten($color: $c-success-green, $amount: 5%);
      border-color: transparent;
    }
  }
}
</style>
