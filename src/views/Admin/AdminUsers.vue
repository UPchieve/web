<template>
  <div class="admin-users">
    <div class="search-panel">
      <div class="col">
        <div class="row">
          <label for="user-id" class="uc-form-label">User ID</label>
          <input id="user-id" type="text" autocomplete="off" v-model="userId" />
        </div>
        <div class="row">
          <label for="first-name" class="uc-form-label">First name</label>
          <input
            id="first-name"
            type="text"
            autocomplete="off"
            v-model="firstName"
          />
        </div>
        <div class="row">
          <label for="last-name" class="uc-form-label">Last name</label>
          <input
            id="last-name"
            type="text"
            autocomplete="off"
            v-model="lastName"
          />
        </div>
        <div class="row">
          <label for="email" class="uc-form-label">Email</label>
          <input id="email" type="text" autocomplete="off" v-model="email" />
        </div>
      </div>
      <div class="row">
        <FormSelect
          id="partner-org"
          name="partner-org"
          class="option-select"
          :options="listedPartnerOrgs"
          label="Partner org"
          v-model="partnerOrg"
          option-text-field="displayName"
        />
      </div>
      <div class="row">
        <label for="email" class="uc-form-label">School</label>
        <input id="email" type="text" autocomplete="off" v-model="school" />
      </div>

      <div>
        <button class="uc-form-button" type="button" @click="getUsers">
          Search
        </button>
      </div>
    </div>
    <page-control
      :page="page"
      :isFirstPage="isFirstPage"
      :isLastPage="isLastPage"
      @nextPage="nextPage"
      @previousPage="previousPage"
    />
    <div class="list-wrapper">
      <div class="list">
        <div class="list-header">
          <p class="list-header__column">User ID</p>
          <p class="list-header__column">Created At</p>
          <p class="list-header__column">Name</p>
          <p class="list-header__column">Email</p>
          <p class="list-header__column">Roles</p>
        </div>
        <user-list-item v-for="user in users" :key="user.id" :user="user" />
      </div>
    </div>
    <page-control
      :page="page"
      :isFirstPage="isFirstPage"
      :isLastPage="isLastPage"
      @nextPage="nextPage"
      @previousPage="previousPage"
    />
  </div>
</template>

<script>
import NetworkService from '@/services/NetworkService'
import PageControl from '@/components/Admin/PageControl.vue'
import UserListItem from '@/components/Admin/UserListItem.vue'
import FormSelect from '@/components/FormInputs/FormSelect.vue'
import { isEmpty, isEqual } from 'lodash-es'

const getUsers = async (userData) => {
  const {
    data: { users, isLastPage },
  } = await NetworkService.adminGetUsers(userData)

  return { users, isLastPage }
}

export default {
  name: 'AdminUsers',

  components: { UserListItem, PageControl, FormSelect },

  data() {
    return {
      page: 1,
      isLastPage: true,
      users: [],
      userId: '',
      firstName: '',
      lastName: '',
      email: '',
      listedPartnerOrgs: [],
      partnerOrg: {},
      partnerSite: '',
      school: '',
    }
  },

  async created() {
    const {
      query: {
        page: pageQuery,
        userId,
        firstName,
        lastName,
        email,
        partnerOrg,
        school,
      },
    } = this.$route
    const page = parseInt(pageQuery)
    this.page = page || this.page
    this.userId = userId || this.userId
    this.firstName = firstName || this.firstName
    this.lastName = lastName || this.lastName
    this.email = email || this.email
    this.school = school || this.school

    const [studentPartnersResponse, volunteerPartnersResponse] =
      await Promise.all([
        NetworkService.adminGetVolunteerPartners(),
        NetworkService.adminGetStudentPartners(),
      ])

    const {
      data: { partnerOrgs: studentPartnerOrgs },
    } = studentPartnersResponse
    const {
      data: { partnerOrgs: volunteerPartnerOrgs },
    } = volunteerPartnersResponse

    this.listedPartnerOrgs = [...studentPartnerOrgs, ...volunteerPartnerOrgs]
    if (partnerOrg) {
      for (const org of this.listedPartnerOrgs) {
        if (org.key === partnerOrg) {
          this.partnerOrg = org
          break
        }
      }
    }

    this.$nextTick(() => {
      document
        .querySelector('.search-panel')
        .addEventListener('keydown', this.keyboardListener)
    })
  },
  mounted() {
    const anyFieldHasData =
      this.userId ||
      this.firstName ||
      this.lastName ||
      this.email ||
      (this.partnerOrg.length && this.partnerOrg.length > 0) ||
      this.school
    if (anyFieldHasData) this.getUsers()
  },
  computed: {
    isFirstPage() {
      return this.page === 1
    },
  },

  methods: {
    setPage(page) {
      this.page = page
      this.users = []
      this.getUsers()
    },

    nextPage() {
      this.setPage(this.page + 1)
    },

    previousPage() {
      this.setPage(this.page - 1)
    },

    async getUsers() {
      const data = {
        userId: this.userId,
        firstName: this.firstName,
        lastName: this.lastName,
        email: this.email,
        partnerOrg: isEmpty(this.partnerOrg) ? '' : this.partnerOrg.key,
        school: this.school,
        page: this.page.toString(),
      }
      if (!isEqual(data, this.$route.query)) {
        this.$router.push({
          path: '/admin/users',
          query: data,
        })
      }
      const { users, isLastPage } = await getUsers(data)
      this.users = users
      this.isLastPage = isLastPage
    },
    keyboardListener(event) {
      const { key, target } = event
      const { tagName } = target
      if (key === 'Enter' && tagName === 'INPUT') {
        this.getUsers()
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

.admin-users {
  background: #fff;
  margin: 10px;
  padding: 10px;
  border-radius: 8px;

  @include breakpoint-above('medium') {
    margin: 40px;
    padding: 40px;
  }
}

.search-panel {
  text-align: left;
}

.row {
  margin-bottom: 1em;
  margin-left: 0;
}

.option-select {
  display: inline-block;
  width: 400px;
}

.list-wrapper {
  overflow-x: auto;
}
.list {
  width: 100%;
  min-width: 750px;
}

.list-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 4px 40px 6px;
  border-bottom: 2px solid #d6e0ef;

  &__column {
    flex: 1;
    min-width: 0;
    padding-right: 12px;
    text-align: left;
    font-weight: 600;
    font-size: 0.8em;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #888;
  }
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
</style>
