<template>
  <div class="content-header">
    <h1>{{ headerTitle }}</h1>
  </div>
</template>


<script>
export default {
  props: {
    headerTitle: {
      type: String,
      default: '',
    },
  },
};
</script>


<style>
/**
 * @todo {1} Refactoring candidate: this shoudln't be done, but I had to do it
 *           since Bootstap interferes with this :/
 */
.content-header {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  padding: 20px;
  box-shadow: 0 4px var(--c-shadow-header);
}
.content-header h1 { /*{1}*/
  font-size: 20px;
  margin: 0;
  font-weight: bold;
}

@media screen and (min-width: 700px) {
  .content-header {
    justify-content: flex-start;
  }
  .content-header h1 { /*{1}*/
    font-size: 28px;
  }
}
</style>
