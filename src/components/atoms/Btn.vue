<template>
<button :class="classes" @click="clickHandler">
  {{ label }}
</button>    
</template>


<script>
export default {
  props: {
    label: String,
    btnOptionsSecond: Boolean,
    big: Boolean,
    clickHandler: Function
  },
  data() {
    return {
      classes: {
        'v-btn': true,
        'v-btn--btn-options-second': this.btnOptionsSecond,
        'v-btn--big': this.big
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
  line-height: 1;
}
.v-btn:hover {
  color: #fff;
  background: var(--c-accent);
}
.v-btn:focus {
  outline: 0;
}
.v-btn--big {
  width: 100%;
  max-width: 512px;
}
.v-btn--btn-options-second {
  margin-top: 16px; 
}

@media screen and (min-width: 700px) {
  .v-btn--btn-options-second {
    margin-top: 0; 
    margin-right: 20px;
  }
}
</style>