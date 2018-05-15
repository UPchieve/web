<template>
<div class="full-text-template">
  <content-header :headerTitle="headerTitle"></content-header>  
  <div class="full-text-template__content">
    <div class="full-text-template__wrap">
      <slot></slot>
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
  }
}
</script>


<style>
.full-text-template__content {
  text-align: left;
}

.full-text-template__wrap {
  max-width: 800px;
  padding: 40px 20px;
}

section {
  margin-bottom: 64px;
}

/*
* @notes
* [1] Refactoring candidate: this shoudln't be done, but I had to do it since 
*     Bootstap interferes with this :/
*/
.full-text-template__content h2 { /* [1] */
  font-weight: bold;
  font-size: 20px;
  margin-top: 0;
}

.full-text-template__content p { /* [1] */
  margin-bottom: 20px;
}

.v-panel {
  background: var(--c-backdrop);
  padding: 20px;
  margin-bottom: 20px;
}
</style>