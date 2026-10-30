<!-- We are required to show this on whichever user flows are protected by reCAPTCHA, since we hide the badge. -->
<template>
  <p class="caption">This site is protected by reCAPTCHA.</p>
</template>

<script>
export default {
  name: 'RecaptchaCaption',
}
</script>

<style lang="scss" scoped>
.caption {
  font-size: 12px;
  padding: 12px 12px 0 12px;
}
</style>
