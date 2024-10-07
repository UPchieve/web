<template>
  <div class="system-message">
    <div class="info">i</div>
    <slot></slot>
  </div>
</template>

<style lang="scss" scoped>
.system-message {
  border-radius: 20px;
  padding: 10px 16px;
  max-width: 100%;
  background-color: $selected-green;
  border: 1px solid $c-success-green;
  display: flex;
  gap: 12px;
}

.info {
  font-size: 18px;
  font-weight: 500;
  border-radius: 1rem;
  line-height: 1rem;
  background-color: $c-success-green;
  color: white;
  width: 23px;
  height: 23px;
  padding: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
