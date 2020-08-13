<template>
  <div class="add-school">
    <div class="page-control__button" @click="goBack">
      <span>← Back</span>
    </div>
    <form class="add-school__form" @submit="createSchool">
      <h1 class="add-school__header">Add a new school</h1>

      <div class="add-school__input-row">
        <label for="name" class="uc-form-label">School name</label>
        <input id="name" type="text" v-model="name" />
      </div>

      <div class="add-school__input-row">
        <label for="city" class="uc-form-label">School city</label>
        <input id="city" type="text" v-model="city" />
      </div>

      <div class="add-school__input-row">
        <label class="uc-form-label">School state</label>
        <v-select
          class="add-school__v-select"
          id="state"
          v-model="state"
          :options="states"
          label="label"
          :searchable="true"
          :reduce="option => option.value"
        />
      </div>

      <div class="add-school__input-row">
        <label for="zipCode" class="uc-form-label">School ZIP code</label>
        <input id="zipCode" type="text" v-model="zipCode" />
      </div>

      <div class="add-school__input-row">
        <label for="is-approved" class="uc-form-label">Approval</label>
        <select name="is-approved" id="is-approved" v-model="isApproved">
          <option
            v-for="option in options"
            :value="option.value"
            :key="option.text"
          >
            {{ option.text }}
          </option>
        </select>
      </div>

      <p v-if="error" class="error">{{ error }}</p>
      <button class="uc-form-button" :disabled="invalidForm">
        Create
      </button>
    </form>
  </div>
</template>

<script>
import NetworkService from "@/services/NetworkService";
import { STATES_WITH_ABBREVIATIONS } from "@/consts";

export default {
  name: "AdminAddSchool",

  data() {
    return {
      name: "",
      city: "",
      state: "",
      zipCode: "",
      isApproved: false,
      error: "",
      options: [{ text: "False", value: false }, { text: "True", value: true }]
    };
  },
  computed: {
    states() {
      return STATES_WITH_ABBREVIATIONS;
    },
    invalidForm() {
      return !(this.name && this.city && this.state && this.zipCode);
    }
  },
  methods: {
    async createSchool(event) {
      event.preventDefault();

      const data = {
        name: this.name,
        city: this.city,
        state: this.state ? this.state : "",
        zipCode: this.zipCode,
        isApproved: this.isApproved
      };

      try {
        const {
          body: { schoolId }
        } = await NetworkService.adminCreateSchool(data);
        this.$router.push(`/admin/school/${schoolId}`);
      } catch (error) {
        this.error = "There was a problem creating a new school.";
      }
    },
    goBack() {
      this.$router.go(-1);
    }
  }
};
</script>

<style lang="scss" scoped>
input,
select {
  width: 250px;
  padding: 0.4em 0 0.4em 0.5em;
  border: 1px solid $c-border-grey;
}

.add-school {
  background-color: #fff;
  border-radius: 8px;
  margin: 40px;
  padding: 40px;
  text-align: left;
  max-width: 800px;

  &__form {
    min-height: 500px;
  }

  &__header {
    @include font-category("display-small");
    margin-bottom: 1em;
  }

  &__input-row {
    @include flex-container(row, flex-start, center);
    margin-bottom: 1em;
  }

  &__v-select {
    display: inline-block;
    width: 250px;
  }
}

.uc-form-label {
  width: 100px;
}

.uc-form-button {
  margin-top: 4em;
  padding: 1em 1.6em;
  border: 1px solid $c-border-grey;
}

.error {
  color: $c-error-red;
  margin-bottom: 1em;
}

.page-control__button {
  display: inline-flex;
  align-items: center;
  color: #417db1;
  border-radius: 20px;
  padding: 5px 15px;
  cursor: pointer;

  &:hover {
    background: #f7fcfe;
  }
}
</style>
