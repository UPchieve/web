<template>
<div class="submit-question">
  <div class="basic-template">
    <content-header :headerTitle="headerTitle"></content-header>  
    <div class="basic-template__content">
      <div class="content-card">
        <div class="content-card__card">
          <slot></slot>
        </div>
      </div>
    </div>
  </div>
</div>
</template>


<script>
import ContentHeader from '../atoms/ContentHeader';

export default {
  components: {
    ContentHeader
  },
  props: {
    headerTitle: String
  },
  data() {
    return {
    }
  },
  methods: {
    goHome() {
      this.$router.push('/');
    }
  }
}
</script>


<style>
.submit-question {
  height: 100vh;
}

.basic-template {
  min-height: 100vh;
  background: var(--c-backdrop);
}
.basic-template__content {

}

.content-card {
  padding: 80px 0;
  width: 100%;
}
.content-card__card {
  background: #fff;
  width: 80%;
  max-width: 700px;
  padding: 40px;
  box-shadow: -4px 4px var(--c-shadow);
  margin: auto;
}


@media screen and (min-width: 700px) {
  .basic-template__header {
    justify-content: flex-start;
  }
  .basic-template__header h1 {
    font-size: 28px;
  }
}
</style>