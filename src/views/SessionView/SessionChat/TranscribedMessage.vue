<script setup lang="ts">
import SpeakerFilledIcon from '@/assets/voice_message_icons/speaker-filled.svg'

const props = defineProps<{
  message: { [key: string]: any; contents: string }
}>()
</script>

<template>
  <div class="live-caption">
    <div class="live-caption-contents">
      <speaker-filled-icon class="icon" />
      <span class="message">{{ props.message.contents }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.live-caption {
  max-width: 80%;
  display: inline;

  .live-caption-contents {
    max-width: 100%;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding-right: 4px;
  }

  .message {
    vertical-align: top;
  }

  .icon {
    flex-shrink: 0;
  }

  .icon {
    filter: invert(0.7);
  }

  .live-caption-name {
    font-weight: 600;
  }
}
</style>
