<template>
  <div class="page-grid">
    <div class="main-content-area">
      <slot name="main-content" />
    </div>
    <div class="navigation-buttons">
      <slot name="previous-button" class="previous-button" />
      <slot name="next-button" class="next-button" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.page-grid {
  display: grid;
  grid-template-rows: [main-content] auto [navigation-buttons] auto auto;
  grid-template-columns: [main] auto;
  justify-items: center;
}

.main-content-area {
  grid-row: main-content;
  grid-column: main;
  display: flex;
  flex-direction: column;
  padding: 16px 32px;
  max-width: 833px;
  width: 100%;
}

.navigation-buttons {
  grid-column: main;
  margin: 16px 8px;
  max-height: 40px;
  justify-content: space-between;
  width: 100%;
  padding: 0px 16px;

  display: inline-grid;
  grid-template-rows: [main] 1fr;
  grid-template-columns: [previous-btn] 1fr [next-btn] 1fr;
  column-gap: 20%;

  .previous-button {
    grid-row: main;
    grid-column: previous-btn;
  }

  .next-button {
    grid-row: main;
    grid-column: next-btn;
  }

  @media screen and (max-width: 1372px) {
    grid-row: navigation-buttons;
    column-gap: 10%;
  }
}
</style>
