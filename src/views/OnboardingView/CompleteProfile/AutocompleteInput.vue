<template>
  <div class="autocomplete-input">
    <input
      required
      autofocus
      type="text"
      placeholder="Search your school"
      class="v-form-control"
      :value="parentModel"
      @keyup="debouncedKeyupHandler"
      @focusout="focusoutHandler"
      @focusin="focusinHandler"
    />
    <span class="v-form-control__icon">▾</span>
    <ul class="suggestions" v-show="showSuggestions" @click="useSuggestion">
      <li
        class="suggestions__item"
        v-for="suggestion in suggestions"
        v-bind:key="suggestion"
      >
        {{ suggestion }}
      </li>
    </ul>
  </div>
</template>

<script>
import _ from "lodash";
import NetworkService from "@/services/NetworkService";

const SCHOOL_NOT_FOUND_MSG = "I coudn't find my school";

export default {
  props: {
    parentModel: String
  },
  data() {
    return {
      showSuggestions: false,
      suggestions: []
    };
  },
  methods: {
    updateParentModel(parent, key, newValue) {
      parent["user"][key] = newValue;
    },
    getSuggestions(query) {
      return NetworkService.getSuggestions(this, { query })
        .then(res => {
          return Promise.resolve(res.body.suggestions);
        })
        .catch(() => {
          return Promise.resolve([]);
        });
    },
    debouncedKeyupHandler(e) {
      _.debounce(this.keyupHandler, 400).call(this, e);
    },
    keyupHandler(e) {
      const query = e.target.value;

      this.updateParentModel(this.$parent, "highschool", query);

      this.getSuggestions(query).then(suggestions => {
        if (suggestions.length > 0) {
          this.suggestions = suggestions;
        } else {
          this.suggestions = query !== "" ? [SCHOOL_NOT_FOUND_MSG] : [];
        }
        this.showSuggestions = this.suggestions.length > 0 ? true : false;
      });
    },
    useSuggestion(e) {
      this.updateParentModel(this.$parent, "highschool", e.target.innerText);
      this.showSuggestions = false;
    },
    /**
     * @note {1} This timeout is needed because when the user selects a school,
     *           both useSuggestion() and focusoutHandler() get called, and in
     *           that case, I need this.showSuggestions to be updated a little
     *           later to be able to use e.target.innerText inside useSuggestion()
     */
    focusoutHandler() {
      setTimeout(() => {
        // {1}
        this.showSuggestions = false;
      }, 100);
    },
    focusinHandler() {
      if (
        this.suggestions.length > 0 &&
        this.suggestions[0] !== SCHOOL_NOT_FOUND_MSG
      ) {
        this.showSuggestions = true;
      } else {
        this.showSuggestions = false;
      }
    }
  }
};
</script>

<style lang="scss">
.autocomplete-input {
  position: relative;
  display: block;
  width: 100%;
}

.v-form-control {
  height: 34px;
  display: block;
  width: 100%;
  border: 1px solid $c-accent;
  padding: 6px 12px;
  margin-bottom: 10px;
}
.v-form-control:focus {
  outline: none;
}
.v-form-control__icon {
  position: absolute;
  font-size: 12px;
  right: 6px;
  top: 8px;
}

.suggestions {
  position: absolute;
  left: 0;
  top: 34px;
  width: 100%;
  background: #fff;
  padding: 0;
  box-shadow: 0 4px 6px 2px rgba(0, 0, 0, 0.3);
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
  background: $c-bg;
  font-weight: bold;
}
</style>
