<template>
  <div class="document">
    <iframe
      class="document__iframe"
      ref="docIframe"
      allowFullScreen
      :src="`https://docs.google.com/document/d/${resourceId}/preview`"
    ></iframe>
    <div class="document__toolbar">
      <div class="document__fullscreen" @click="enterFullScreen">
        <fullscreen-icon />
      </div>
    </div>
  </div>
</template>

<script>
import FullscreenIcon from "@/assets/fullscreen.svg";

export default {
  components: {
    FullscreenIcon
  },
  props: {
    resourceId: String
  },
  methods: {
    enterFullScreen() {
      this.$refs.docIframe.requestFullscreen();
    }
  }
};
</script>

<style lang="scss" scoped>
.document {
  display: flex;
  flex-direction: column;

  &__iframe {
    width: 100%;
    height: 400px;
    border: none;
  }

  &__toolbar {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    background: #323232;
  }

  &__fullscreen {
    width: 29px;
    height: 29px;
    padding: 7px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    cursor: pointer;

    svg {
      fill: #9a9a9a;
    }

    &:hover {
      svg {
        fill: #fff;
      }
    }
  }
}
</style>
