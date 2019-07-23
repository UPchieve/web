<template>
  <div class="FormFooter">
    <router-link to="/contact" tag="div">
      <a class="contact icon" target="_blank">Contact Us</a>
    </router-link>

    <router-link to="/legal" tag="div">
      <a class="privacy icon" target="_blank">Legal Policy</a>
    </router-link>

    <div>
      <a href="https://upchieve.org/" target="_blank">Our Website</a>
    </div>
  </div>
</template>

<script>
export default {}
</script>

<style lang="scss" scoped>
.FormFooter {
  @include flex-container(column, space-around, center);

  background-color: #f6f6f6;
  border-top: 1px solid #cccccf;

  font-size: 12px;
  font-weight: 600;

  min-height: 100px;
  margin-top: auto;

  a {
    color: #73737a;
    text-transform: uppercase;
  }

  @include breakpoint-above('tiny') {
    flex-direction: row;
    min-height: 50px;
  }
}
</style>
