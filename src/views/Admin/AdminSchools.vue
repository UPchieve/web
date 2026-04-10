<template>
  <div class="schools">
    <div class="schools__search-panel">
      <form @submit.prevent="submitQuery" autocomplete="off">
        <FormInput
          v-model="name"
          label="School Name"
          placeholder="School Name"
          :isRequired="false"
        />
        <FormInput
          v-model="city"
          label="School City"
          placeholder="School City"
          :isRequired="false"
        />
        <FormInput
          v-model="ncesId"
          label="NCES Id"
          placeholder="NCES Id"
          :isRequired="false"
        />
        <FormSearchableSelect
          v-model="state"
          label="School State"
          name="state"
          placeholder="School State"
          optionTextField="label"
          :options="states"
          :reduce="(option) => option.value"
        />
        <FormSelect
          v-model="isPartner"
          name="isPartner"
          label="Is Partner School"
          placeholder="Is Partner School"
          optionTextField="label"
          :options="isPartnerOptions"
          :reduce="(option) => option.value"
        />

        <button class="uc-form-button" type="submit" @click="submitQuery">
          Search
        </button>
      </form>
    </div>
    <loader v-if="isLoading" class="uc-column justify-center items-center" />
    <div v-else>
      <div class="list-wrapper">
        <div class="list">
          <page-control
            :page="page"
            :perPageLimit="limit"
            :totalCount="totalCount"
            :isFirstPage="isFirstPage"
            :isLastPage="isLastPage"
            @nextPage="nextPage"
            @previousPage="previousPage"
          />
          <table>
            <tr>
              <th class="col-lg">School Name</th>
              <th class="col-md">Location</th>
              <th class="col-sm">Admin Approved</th>
              <th class="col-sm">Approved</th>
              <th class="col-sm">Partner</th>
            </tr>
            <school-list-item
              v-for="school in schools"
              :key="school.id"
              :school="school"
            />
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { toastController } from '@ionic/vue'
import NetworkService from '@/services/NetworkService'
import FormInput from '@/components/FormInput.vue'
import FormSearchableSelect from '@/components/FormInputs/FormSearchableSelect.vue'
import FormSelect from '@/components/FormInputs/FormSelect.vue'
import Loader from '@/components/Loader.vue'
import PageControl from '@/components/Admin/PageControl.vue'
import SchoolListItem from '@/components/Admin/SchoolListItem.vue'
import { STATES_WITH_ABBREVIATIONS } from '@/consts'

export default {
  name: 'AdminSchools',
  components: {
    FormInput,
    FormSearchableSelect,
    FormSelect,
    Loader,
    PageControl,
    SchoolListItem,
  },

  data() {
    return {
      isLoading: false,
      page: 1,
      limit: 15,
      totalCount: undefined,
      isLastPage: true,
      schools: [],
      name: '',
      city: '',
      ncesId: '',
      state: '',
      isPartner: '',
      isPartnerOptions: [
        { label: 'True', value: 'true' },
        { label: 'False', value: 'false' },
        { label: 'All', value: '' },
      ],
    }
  },
  async created() {
    const {
      query: { page: pageQuery, name, city, ncesId, state, isPartner },
    } = this.$route
    this.page = parseInt(pageQuery ?? this.page)
    this.name = name ?? this.name
    this.city = city ?? this.city
    this.ncesId = ncesId ?? this.ncesId
    this.state = state ?? this.state
    this.isPartner = isPartner ?? this.isPartner

    await this.getSchools()
  },
  computed: {
    isFirstPage() {
      return this.page === 1
    },
    states() {
      return STATES_WITH_ABBREVIATIONS
    },
  },
  methods: {
    setPage(page) {
      this.page = page
      this.schools = []
      this.getSchools()
    },
    nextPage() {
      this.setPage(this.page + 1)
    },
    previousPage() {
      this.setPage(this.page - 1)
    },
    submitQuery() {
      this.page = 1
      this.getSchools()
    },
    async getSchools() {
      this.isLoading = true

      try {
        const queryData = {
          name: this.name,
          city: this.city,
          state: this.state,
          ncesId: this.ncesId,
          isPartner: this.isPartner,
          page: this.page,
        }
        this.$router.push({
          path: '/admin/schools',
          query: queryData,
        })

        const {
          data: { totalCount, schools, isLastPage },
        } = await NetworkService.adminGetSchools({
          ...queryData,
          limit: this.limit,
        })
        this.totalCount = totalCount
        this.schools = schools
        this.isLastPage = isLastPage
      } catch {
        const toast = await toastController.create({
          message: 'Failed to get schools.',
          color: 'danger',
          duration: 2000,
          position: 'bottom',
        })
        await toast.present()
      } finally {
        this.isLoading = false
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.schools {
  background-color: #fff;
  margin: 10px;
  padding: 10px;
  border-radius: 8px;

  @include breakpoint-above('medium') {
    margin: 40px;
    padding: 40px;
  }

  &__search-panel {
    margin: auto;
    max-width: 700px;
  }
}

.list-wrapper {
  overflow-x: scroll;
}

.list {
  width: 100%;
}

.uc-form-button {
  margin: 2em 0 4em 0;
  padding: 1em 1.6em;
  border: 1px solid $c-border-grey;
}

table {
  table-layout: fixed;
  width: 100%;

  .col-lg {
    width: 45%;
  }

  .col-md {
    width: 30%;
  }

  .col-sm {
    width: 15%;
  }
}
</style>
