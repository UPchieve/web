<template>
  <div v-if="school._id" class="school-detail">
    <div class="school-detail__body">
      <div class="page-control__button" @click="goBack">
        <span>← Back</span>
      </div>
      <div class="school-detail__title">
        {{ school.name }}
      </div>
      <div class="school-detail__subtitle">ID: {{ school._id }}</div>
      <div class="school-detail__section">
        <div class="school-detail__section-title">City</div>
        <div>{{ school.city }}</div>
      </div>
      <div class="school-detail__section">
        <div class="school-detail__section-title">State</div>
        <div>{{ school.state }}</div>
      </div>
      <div class="school-detail__section">
        <div class="school-detail__section-title">Zip code</div>
        <div>{{ school.zipCode }}</div>
      </div>
      <div class="school-detail__section">
        <div class="school-detail__section-title">Status</div>
        <div>{{ schoolApprovalStatus }}</div>
        <input
          type="checkbox"
          id="toggle"
          class="checkbox"
          :checked="school.isApproved"
          @change="toggleSchoolApproval"
        />
        <label for="toggle" class="switch"></label>
        <p v-if="error" class="error">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import NetworkService from "@/services/NetworkService";

const getSchool = async schoolId => {
  const {
    body: { school }
  } = await NetworkService.adminGetSchool(schoolId);

  return school;
};

export default {
  name: "AdminSchoolDetail",

  data() {
    return {
      school: {},
      error: ""
    };
  },

  async created() {
    this.school = await getSchool(this.$route.params.schoolId);
  },

  computed: {
    schoolApprovalStatus() {
      return this.school.isApproved ? "Approved" : "Not approved";
    }
  },

  methods: {
    goBack() {
      this.$router.go(-1);
    },
    async toggleSchoolApproval(event) {
      const {
        target: { checked }
      } = event;

      const data = {
        schoolId: this.school._id,
        isApproved: checked
      };

      try {
        await NetworkService.adminUpdateSchoolApproval(data);
        this.school.isApproved = checked;
      } catch (error) {
        this.error = "There was an error updating the school's approval status";
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.school-detail {
  background: #fff;
  margin: 10px;
  border-radius: 8px;
  overflow: hidden;

  @include breakpoint-above("medium") {
    margin: 40px;
  }

  &__body {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 20px 15px;

    @include breakpoint-above("medium") {
      padding: 40px;
    }
  }

  &__title {
    text-transform: capitalize;
    font-size: 24px;
    margin-top: 20px;
  }

  &__subtitle {
    color: $c-secondary-grey;
    font-size: 18px;
    margin-bottom: 20px;
  }

  &__section {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin: 10px 0;
    font-size: 20px;
  }

  &__section-title {
    color: $c-secondary-grey;
    font-size: 16px;
  }
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

.switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;
  background-color: rgba(0, 0, 0, 0.25);
  border-radius: 20px;
  transition: all 0.3s;

  &::after {
    content: "";
    position: absolute;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background-color: white;
    top: 1px;
    left: 1px;
    transition: all 0.3s;
  }
}

.checkbox:checked + .switch::after {
  left: 20px;
}
.checkbox:checked + .switch {
  background-color: $c-success-green;
}
.checkbox {
  display: none;
}

.error {
  @include font-category("helper-text");
  color: $c-error-red;
  text-align: left;
}
</style>
