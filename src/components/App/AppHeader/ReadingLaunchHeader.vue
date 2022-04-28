<template>
  <div class="header">
    <div class="header-message"><span>Introducing our new subject: READING!</span> Take the quiz by May 15th to help us launch to students.</div>
    <router-link to="/training" tag="button" class="header-button">Get Certified</router-link>
  </div>
</template>

<script>

export default {
  name: 'reading-launch-header',
}
</script>

<style lang="scss" scoped>

.header {
  @include header-child;
  color: $upchieve-white;
  display: flex;
  align-items: center;
  background-color: $c-information-blue;

  &-message {
    margin-left: auto;

    & span {
      font-weight: 500;
    }
  }

  &-button {
    margin-left: auto;
    color: $c-soft-black;
    background-color: $upchieve-white;
    border: none;
    border-radius: 20px;
    padding: 0.4em 1.2em;
    font-weight: 600;

    &:hover {
      background-color: darken($upchieve-white, 5%);
    }
  }
}
</style>


