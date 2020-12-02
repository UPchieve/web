<template>
  <div class="admin-zip-codes">
    <div class="search-panel">
      <div class="col">
        <div class="row">
          <label for="zip-code" class="uc-form-label">Zip Code</label>
          <input id="zip-code" type="text" v-model="query" />
          <p v-if="error" class="error">{{ error }}</p>
        </div>

        <button
          class="uc-form-button"
          type="button"
          @click="getZipCodes"
          :disabled="!query || query.length !== 5"
        >
          Search
        </button>
      </div>
    </div>

    <div class="zip-code__container" v-if="zipCode.zipCode">
      <p>
        <span class="zip-code__title">Zip Code:</span> {{ zipCode.zipCode }}
      </p>
      <p>
        <span class="zip-code__title">Median Income:</span> {{ medianIncome }}
      </p>
      <p>
        <span class="zip-code__title">Eligible:</span>
        {{ zipCode.isEligible }}
      </p>
    </div>
  </div>
</template>

<script>
import NetworkService from "@/services/NetworkService";

export default {
  name: "AdminZipCodes",

  data() {
    return {
      query: "",
      zipCode: {},
      error: ""
    };
  },

  async mounted() {
    this.$nextTick(() => {
      document
        .querySelector(".search-panel")
        .addEventListener("keydown", this.keyboardListener);
    });
  },

  computed: {
    medianIncome() {
      if (this.zipCode.medianIncome)
        return this.zipCode.medianIncome.toLocaleString();
      return "";
    }
  },

  methods: {
    async getZipCodes() {
      this.error = "";
      try {
        const {
          body: { zipCode }
        } = await NetworkService.adminGetZipCodes(this.query);

        this.zipCode = zipCode;
      } catch (error) {
        this.zipCode = {};
        this.error = "Unable to find a matching zip code";
      }
    },
    keyboardListener(event) {
      const { key, target } = event;
      const { tagName } = target;
      if (key === "Enter" && tagName === "INPUT") {
        this.getZipCodes();
      }
    }
  }
};
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

.admin-zip-codes {
  background: #fff;
  margin: 10px;
  padding: 10px;
  border-radius: 8px;

  @include breakpoint-above("medium") {
    margin: 40px;
    padding: 40px;
  }
}

.search-panel {
  text-align: left;
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
}

.zip-code {
  &__container {
    margin-top: 2em;
  }

  &__title {
    font-weight: 500;
  }
}
</style>
