<template>
  <div>
    <autocomplete
      :search="autocompleteSchool"
      :get-result-value="getSchoolDisplayName"
      base-class="uc-autocomplete"
      auto-select
      :placeholder="placeholder"
      :aria-label="placeholder"
      @submit="handleSelectHighSchool"
      @input="setHighSchool"
    ></autocomplete>
  </div>
</template>

<script>
import Autocomplete from '@trevoreyre/autocomplete-vue'
import NetworkService from '@/services/NetworkService'

export default {
  props: {
    setHighSchool: {
      type: Function,
      required: true
    },
    placeholder: {
      type: String
    }
  },
  components: {
    Autocomplete
  },

  methods: {
    async autocompleteSchool(input) {
      if (input.length < 3) return []

      const response = await NetworkService.searchSchool(this, {
        query: input
      })
      const {
        body: { results: schools }
      } = response
      return schools
    },
    getSchoolDisplayName(school) {
      return `${school.name} (${school.city}, ${school.state})`
    },
    handleSelectHighSchool(school) {
      this.setHighSchool(school)
    }
  }
}
</script>

<style lang="scss" scoped></style>
