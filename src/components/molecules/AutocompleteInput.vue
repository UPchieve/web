<template>
<div class="autocomplete-input">
  <input required autofocus
    type="text" 
    @keyup="keyupHandler" 
    class="v-form-control" 
    :value="parentModel" 
  >
  <ul class="suggestions" v-show="showSuggestions">
    <li 
      class="suggestions__item" 
      v-for="suggestion in suggestions"
    >
      {{ suggestion }}
    </li>
  </ul>
</div>
</template>


<script>
import NetworkService from '../../services/NetworkService';

export default {
  props: {
    parentModel: String
  },
  data() {
    return {
      showSuggestions: false,
      suggestions: []
    }
  },
  methods: {
    updateParentModel(parent, key, newValue) {
      parent['user'][key] = newValue;
    },
    getSuggestions(query) {
      return NetworkService.getSuggestions(this, {query})
        .then((res) => {
          return Promise.resolve(res.body.suggestions);
        })
        .catch((err) => {
          console.error(err.bodyText);
          return Promise.resolve([]);
        });
    },
    keyupHandler(e) {
      this.updateParentModel(this.$parent, 'highschool', e.target.value);
      this.getSuggestions(e.target.value).then((suggestions) => {
        this.suggestions = suggestions;
        this.showSuggestions = this.suggestions.length > 0 ? true : false;
      }); 
    }
  }
}
</script>


<style>
.autocomplete-input {
  position: relative;
  display: block;
  width: 100%;
}

.v-form-control {
  height: 34px;
  border: 0;
  display: block;
  width: 100%;
  border-bottom: 3px solid #12d2aa;
  margin-bottom: 10px;
}
.v-form-control:focus {
  outline: none;
}

.suggestions {
  position: absolute;
  left: 0;
  top: 34px;
  width: 100%;
  background: #fff;
  padding: 0;
  box-shadow: 0 2px 8px 2px rgba(0,0,0,.3);
  z-index: 1;
}
.suggestions__item {
  height: 34px;
  list-style: none;
  display: block;
  padding: 6px 12px;
  text-align: left;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
}
.suggestions__item:hover {
  background: var(--c-bg);
  font-weight: bold;
}
</style>