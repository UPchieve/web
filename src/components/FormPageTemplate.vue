<template>
  <div class="uc-column h-full">
    <div class="FormPageTemplate">
      <img class="logo-white" src="@/assets/p_logo_white.png" alt="UPchieve" />
      <img class="logo-teal" src="@/assets/header_logo.png" alt="UPchieve" />
      <main>
        <slot></slot>
      </main>
    </div>
    <nav class="FormFooter" aria-label="More information">
      <div>
        <router-link to="/contact">Contact Us</router-link>
      </div>
      <div>
        <router-link to="/legal" target="_blank">Legal Policy</router-link>
      </div>
      <div>
        <a href="https://upchieve.org/" target="_blank">Our Website</a>
      </div>
    </nav>
  </div>
</template>

<style lang="scss" scoped>
.FormPageTemplate {
  @include flex-container(column, flex-start, center);
  background-color: white;
  padding-top: 20px;
  height: 100%;

  main {
    @include flex-container(column, center, center);
    padding-bottom: 100px;
    width: 100%;
  }

  @include breakpoint-above('tiny') {
    background: url('~@/assets/onboarding_background.png') no-repeat center;
    background-color: blue;
    background-size: cover;
    justify-content: center;
    padding-top: 0;

    main {
      padding-bottom: 50px;
    }
  }
}

.logo-white {
  max-width: 155px;
  margin-bottom: 20px;
  margin-top: 20px;
  display: none;

  @include breakpoint-above('tiny') {
    display: block;
  }
}

.logo-teal {
  display: block;
  max-width: 95px;

  @include breakpoint-above('tiny') {
    display: none;
  }
}

.FormFooter {
  @include flex-container(column, space-around, center);

  background-color: #f6f6f6;
  border-top: 1px solid #cccccf;

  font-size: 12px;
  font-weight: 600;

  min-height: 100px;
  margin-top: auto;
  width: 100%;

  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;

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
