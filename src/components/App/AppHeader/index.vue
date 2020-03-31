<template>
  <header-template :important="headerData.important">
    <component v-bind:is="headerComponent" :header-data="headerData" />
  </header-template>
</template>

<script>
import { mapState } from "vuex";
import HeaderTemplate from "./HeaderTemplate";
import DefaultHeader from "./DefaultHeader";
import SessionHeader from "./SessionHeader";
import RejoinSessionHeader from "./RejoinSessionHeader";
import WaitingPeriodHeader from "./WaitingPeriodHeader";

export default {
  name: "app-header",
  components: {
    HeaderTemplate,
    DefaultHeader,
    SessionHeader,
    RejoinSessionHeader,
    WaitingPeriodHeader
  },
  computed: {
    ...mapState({
      headerComponent: state => state.app.header.component || "DefaultHeader",
      headerData: state => state.app.header.data
    })
  }
};
</script>
