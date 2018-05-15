<template>
<div class="accordion-item">
  <div class="accordion-item__title">
      <span class="accordion-item__bullet">▸</span>{{ label }}
  </div>
  <div class="accordion-item__content">
    <slot></slot>
  </div>
</div>
</template>


<script>
export default {
  props: {
    label: String
  }
}
</script>


<style>
.accordion-item {

}
.accordion-item__title {
  background: var(--c-backdrop);
  padding: 16px 20px;
  font-weight: bold;
  border-bottom: 2px solid var(--c-shadow-header);
}
.accordion-item__bullet {
  margin-right: 8px;
}
.accordion-item__content {
  background: var(--c-backdrop-clear);
  padding: 20px;
  border-bottom: 2px solid var(--c-shadow-header);  
}
.accordion-item__content p:last-child {
  margin-bottom: 0;
}
.accordion-item:last-child {
  margin-bottom: 20px;
}
</style>