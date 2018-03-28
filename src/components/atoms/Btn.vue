<template>
  <button :class="classes">
    {{ label }}
  </button>    
</template>


<script>
export default {
  props: {
    label: String,
    big: Boolean
  },
  data() {
    return {
      classes: {
        'bttn': true,
        'bttn--big': this.big
      }
    } 
  }
}
</script>


<style>
  .bttn {
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
  .bttn:hover {
    color: #fff;
    background: var(--c-accent);
  }
  .bttn:focus {
    outline: 0;
  }
  .bttn--big {
    /* for the bright future :)*/
  }
</style>