<template>
  <div class="container" style="margin-top:20px;">
  	<div class = "col-sm-8">
    	<whiteboard></whiteboard>
    </div>
    <div class= "col-sm-4">
    	<messager></messager>
    </div>
    
  </div>
</template>

<script>

import Whiteboard from './Whiteboard';
import Messager from './Messager';

export default {
  components: {
    Whiteboard,
    Messager
  }
}
</script>

<style scoped>
</style>
