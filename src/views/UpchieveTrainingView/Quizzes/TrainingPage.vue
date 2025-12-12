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
  grid-template-columns: [main] 1fr;
}
.main-content-area {
  grid-row: main-content;
  grid-column: main;
  display: flex;
  flex-direction: column;
  padding: 2% 4%;
  max-width: 833px;
  min-width: 800px;

  @include breakpoint-below(huge) {
    min-width: 500px;
  }
  @include breakpoint-below(medium) {
    min-width: 300px;
  }
}

.navigation-buttons {
  grid-column: main;
  margin: 16px 5%;
  max-height: 40px;
  justify-content: space-between;

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

  @include breakpoint-below('medium') {
    grid-row: navigation-buttons;
    column-gap: 10%;
    padding-bottom: 140px;
  }
}
</style>
