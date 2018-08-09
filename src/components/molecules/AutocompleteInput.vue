<template>
<div class="autocomplete-input">
  <input required autofocus
    type="text" 
    @keyup="keyupHandler" 
    class="form-control" 
    :value="parentModel" 
  >
  <div class="suggestions"></div>
</div>
</template>


<script>
export default {
  props: {
    parentModel: String
  },
  methods: {
    updateParentModel(parent, key, newValue) {
      parent['user'][key] = newValue;
    },
    getSuggestions(query) {
      
    },
    keyupHandler(e) {
      this.updateParentModel(this.$parent, 'highschool', e.target.value);
      this.getSuggestions(e.target.value);
    }
  }
}


</script>


<style>
input {
  background: red;
}
</style>