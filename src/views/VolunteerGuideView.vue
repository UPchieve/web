<template>
  <div class="volunteer-guide">
    <div class="volunteer-guide__header">Coach Guide</div>

    <div class="volunteer-guide__section">
      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
    </div>

    <div class="volunteer-guide__section">
      Neque aliquam vestibulum morbi blandit. Nisi vitae suscipit tellus mauris a diam maecenas sed enim. Urna neque viverra justo nec ultrices dui sapien eget. Aenean euismod elementum nisi quis eleifend quam adipiscing vitae proin. Eget nullam non nisi est. Amet porttitor eget dolor morbi non arcu.
    </div>

    <div class="volunteer-guide__section">
      Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Turpis massa sed elementum tempus egestas sed sed risus pretium.
    </div>
  </div>
</template>

<script>
export default {
  name: "volunteer-guide"
};
</script>

<style lang="scss" scoped>
.volunteer-guide {
  border-radius: 8px;
  background: white;
  margin: 40px;
  padding: 40px;
  
  &__header {
    color: #343440;
    font-size: 24px;
    font-weight: 500;
    text-align: left;
  }

  &__section {
    text-align: left;
    margin: 40px 0;
    font-size: 16px;
  }
}
</style>
