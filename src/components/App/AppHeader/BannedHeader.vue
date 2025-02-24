<template>
  <div class="banned_header">
    <div class="banned_header-text">{{ message }}</div>
    <div class="banned_header-document">
      <a :href="linkOut" target="_blank"> Why am I seeing this?</a>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { DOCS_URL } from '@/consts'

export default {
  name: 'banned-header',
  computed: {
    ...mapGetters({
      isVolunteer: 'user/isVolunteer',
      isStudent: 'user/isStudent',
      isTeacher: 'user/isTeacher',
    }),
    linkOut() {
      if (this.isVolunteer) {
        return `${DOCS_URL}/coach-community-guidelines.pdf`
      } else if (this.isStudent) {
        return `${DOCS_URL}/Student-Community-Guidelines.pdf`
      } else if (this.isTeacher) {
        // Add for teachers as well?
      }
      return ''
    },
    message() {
      return 'Your account is under review'
    },
  },
}
</script>

<style lang="scss" scoped>
.banned_header {
  @include header-child;
  @include font-category('display-small');
  color: white;

  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  text-align: center;
  background-color: $c-banned-grey;
}

.banned_header-text {
  font-weight: 600;
  margin-left: auto;
}

.banned_header-document {
  a {
    color: white;
    font-size: 16px;
  }
  margin-left: auto;
}
</style>
