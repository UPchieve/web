<template>
  <div class="accordion-item">
    <div
      class="accordion-item__title"
      @click="slideToggle">
      <span :class="accordionItemBulletClasses">▸</span>{{ label }}
    </div>
    <div :class="accordionItemContentClasses">
      <slot/>
    </div>
  </div>
</template>


<script>
export default {
  props: {
    label: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      accordionItemBulletClasses: {
        'accordion-item__bullet': true,
        'accordion-item__bullet--active': false,
      },
      accordionItemContentClasses: {
        'accordion-item__content': true,
        'accordion-item__content--active': false,
      },
    };
  },
  methods: {
    slideToggle() {
      this.accordionItemBulletClasses['accordion-item__bullet--active'] = !this.accordionItemBulletClasses['accordion-item__bullet--active'];
      this.accordionItemContentClasses['accordion-item__content--active'] = !this.accordionItemContentClasses['accordion-item__content--active'];
    },
  },
};
</script>


<style>
.accordion-item {
  overflow: hidden;
}
.accordion-item__title {
  background: var(--c-backdrop);
  padding: 16px 20px;
  font-weight: bold;
  border-bottom: 2px solid var(--c-shadow-header);
}
.accordion-item__title:hover {
  cursor: pointer;
  background: var(--c-backdrop-clear);
}
.accordion-item__bullet {
  margin-right: 8px;
  position: relative;
  display: inline-block;
  transition: all .2s ease-in-out;
}
.accordion-item__bullet--active {
  transform: rotate(90deg);
}
.accordion-item__content {
  background: var(--c-backdrop-clear);
  transition: all .2s ease-in-out;
  padding: 0 20px;
  height: 0;
}
.accordion-item__content--active {
  padding: 20px 20px;
  height: auto;
}
.accordion-item__content p:last-child {
  margin-bottom: 0;
}
</style>
