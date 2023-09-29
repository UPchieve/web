<template>
  <header-template>
    <component v-bind:is="headerComponent" :header-data="headerData" />
  </header-template>
</template>

<script>
import { mapState } from 'vuex'
import HeaderTemplate from './HeaderTemplate.vue'
import DefaultHeader from './DefaultHeader/index.vue'
import SessionHeader from './SessionHeader.vue'
import RejoinSessionHeader from './RejoinSessionHeader.vue'
import WaitingPeriodHeader from './WaitingPeriodHeader.vue'
import BannedStudentHeader from './BannedStudentHeader.vue'
import DashboardBannerHeader from './DashboardBannerHeader.vue'
import EarnCertificationsHeader from './EarnCertificationsHeader.vue'

export default {
  name: 'app-header',
  components: {
    HeaderTemplate,
    DefaultHeader,
    SessionHeader,
    RejoinSessionHeader,
    WaitingPeriodHeader,
    BannedStudentHeader,
    DashboardBannerHeader,
    EarnCertificationsHeader,
  },
  computed: {
    ...mapState({
      headerComponent: state => state.app.header.component || 'DefaultHeader',
      headerData: state => state.app.header.data,
    }),
  },
}
</script>
