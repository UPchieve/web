<template>
  <div class="edit-school">
    <button class="back-button" @click="goBack" type="button">← Back</button>

    <form @submit="submitUpdate">
      <div class="edit-school__input-row">
        <label for="name" class="uc-form-label">School name</label>
        <input id="name" type="text" v-model="name" />
      </div>

      <div class="edit-school__input-row">
        <label for="city" class="uc-form-label">School city</label>
        <input id="city" type="text" v-model="city" />
      </div>

      <div class="edit-school__input-row">
        <label class="uc-form-label">School state</label>
        <v-select
          class="edit-school__state-select"
          id="state"
          v-model="state"
          :options="states"
          label="label"
          :searchable="true"
          :reduce="option => option.value"
        />
      </div>
      <div class="edit-school__input-row">
        <label for="zipCode" class="uc-form-label">School ZIP code</label>
        <input id="zipCode" type="text" v-model="zipCode" />
      </div>

      <div class="edit-school__input-row">
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

      <p class="error" v-if="error">{{ error }}</p>
      <button class="uc-form-button">
        Update
      </button>
    </form>
  </div>
</template>

<script>
import NetworkService from "@/services/NetworkService";
import { STATES_WITH_ABBREVIATIONS } from "@/consts";

export default {
  name: "AdminEditSchool",

  props: {
    school: { type: Object, required: true },
    toggleEditMode: { type: Function, required: true },
    getSchool: { type: Function, required: true }
  },

  data() {
    return {
      name: "",
      city: "",
      state: "",
      zipCode: "",
      isApproved: false,
      options: [{ text: "False", value: false }, { text: "True", value: true }],
      error: ""
    };
  },
  async created() {
    this.name = this.school.name;
    this.city = this.school.city;
    this.zipCode = this.school.zipCode;
    this.state = this.school.state;
    this.isApproved = this.school.isApproved;
  },

  methods: {
    async submitUpdate(event) {
      event.preventDefault();

      const data = {
        name: this.name,
        city: this.city,
        state: this.state,
        zipCode: this.zipCode,
        isApproved: this.isApproved
      };

      try {
        await NetworkService.adminUpdateSchool(this.school._id, data);

        this.getSchool();
        this.toggleEditMode();
      } catch (error) {
        this.error = "There was a problem updating the school.";
      }
    },
    goBack() {
      this.toggleEditMode();
    }
  },
  computed: {
    states() {
      return STATES_WITH_ABBREVIATIONS;
    }
  }
};
</script>

<style lang="scss" scoped>
input,
select {
  width: 400px;
  padding: 0.4em 0;
  padding-left: 0.5em;
  border: 1px solid #d6e0ef;
}

.edit-school {
  text-align: left;

  &__input-row {
    @include flex-container(row, flex-start, center);
    margin-bottom: 1em;
  }

  &__state-select {
    display: inline-block;
    width: 400px;
  }
}
.uc-form-label {
  width: 100px;
  text-align: left;
}
.uc-form-button {
  margin-top: 2em;
  padding: 1em 1.6em;
  border: 1px solid $c-border-grey;
}

.back-button {
  border: none;
  background-color: transparent;
  color: #417db1;
  padding: 0.4em 1em;
  margin-bottom: 2em;
  cursor: pointer;

  &:hover {
    border-radius: 20px;
    background: #f7fcfe;
  }
}

.error {
  color: $c-error-red;
  margin: 2em 0;
}
</style>
