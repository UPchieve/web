<!-- We are required to show this on whichever user flows are protected by reCAPTCHA -->
<template>
  <p class="caption">
    This site is protected by reCAPTCHA and the Google
    <a target="_blank" href="https://policies.google.com/privacy"
      >Privacy Policy</a
    >
    and
    <a target="_blank" href="https://policies.google.com/terms"
      >Terms of Service</a
    >
    apply.
  </p>
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
