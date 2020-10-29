<template>
  <div class="document">
    <iframe
      :src="
        `https://docs.google.com/viewer?url=https://upc-training-materials.s3.us-east-2.amazonaws.com/${resourceId}.pdf&embedded=true`
      "
      frameborder="0"
      class="document__iframe"
      allowfullscreen
      @load="loaded"
      :key="reloadAttempts"
      v-if="!isMaxAttempt"
    ></iframe>
    <p v-else>
      Sorry, we were unable to load the document. Please try refreshing the
      page.
    </p>
    <loader v-if="!isLoaded && !isMaxAttempt" overlay />
  </div>
</template>

<script>
import Loader from "@/components/Loader";

export default {
  name: "Document",
  props: {
    resourceId: String
  },
  components: { Loader },
  data() {
    return {
      isLoaded: false,
      isLoadedIntervalId: null,
      reloadAttempts: 0
    };
  },
  computed: {
    isMaxAttempt() {
      const maxAttempts = 20;
      return this.reloadAttempts > maxAttempts;
    }
  },
  mounted() {
    /**
     * Sometimes the iframe request responds with a '204' status code and doesn't
     * load anything for the user to see. Force the iframe to make a request for
     * the URL of the document to embed in the iframe every 2 seconds until it's loaded
     **/
    // @todo: backoff requests
    this.isLoadedIntervalId = setInterval(() => {
      if (this.isLoaded) clearInterval(this.isLoadedIntervalId);
      else this.forceRerender();
    }, 1000 * 2);
  },
  beforeDestroy() {
    clearInterval(this.isLoadedIntervalId);
  },
  methods: {
    loaded() {
      this.isLoaded = true;
    },
    forceRerender() {
      this.reloadAttempts += 1;
    }
  }
};
</script>

<style lang="scss" scoped>
.document {
  display: flex;
  flex-direction: column;
  position: relative;

  &__iframe {
    width: 100%;
    height: 400px;
    border: none;
  }
}
</style>
