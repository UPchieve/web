<template>
  <nav class="FormFooter" aria-label="More information">
    <div>
      <router-link to="/contact" target="_blank">Contact Us</router-link>
    </div>
    <div>
      <router-link to="/legal" target="_blank">Legal Policy</router-link>
    </div>
    <div>
      <a href="https://upchieve.org/" target="_blank">Our Website</a>
    </div>
  </nav>
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
