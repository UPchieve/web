<template>
  <div class="BannedStudentHeader">
    <div class="BannedStudentHeader-text">{{ message }}</div>
    <div class="BannedStudentHeader-document">
      <a :href="policyURL" target="_blank"> Why am I seeing this?</a>
    </div>
  </div>
</template>

<script>
import { DOCS_URL } from '@/consts'

export default {
  name: 'banned-student-header',
  data() {
    return {
      policyURL: `${DOCS_URL}/Student-Community-Guidelines.pdf`,
      message: 'Your account is under review'
    }
  }
}
</script>

<style lang="scss" scoped>
.BannedStudentHeader {
  @include header-child;
  @include font-category('display-small');
  color: white;

  display: grid;
  align-content: center;
  grid-template-columns: 1fr minmax(200px, 1fr) minmax(100px, 1fr);
  position: relative;
  background-color: $c-banned-grey;
}

.BannedStudentHeader-text {
  font-weight: 600;
  grid-column: 2;
}

.BannedStudentHeader-document {
  a {
    color: white;
    font-size: 16px;
  }
  grid-column: 3;
  justify-self: right;
  align-self: center;
}
</style>
