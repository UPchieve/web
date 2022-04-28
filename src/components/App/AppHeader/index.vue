<template>
  <header-template>
    <component v-bind:is="headerComponent" :header-data="headerData" />
  </header-template>
</template>

<script>
import { mapState } from 'vuex'
import HeaderTemplate from './HeaderTemplate'
import DefaultHeader from './DefaultHeader'
import SessionHeader from './SessionHeader'
import RejoinSessionHeader from './RejoinSessionHeader'
import WaitingPeriodHeader from './WaitingPeriodHeader'
import BannedStudentHeader from './BannedStudentHeader'
import ReadingLaunchHeader from './ReadingLaunchHeader'

export default {
  name: 'app-header',
  components: {
    HeaderTemplate,
    DefaultHeader,
    SessionHeader,
    RejoinSessionHeader,
    WaitingPeriodHeader,
    BannedStudentHeader,
    ReadingLaunchHeader,
  },
  computed: {
    ...mapState({
      headerComponent: state => state.app.header.component || 'DefaultHeader',
      headerData: state => state.app.header.data
    })
  }
}
</script>
