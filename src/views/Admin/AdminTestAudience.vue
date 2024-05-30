<template>
  <div class="admin-test-audience">
    <div class="search-panel">
      This tool uses "user value" in Gleap - "add to audience" sets value to $1,
      "remove from audience" sets value to "not set".
      <br />
      <br />
      <div class="col">
        <div class="row">
          <label for="user-id" class="uc-form-label">User Email</label>
          <input id="user-id" type="text" v-model="query" />
          <p v-if="error" class="error">{{ error }}</p>
        </div>
        <button
          class="uc-form-button"
          type="button"
          @click="addToAudience"
          :disabled="!query ? true : null"
        >
          Add To Audience
        </button>
        <button
          class="uc-form-button"
          type="button"
          @click="removeFromAudience"
          :disabled="!query ? true : null"
        >
          Remove From Audience
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import NetworkService from '@/services/NetworkService'
import Gleap from 'gleap'

export default {
  name: 'AdminTestAudience',

  data() {
    return {
      query: '',
      error: '',
    }
  },
  async mounted() {},
  computed: {},

  methods: {
    async addToAudience() {
      this.error = ''
      try {
        const user = await NetworkService.adminGetUserIdFromEmail(this.query)
        Gleap.identify(user.data.userId, {
          value: 1,
        })
      } catch (error) {
        this.error = 'An error occurred'
      }
    },
    async removeFromAudience() {
      this.error = ''
      try {
        const user = await NetworkService.adminGetUserIdFromEmail(this.query)
        Gleap.identify(user.data.userId, {
          value: 0,
        })
      } catch (error) {
        this.error = 'An error occurred'
      }
    },
  },
}
</script>

<style lang="scss" scoped>
input {
  width: 400px;
  padding: 0.4em 0;
  padding-left: 0.5em;
  border: 1px solid #d6e0ef;
}

p {
  text-align: left;
}

.admin-test-audience {
  background: #fff;
  margin: 10px;
  padding: 10px;
  border-radius: 8px;

  @include breakpoint-above('medium') {
    margin: 40px;
    padding: 40px;
  }
}

.error {
  color: $c-error-red;
}

.row {
  margin-bottom: 1em;
  margin-left: 0;
}

.uc-form-label {
  width: 100px;
  text-align: left;
}

.uc-form-button {
  margin-top: 1em;
  padding: 1em 1.6em;
  border: 1px solid $c-border-grey;
  margin-right: 1em;
}
</style>
