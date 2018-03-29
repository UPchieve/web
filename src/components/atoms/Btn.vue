<template>
  <button :class="classes" @click="clickHandler">
    {{ label }}
  </button>    
</template>


<script>
export default {
  props: {
    label: String,
    rowMember: Boolean,
    clickHandler: Function
  },
  data() {
    return {
      classes: {
        'v-btn': true,
        'v-btn--row-member': this.rowMember
      }
    } 
  }
}
</script>


<style>
  .v-btn {
    background: var(--c-bg);
    color: var(--c-accent);
    text-align: center;
    text-transform: uppercase;
    font-weight: 600;
    border: 0;
    height: 40px;
    border-radius: 20px;
    padding: 0 20px;
  }
  .v-btn:hover {
    color: #fff;
    background: var(--c-accent);
  }
  .v-btn:focus {
    outline: 0;
  }
  .v-btn--row-member {
    margin-right: 20px; 
  }
</style>