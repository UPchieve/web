<script lang="ts" setup>
import { ref } from 'vue'
import config from '../../config'
const props = defineProps(['message'])
</script>
<template>
  <div>
    <audio controls class="controls">
      <source
        type="audio/webm; codecs=opus"
        :src="`${config.serverRoot}/api/voice-messages/${props.message.contents}`"
      />
      <source
        type="audio/mp4;"
        :src="`${config.serverRoot}/api/voice-messages/${props.message.contents}`"
      />
    </audio>
  </div>
</template>

<style scoped>
.controls {
  max-width: 100%;
}
</style>
