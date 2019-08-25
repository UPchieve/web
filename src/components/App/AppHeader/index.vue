<template>
  <header-template :important="headerData.important">
    <component v-bind:is="headerComponent" :header-data="headerData" />
  </header-template>
</template>

<script>
import { mapState } from "vuex";
import HeaderTemplate from "./HeaderTemplate";
import DefaultHeader from "./DefaultHeader";
import RejoinSessionHeader from "./RejoinSessionHeader";

export default {
  name: "app-header",
  components: { HeaderTemplate, DefaultHeader, RejoinSessionHeader },
  computed: {
    ...mapState({
      headerComponent: state => state.app.header.component || "DefaultHeader",
      headerData: state => state.app.header.data
    })
  }
};
</script>
