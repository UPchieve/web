<template>
  <li class="attachment"><span class="attachment__icon logout">I</span> {{ filename }}</li>
</template>


<script>
export default {
  props: {
    filename: String,
  },
};
</script>


<style>
.attachment {
  display: inline-block;
  padding: 4px;
}
.attachment__icon {
  color: var(--c-accent);
}
</style>
