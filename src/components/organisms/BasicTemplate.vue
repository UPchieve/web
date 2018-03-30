<template>
<div class="submit-question">
  <div class="basic-template">
    <div class="basic-template__header">
      <h1>{{ headerTitle }}</h1>
    </div>
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
export default {
  components: {
    
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

/*
* @notes
* [1] Refactoring candidate: this shoudln't be done, but I had to do it since 
*     Bootstap interferes with this :/
*/
.basic-template {
  min-height: 100vh;
  background: var(--c-backdrop);
}
.basic-template__header {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  padding: 20px;
  box-shadow: 0 4px var(--c-shadow-header);
}
.basic-template__header h1 { /* [1] */
  font-size: 20px;
  margin: 0;
  font-weight: bold;
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