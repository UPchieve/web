<template>
  <div class="card">
    <h4 class="title"><slot name="header"></slot></h4>
    <div class="content">
      <slot />
    </div>
    <div v-if="$slots.footer" class="footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<style scoped lang="scss">
.card {
  background-color: white;
  border-radius: 4px;
  border: rgb(224, 224, 224) 1px solid;
  display: flex;
  flex-direction: column;
}
.title {
  padding: 0.5em 1em;
  border-bottom: rgb(224, 224, 224) 1px solid;
  line-height: 1.11em;
  font-size: 18px;
  font-weight: 700;
  text-align: start;
}
.content {
  padding: 1em;
  flex-grow: 1;
}

.footer {
  padding: 0.5em 1em;
  border-top: rgb(224, 224, 224) 1px solid;
}
</style>
